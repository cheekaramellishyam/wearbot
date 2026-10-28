import { useState, useRef, useEffect, useId } from "react";
import {
  Camera,
  Check,
  FlipHorizontal,
  Loader2,
  RefreshCw,
  Upload,
  AlertCircle,
  Video,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CameraModalProps {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  label: string;
}

interface VideoDevice {
  deviceId: string;
  label: string;
}

export function CameraModal({ open, onClose, onCapture, label }: CameraModalProps) {
  const modalId = useId();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const isMobile =
    typeof window !== "undefined" &&
    (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (window.matchMedia && window.matchMedia("(pointer: coarse)").matches));

  const [devices, setDevices] = useState<VideoDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [activeLabel, setActiveLabel] = useState<string>("");
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    isMobile ? "environment" : "user"
  );
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setActiveStream(null);
  };

  const getDevicesList = async (): Promise<VideoDevice[]> => {
    if (!navigator.mediaDevices?.enumerateDevices) return [];
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = all
        .filter((d) => d.kind === "videoinput")
        .map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${i + 1}`,
        }));
      setDevices(videoInputs);
      return videoInputs;
    } catch {
      return [];
    }
  };

  const startStream = async (deviceIdToUse?: string, mode?: "environment" | "user") => {
    stopStream();
    setLoading(true);
    setError(null);
    setPreviewUrl(null);

    const currentMode = mode || facingMode;

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported in this browser context.");
      }

      let stream: MediaStream | null = null;

      // 1. If explicit device ID was requested, use it
      if (deviceIdToUse) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: deviceIdToUse } },
            audio: false,
          });
        } catch (errExplicit) {
          console.warn("Failed to open requested deviceId, falling back:", errExplicit);
        }
      }

      // 2. If no stream yet, try with preferred constraints
      if (!stream) {
        const constraints: MediaStreamConstraints = isMobile
          ? {
              video: { facingMode: { ideal: currentMode } },
              audio: false,
            }
          : {
              video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
              audio: false,
            };

        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (errPref) {
          console.warn("Preferred constraints failed, trying generic video stream:", errPref);
        }
      }

      // 3. Fallback to simplest generic video constraint
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      // Inspect active video track
      const videoTrack = stream.getVideoTracks()[0];
      const trackLabel = videoTrack?.label || "";
      setActiveLabel(trackLabel);

      // Now query device list with labels (available after permission is granted)
      const currentDevices = await getDevicesList();

      // Check if current camera is OBS Virtual Camera or a virtual dummy
      const isVirtual =
        trackLabel.toLowerCase().includes("obs") ||
        trackLabel.toLowerCase().includes("virtual") ||
        trackLabel.toLowerCase().includes("dummy");

      // If OBS virtual camera was chosen automatically by Chrome and a physical camera exists,
      // auto-switch to the physical camera!
      if (!deviceIdToUse && isVirtual && currentDevices.length > 1) {
        const physicalCam = currentDevices.find(
          (d) =>
            !d.label.toLowerCase().includes("obs") &&
            !d.label.toLowerCase().includes("virtual") &&
            !d.label.toLowerCase().includes("dummy")
        );
        if (physicalCam && physicalCam.deviceId) {
          console.log("Auto-switching from OBS Virtual Camera to physical webcam:", physicalCam.label);
          stream.getTracks().forEach((t) => t.stop());
          const newStream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: physicalCam.deviceId } },
            audio: false,
          });
          streamRef.current = newStream;
          setActiveStream(newStream);
          setSelectedDeviceId(physicalCam.deviceId);
          setActiveLabel(newStream.getVideoTracks()[0]?.label || physicalCam.label);
          setLoading(false);
          setError(null);
          return;
        }
      }

      streamRef.current = stream;
      setActiveStream(stream);
      if (videoTrack?.getSettings?.()?.deviceId) {
        setSelectedDeviceId(videoTrack.getSettings().deviceId!);
      }
      setLoading(false);
      setError(null);
    } catch (err: any) {
      console.warn("Camera start failed completely:", err);
      const isDenied =
        err?.name === "NotAllowedError" ||
        err?.name === "SecurityError" ||
        err?.name === "PermissionDeniedError";
      const isNotFound = err?.name === "NotFoundError" || err?.name === "DevicesNotFoundError";
      const isInUse = err?.name === "NotReadableError" || err?.name === "TrackStartError";

      let errorMsg = "Could not start camera stream.";
      if (isDenied) {
        errorMsg = "Camera access blocked by browser or frame permissions. You can snap a photo directly using the button below.";
      } else if (isNotFound) {
        errorMsg = "No camera found on this device. You can choose or capture a photo below.";
      } else if (isInUse) {
        errorMsg = "Camera is currently in use by another app (like Zoom or Teams). Close other apps and retry.";
      } else if (err?.message) {
        errorMsg = err.message;
      }

      setError(errorMsg);
      setLoading(false);
    }
  };

  // Synchronize stream with video element whenever video element or activeStream changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeStream) return;

    video.srcObject = activeStream;

    const handleLoadedMetadata = () => {
      video.play().catch((playErr) => {
        console.warn("Video auto-play suppressed, will play on click:", playErr);
      });
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    if (video.readyState >= 2) {
      video.play().catch(() => {});
    }

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [activeStream]);

  // Lifecycle on modal open / close
  useEffect(() => {
    if (open) {
      startStream(selectedDeviceId, facingMode);
    } else {
      stopStream();
      setPreviewUrl(null);
      setCapturedBlob(null);
      setError(null);
    }
    return () => {
      stopStream();
    };
  }, [open]);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Flip horizontally if front camera for natural mirroring
    const isFrontCamera =
      facingMode === "user" ||
      activeLabel.toLowerCase().includes("front") ||
      activeLabel.toLowerCase().includes("user");

    if (isFrontCamera) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          toast.error("Failed to capture photo");
          return;
        }
        setCapturedBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
      },
      "image/jpeg",
      0.92
    );
  };

  const handleConfirm = () => {
    if (!capturedBlob) return;
    const filename = `photo-${label.toLowerCase()}-${Date.now()}.jpg`;
    const file = new File([capturedBlob], filename, { type: "image/jpeg" });
    onCapture(file);
    onClose();
  };

  const handleRetake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setCapturedBlob(null);
    startStream(selectedDeviceId, facingMode);
  };

  const handleSwitchCamera = () => {
    if (devices.length > 1) {
      const currentIdx = devices.findIndex((d) => d.deviceId === selectedDeviceId);
      const nextIdx = (currentIdx + 1) % devices.length;
      const nextDevice = devices[nextIdx];
      setSelectedDeviceId(nextDevice.deviceId);
      startStream(nextDevice.deviceId);
      toast.info(`Switched to: ${nextDevice.label}`);
    } else {
      const nextMode = facingMode === "environment" ? "user" : "environment";
      setFacingMode(nextMode);
      startStream(undefined, nextMode);
    }
  };

  const handleNativeFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      onCapture(files[0]);
      onClose();
    }
    e.target.value = "";
  };

  const isObsActive =
    activeLabel.toLowerCase().includes("obs") ||
    activeLabel.toLowerCase().includes("virtual");

  const physicalCameras = devices.filter(
    (d) =>
      !d.label.toLowerCase().includes("obs") &&
      !d.label.toLowerCase().includes("virtual") &&
      !d.label.toLowerCase().includes("dummy")
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg p-4 sm:p-6 overflow-hidden">
        <DialogHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pr-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Camera className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Take a Photo for {label}</DialogTitle>
                <DialogDescription className="sr-only">Take a photo for {label}</DialogDescription>
              </div>
            </div>

            {/* Camera device picker if multiple cameras exist */}
            {devices.length > 1 && !previewUrl && (
              <div className="relative inline-block self-start sm:self-auto">
                <select
                  value={selectedDeviceId}
                  onChange={(e) => {
                    const devId = e.target.value;
                    setSelectedDeviceId(devId);
                    startStream(devId);
                  }}
                  className="appearance-none rounded-md border border-line bg-card py-1 pl-2 pr-6 text-[11px] font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer focus:outline-none"
                  aria-label="Select camera device"
                >
                  {devices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label.length > 24 ? `${d.label.slice(0, 24)}…` : d.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="relative mt-2 aspect-[4/3] w-full overflow-hidden rounded-xl bg-black flex items-center justify-center border border-line">
          {/* OBS Virtual Camera alert notice with switch button */}
          {isObsActive && !previewUrl && !loading && (
            <div className="absolute top-2 inset-x-2 z-20 flex items-center justify-between gap-2 rounded-lg bg-amber-500/95 px-3 py-2 text-white shadow-md backdrop-blur-xs">
              <div className="flex items-center gap-1.5 text-xs font-semibold leading-tight">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>OBS Virtual Camera active</span>
              </div>
              {physicalCameras.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    const target = physicalCameras[0];
                    setSelectedDeviceId(target.deviceId);
                    startStream(target.deviceId);
                    toast.success(`Switched to ${target.label}`);
                  }}
                  className="rounded bg-black/60 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-black/80 transition-colors cursor-pointer shrink-0"
                >
                  Switch to Webcam
                </button>
              ) : (
                <span className="text-[10px] opacity-90">Start camera in OBS</span>
              )}
            </div>
          )}

          {previewUrl ? (
            <img src={previewUrl} alt="Captured preview" className="h-full w-full object-cover" />
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className={`h-full w-full object-cover ${
                  facingMode === "user" ? "scale-x-[-1]" : ""
                } ${loading || error ? "opacity-0" : "opacity-100 transition-opacity"}`}
              />

              {loading && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 text-white">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="text-xs font-medium">Starting camera…</span>
                </div>
              )}

              {/* Viewfinder crosshairs */}
              {!loading && !error && (
                <div className="pointer-events-none absolute inset-6 rounded-lg border-2 border-dashed border-white/40" />
              )}
            </>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white bg-black/90">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 mb-2">
                <AlertCircle className="h-6 w-6 text-amber-400" />
              </div>
              <p className="text-sm font-semibold mb-1">Live Camera Unavailable</p>
              <p className="text-xs text-white/70 max-w-sm mb-4 leading-relaxed">
                {error}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => startStream(selectedDeviceId, facingMode)}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-white/30 bg-white/10 hover:bg-white/20 text-white py-2 px-3.5 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retry Camera
                </button>

                {/* Direct native camera trigger: genuine user touch on label launches phone camera app */}
                <label
                  htmlFor={`cam-capture-${modalId}`}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-primary text-primary-foreground py-2 px-4 text-xs font-semibold shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>Snap with Phone Camera</span>
                  <input
                    id={`cam-capture-${modalId}`}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="sr-only"
                    onChange={handleNativeFileInput}
                  />
                </label>

                {/* Direct file/gallery chooser */}
                <label
                  htmlFor={`file-upload-${modalId}`}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-white/30 bg-white/5 hover:bg-white/15 text-white py-2 px-3.5 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Choose Photo</span>
                  <input
                    id={`file-upload-${modalId}`}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleNativeFileInput}
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="mt-4 flex items-center justify-between gap-3">
          {previewUrl ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-line py-2.5 px-4 text-xs font-semibold hover:bg-muted transition-colors cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retake
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-primary text-primary-foreground py-2.5 px-4 text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
              >
                <Check className="h-4 w-4" />
                Use Photo
              </button>
            </>
          ) : (
            <>
              {/* Switch camera / Flip camera */}
              <button
                type="button"
                onClick={handleSwitchCamera}
                disabled={loading || Boolean(error)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-card hover:bg-muted disabled:opacity-40 transition-colors cursor-pointer"
                title={devices.length > 1 ? "Switch Camera Device" : "Flip Camera (Front / Back)"}
                aria-label="Switch Camera"
              >
                <FlipHorizontal className="h-5 w-5" />
              </button>

              {/* Shutter Button centered */}
              <button
                type="button"
                onClick={handleCapture}
                disabled={loading || Boolean(error)}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
                title="Capture Photo"
                aria-label="Capture Photo"
              >
                <div className="h-11 w-11 rounded-full border-2 border-background flex items-center justify-center">
                  <div className="h-8 w-8 rounded-full bg-background" />
                </div>
              </button>

              {/* Direct native camera shortcut on phone */}
              <label
                htmlFor={`shutter-native-${modalId}`}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-card hover:bg-muted transition-colors cursor-pointer"
                title="Snap with device camera app"
                aria-label="Snap with device camera app"
              >
                <Camera className="h-5 w-5 text-foreground" />
                <input
                  id={`shutter-native-${modalId}`}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={handleNativeFileInput}
                />
              </label>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
