// Browser-only image helpers (call from event handlers / effects only).

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB max to support modern phone cameras
const MAX_DIMENSION = 2048;
const QUALITY = 0.85;

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read image"));
    img.src = src;
  });
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Export failed"))), type, quality),
  );
}

function outType(type: string) {
  return type === "image/png" ? "image/webp" : type;
}

function renameExt(name: string, type: string) {
  const ext = type === "image/webp" ? "webp" : type === "image/png" ? "png" : "jpg";
  return name.replace(/\.[^.]+$/, "") + "." + ext;
}

/** Downscale to MAX_DIMENSION and re-encode; keeps the original if it's already smaller. */
export async function compressImage(file: File): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight));
    if (scale === 1 && file.size < 500 * 1024) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    const type = outType(file.type);
    const blob = await toBlob(canvas, type, QUALITY);
    if (blob.size >= file.size) return file;
    return new File([blob], renameExt(file.name, type), { type });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Bake a 90° rotation and/or flip into a new image URL. */
export async function transformImage(src: string, rotate: 0 | 90 | 180 | 270, flipH: boolean, flipV: boolean) {
  const img = await loadImage(src);
  const swap = rotate === 90 || rotate === 270;
  const canvas = document.createElement("canvas");
  canvas.width = swap ? img.naturalHeight : img.naturalWidth;
  canvas.height = swap ? img.naturalWidth : img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotate * Math.PI) / 180);
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
  return URL.createObjectURL(await toBlob(canvas, "image/png"));
}

export async function cropToFile(
  src: string,
  area: { x: number; y: number; width: number; height: number },
  name: string,
  type: string,
): Promise<File> {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(area.width);
  canvas.height = Math.round(area.height);
  canvas.getContext("2d")!.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height);
  const t = outType(type);
  const blob = await toBlob(canvas, t, QUALITY);
  return new File([blob], renameExt(name, t), { type: t });
}
