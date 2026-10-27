import { useState, useRef, useEffect } from "react";
import { Camera, Check, FlipHorizontal, Loader2, RefreshCw } from "lucide-react";
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

export function CameraModal({ open, onClose, onCapture, label }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);

  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startStream = async (mode: "environment" | "user") => {
    stopStream();
    setLoading(true);
    setError(null);
    setPreviewUrl(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Live camera stream is not supported in this frame.");
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setLoading(false);
    } catch (err: any) {
      console.warn("Camera start error:", err);
      // Fallback try with generic constraints if environment facing fails
      if (mode === "environment") {
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
          streamRef.current = fallbackStream;
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            await videoRef.current.play();
          }
          setLoading(false);
          return;
        } catch (e2) {}
      }

      setError(
        err?.message?.includes("Permission") || err?.name === "NotAllowedError"
          ? "Camera permission denied. Tap below to open your device camera."
          : "Live stream restricted. Tap below to open your device camera."
      );
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      startStream(facingMode);
    } else {
      stopStream();
      setPreviewUrl(null);
      setCapturedBlob(null);
      setError(null);
    }
    return () => {
      stopStream();
    };
  }, [open, facingMode]);

  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Flip horizontally if front camera for natural mirroring
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

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
    startStream(facingMode);
  };

  const toggleCamera = () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
  };

  const handleNativeFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      onCapture(files[0]);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg p-4 sm:p-6 overflow-hidden">
        <DialogHeader className="pb-2">
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Camera className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Take a Photo for {label}</DialogTitle>
                <DialogDescription className="sr-only">Take a photo for {label}</DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="relative mt-2 aspect-[4/3] w-full overflow-hidden rounded-xl bg-black flex items-center justify-center border border-line">
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
                } ${loading ? "opacity-0" : "opacity-100 transition-opacity"}`}
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
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white bg-black/85">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 mb-3">
                <Camera className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm font-semibold mb-1">Device Camera</p>
              <p className="text-xs text-white/70 max-w-xs mb-4">
                Tap below to take a photo using your device camera.
              </p>
              <button
                type="button"
                onClick={() => nativeCameraInputRef.current?.click()}
                className="flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground py-2.5 px-6 text-xs font-semibold shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
              >
                <Camera className="h-4 w-4" />
                Open Device Camera
              </button>
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
              {/* Flip camera */}
              <button
                type="button"
                onClick={toggleCamera}
                disabled={loading || Boolean(error)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-card hover:bg-muted disabled:opacity-40 transition-colors cursor-pointer"
                title="Flip Camera (Front / Back)"
                aria-label="Flip Camera"
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

              {/* Balancing spacer to keep shutter centered */}
              <div className="h-11 w-11" aria-hidden />
            </>
          )}

          {/* Hidden native input with capture="environment" for direct mobile device camera */}
          <input
            ref={nativeCameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleNativeFileInput}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
