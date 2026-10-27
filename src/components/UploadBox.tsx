import { useEffect, useId, useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { ImageEditorDialog } from "@/components/ImageEditorDialog";
import { CameraModal } from "@/components/CameraModal";
import { cn } from "@/lib/utils";
import { ACCEPTED_TYPES, MAX_FILE_BYTES, compressImage, formatBytes } from "@/lib/image-tools";

export const MAX_IMAGES = 7;

// Which upload box receives Ctrl/Cmd+V: the one last hovered or focused (defaults to the first).
let activeBox: string | null = null;

type Item = { id: string; file: File; url: string; progress: number; done: boolean };
let seq = 0;

export function UploadBox({ label, files = [], onChange }: { label: string; files?: File[]; onChange: (f: File[]) => void }) {
  const boxId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [drag, setDrag] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // Sync with incoming files prop (from "+ Add to Tops/Bottoms/Soles", gallery, or reset)
  useEffect(() => {
    if (files.length === 0) {
      if (itemsRef.current.length > 0) {
        itemsRef.current.forEach((i) => URL.revokeObjectURL(i.url));
        setItems([]);
      }
      if (input.current) {
        input.current.value = "";
      }
      return;
    }

    const currentFiles = itemsRef.current.map((i) => i.file);
    const incomingNew = files.filter(
      (f) => !currentFiles.some((cf) => cf === f || (cf.name === f.name && cf.size === f.size))
    );

    if (incomingNew.length > 0) {
      addFiles(incomingNew);
    }
  }, [files]);

  useEffect(() => () => itemsRef.current.forEach((i) => URL.revokeObjectURL(i.url)), []);

  const emit = (next: Item[]) => onChange(next.filter((i) => i.done).map((i) => i.file));
  const update = (fn: (prev: Item[]) => Item[], notify = false) =>
    setItems((prev) => { const next = fn(prev); if (notify) queueMicrotask(() => emit(next)); return next; });

  const addFiles = (incoming: File[]) => {
    const valid: File[] = [];
    for (const f of incoming) {
      if (!ACCEPTED_TYPES.includes(f.type)) { toast.error(`${f.name || "Pasted file"}: only PNG, JPEG or WebP images are allowed`); continue; }
      if (f.size > MAX_FILE_BYTES) { toast.error(`${f.name}: larger than ${formatBytes(MAX_FILE_BYTES)}`); continue; }
      valid.push(f);
    }
    const room = MAX_IMAGES - itemsRef.current.length;
    if (valid.length > room) toast.warning(`${label}: only ${MAX_IMAGES} images allowed — ${valid.length - Math.max(room, 0)} skipped`);
    const accepted = valid.slice(0, Math.max(room, 0));
    if (!accepted.length) return;

    const fresh: Item[] = accepted.map((file) => ({ id: `img-${++seq}`, file, url: URL.createObjectURL(file), progress: 5, done: false }));
    update((p) => [...p, ...fresh]);

    fresh.forEach(async (it) => {
      const tick = setInterval(() => update((p) => p.map((x) => x.id === it.id && x.progress < 85 ? { ...x, progress: x.progress + 10 } : x)), 80);
      try {
        const compressed = await compressImage(it.file);
        clearInterval(tick);
        const url = URL.createObjectURL(compressed);
        URL.revokeObjectURL(it.url);
        update((p) => p.map((x) => x.id === it.id ? { ...x, file: compressed, url, progress: 100, done: true } : x), true);
      } catch {
        clearInterval(tick);
        toast.error(`${it.file.name}: couldn't be processed`);
        update((p) => p.filter((x) => x.id !== it.id), true);
      }
    });
    toast.success("Added", { id: "image-added-toast", duration: 1400 });
  };

  // Global paste
  useEffect(() => {
    if (!activeBox) activeBox = boxId;
    const onPaste = (e: ClipboardEvent) => {
      if (activeBox !== boxId) return;
      const pasted = Array.from(e.clipboardData?.files ?? []).filter((f) => f.type.startsWith("image/") || f.type);
      if (!pasted.length) return;
      e.preventDefault();
      addFiles(pasted.map((f, i) => f.name ? f : new File([f], `pasted-${Date.now()}-${i}.png`, { type: f.type })));
    };
    window.addEventListener("paste", onPaste);
    return () => { window.removeEventListener("paste", onPaste); if (activeBox === boxId) activeBox = null; };
  }, [boxId]);

  const remove = (id: string) => update((p) => {
    const it = p.find((x) => x.id === id); if (it) URL.revokeObjectURL(it.url);
    return p.filter((x) => x.id !== id);
  }, true);

  const full = items.length >= MAX_IMAGES;
  const busy = items.filter((i) => !i.done);
  const overall = busy.length ? Math.round(busy.reduce((s, i) => s + i.progress, 0) / busy.length) : 100;
  const editItem = items.find((i) => i.id === editing) ?? null;

  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-4"
      onPointerEnter={() => (activeBox = boxId)} onFocusCapture={() => (activeBox = boxId)}>
      <h2 className="text-2xl font-bold">{label}</h2>

      <div
        onDragOver={(e) => { e.preventDefault(); if (!full) setDrag(true); }}
        onDragEnter={(e) => { e.preventDefault(); if (!full) setDrag(true); }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDrag(false); }}
        onDrop={(e) => { e.preventDefault(); setDrag(false); if (!full) addFiles(Array.from(e.dataTransfer.files)); }}
        className={cn(
          "flex w-full flex-col gap-3 rounded-lg border-2 border-dashed border-line p-3 transition-all",
          "hover:border-foreground",
          drag && "scale-[1.02] border-pinterest bg-accent",
        )}
      >
        <button
          type="button"
          disabled={full}
          onClick={() => input.current?.click()}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-md px-2 py-4 text-center transition-colors",
            "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            full && "cursor-not-allowed opacity-50 hover:bg-transparent",
          )}
        >
          <ImagePlus className={cn("h-7 w-7 transition-colors", drag ? "text-pinterest" : "text-muted-foreground")} strokeWidth={1.5} />
          <span className="text-sm font-medium">{full ? "Limit reached" : drag ? "Drop to add" : "Drag & drop or click"}</span>
        </button>

        {busy.length > 0 && (
          <div className="w-full">
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>Processing {busy.length} image{busy.length > 1 ? "s" : ""}…</span><span>{overall}%</span>
            </div>
            <Progress value={overall} className="h-1.5" />
          </div>
        )}

        {items.length > 0 && (
          <ul className="flex w-full flex-nowrap gap-2 overflow-x-auto pb-1">
            {items.map((it, i) => (
              <li key={it.id} className="flex w-20 shrink-0 flex-col gap-1">
                <div className="group relative aspect-square overflow-hidden rounded-md border border-line">
                  <button type="button" disabled={!it.done} onClick={() => setEditing(it.id)} aria-label={`Edit ${label} ${i + 1}`} className="h-full w-full">
                    <img src={it.url} alt={`${label} ${i + 1}`} className={cn("h-full w-full object-cover transition-opacity", !it.done && "opacity-50")} />
                    {it.done ? (
                      <span className="absolute inset-0 flex items-center justify-center bg-foreground/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <Pencil className="h-5 w-5 text-background" />
                      </span>
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" /></span>
                    )}
                  </button>
                  <button type="button" aria-label={`Remove ${label} ${i + 1}`} onClick={() => remove(it.id)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-110">
                    <X className="h-3.5 w-3.5" />
                  </button>
                  {!it.done && <Progress value={it.progress} className="absolute inset-x-0 bottom-0 h-1 rounded-none" />}
                </div>
                <p className="truncate text-[11px] leading-tight" title={it.file.name}>{it.file.name}</p>
                <p className="text-[11px] leading-tight text-muted-foreground">{formatBytes(it.file.size)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        disabled={full}
        onClick={() => setCameraOpen(true)}
        className="min-h-11 flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-xs"
      >
        <Camera className="h-4 w-4" />
        Take a photo
      </button>

      <input ref={input} type="file" multiple accept={ACCEPTED_TYPES.join(",")} className="hidden"
        onChange={(e) => { addFiles(Array.from(e.target.files ?? [])); e.target.value = ""; }} />

      <span className="text-sm text-muted-foreground">{items.length} / {MAX_IMAGES} images</span>

      <CameraModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(f) => addFiles([f])}
        label={label}
      />

      <ImageEditorDialog
        file={editItem?.file ?? null}
        onClose={() => setEditing(null)}
        onSave={(f) => {
          const id = editing;
          setEditing(null);
          update((p) => p.map((x) => { if (x.id !== id) return x; URL.revokeObjectURL(x.url); return { ...x, file: f, url: URL.createObjectURL(f) }; }), true);
          toast.success("Image updated");
        }}
      />
    </div>
  );
}
