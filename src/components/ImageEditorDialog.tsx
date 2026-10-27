import { useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { FlipHorizontal2, FlipVertical2, Loader2, RotateCcw, RotateCw } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { cropToFile, loadImage, transformImage } from "@/lib/image-tools";

const PRESETS = [
  { label: "Original", value: 0 },
  { label: "1:1", value: 1 },
  { label: "3:4", value: 3 / 4 },
  { label: "4:3", value: 4 / 3 },
  { label: "16:9", value: 16 / 9 },
];

type Props = { file: File | null; onClose: () => void; onSave: (f: File) => void };

export function ImageEditorDialog({ file, onClose, onSave }: Props) {
  const [baseUrl, setBaseUrl] = useState<string | null>(null);
  const [workUrl, setWorkUrl] = useState<string | null>(null);
  const [rotate, setRotate] = useState<0 | 90 | 180 | 270>(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [preset, setPreset] = useState(0);
  const [natural, setNatural] = useState(1);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!file) return;
    const u = URL.createObjectURL(file);
    setBaseUrl(u);
    setRotate(0); setFlipH(false); setFlipV(false); setPreset(0); setZoom(1); setCrop({ x: 0, y: 0 });
    return () => URL.revokeObjectURL(u);
  }, [file]);

  useEffect(() => {
    if (!baseUrl) return;
    let made: string | null = null;
    let cancelled = false;
    (async () => {
      const u = rotate || flipH || flipV ? (made = await transformImage(baseUrl, rotate, flipH, flipV)) : baseUrl;
      const img = await loadImage(u);
      if (cancelled) return;
      setNatural(img.naturalWidth / img.naturalHeight);
      setWorkUrl(u);
    })();
    return () => { cancelled = true; if (made) URL.revokeObjectURL(made); };
  }, [baseUrl, rotate, flipH, flipV]);

  const aspect = PRESETS[preset]?.value || natural;
  const turn = (d: 90 | -90) => setRotate((r) => (((r + d + 360) % 360) as 0 | 90 | 180 | 270));

  const save = async () => {
    if (!file || !workUrl || !area) return;
    setSaving(true);
    try { onSave(await cropToFile(workUrl, area, file.name, file.type)); }
    finally { setSaving(false); }
  };

  const tool = "flex h-10 w-10 items-center justify-center rounded-md border border-border transition-colors hover:bg-accent";

  return (
    <Dialog open={!!file} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Edit image</DialogTitle></DialogHeader>
        <div className="relative h-72 w-full overflow-hidden rounded-md bg-muted sm:h-96">
          {workUrl && (
            <Cropper image={workUrl} crop={crop} zoom={zoom} aspect={aspect}
              onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_, px) => setArea(px)} />
          )}
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={tool} aria-label="Rotate left" onClick={() => turn(-90)}><RotateCcw className="h-4 w-4" /></button>
            <button type="button" className={tool} aria-label="Rotate right" onClick={() => turn(90)}><RotateCw className="h-4 w-4" /></button>
            <button type="button" className={cn(tool, flipH && "bg-primary text-primary-foreground hover:bg-primary")} aria-label="Flip horizontal" aria-pressed={flipH} onClick={() => setFlipH((v) => !v)}><FlipHorizontal2 className="h-4 w-4" /></button>
            <button type="button" className={cn(tool, flipV && "bg-primary text-primary-foreground hover:bg-primary")} aria-label="Flip vertical" aria-pressed={flipV} onClick={() => setFlipV((v) => !v)}><FlipVertical2 className="h-4 w-4" /></button>
            <div className="ml-auto flex flex-wrap gap-1">
              {PRESETS.map((p, i) => (
                <button key={p.label} type="button" onClick={() => setPreset(i)}
                  className={cn("rounded-md border border-border px-3 py-1.5 text-sm transition-colors", preset === i ? "bg-primary text-primary-foreground" : "hover:bg-accent")}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-3 text-sm text-muted-foreground">
            Zoom
            <Slider min={1} max={3} step={0.05} value={[zoom]} onValueChange={([z]) => setZoom(z ?? 1)} />
          </label>
        </div>
        <DialogFooter>
          <button type="button" onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent">Cancel</button>
          <button type="button" onClick={save} disabled={saving || !area}
            className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-80 disabled:opacity-60">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Apply
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
