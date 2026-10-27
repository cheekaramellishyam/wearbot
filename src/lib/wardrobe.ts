import { OutfitRecommendation } from "./types";

export type ClothingCategory = "Top" | "Bottom" | "Sole";

export interface SavedOutfit {
  id: string;
  createdAt: number;
  topPreview: string;
  bottomPreview: string;
  solePreview?: string;
  recommendation: OutfitRecommendation;
}

export interface GalleryItem {
  id: string;
  imageUrl: string;
  category: ClothingCategory;
  createdAt: number;
  name?: string;
}

const ATTIRE_STORAGE_KEY = "wearbot_wardrobe_v1";
const GALLERY_STORAGE_KEY = "wearbot_gallery_v1";

// ----------------- ATTIRE (Saved Recommendations) -----------------

export function getSavedOutfits(): SavedOutfit[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ATTIRE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to load attire:", e);
    return [];
  }
}

export function saveOutfitToStorage(
  rec: OutfitRecommendation,
  topPreview: string,
  bottomPreview: string,
  solePreview?: string
): SavedOutfit {
  const current = getSavedOutfits();
  const newOutfit: SavedOutfit = {
    id: `attire-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
    topPreview,
    bottomPreview,
    solePreview,
    recommendation: rec,
  };

  const updated = [newOutfit, ...current];
  try {
    localStorage.setItem(ATTIRE_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("wardrobe_updated"));
  } catch (e) {
    console.error("Failed to save to attire storage:", e);
  }
  return newOutfit;
}

export function removeOutfitFromStorage(id: string): void {
  const current = getSavedOutfits();
  const updated = current.filter((item) => item.id !== id);
  try {
    localStorage.setItem(ATTIRE_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("wardrobe_updated"));
  } catch (e) {
    console.error("Failed to remove from attire:", e);
  }
}

export function clearAllAttire(): void {
  try {
    localStorage.removeItem(ATTIRE_STORAGE_KEY);
    window.dispatchEvent(new Event("wardrobe_updated"));
  } catch (e) {
    console.error("Failed to clear attire:", e);
  }
}

export function isOutfitAlreadySaved(
  rec: OutfitRecommendation,
  topPreview: string,
  bottomPreview: string,
  solePreview?: string
): string | null {
  const current = getSavedOutfits();
  const match = current.find(
    (item) =>
      item.recommendation.style === rec.style &&
      item.recommendation.colors === rec.colors &&
      item.topPreview === topPreview &&
      item.bottomPreview === bottomPreview &&
      (!solePreview || item.solePreview === solePreview)
  );
  return match ? match.id : null;
}

// ----------------- GALLERY (Auto-Saved Uploaded Images) -----------------

export function getGalleryItems(): GalleryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GALLERY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to load gallery:", e);
    return [];
  }
}

/** Downscales an image for safe and fast storage in localStorage quota */
export function createStorageThumbnail(dataUrl: string, maxDim = 400): Promise<string> {
  return new Promise((resolve) => {
    if (!dataUrl.startsWith("data:image/")) {
      resolve(dataUrl);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.75));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export async function autoSaveToGallery(
  items: Array<{ dataUrl: string; category: ClothingCategory; name?: string }>
): Promise<void> {
  if (!items.length) return;
  const current = getGalleryItems();
  const newItems: GalleryItem[] = [];

  for (const item of items) {
    // Check if already in gallery (compare recent items by name or size / sample)
    const exists = current.some(
      (g) => g.category === item.category && (g.name === item.name || g.imageUrl === item.dataUrl)
    );
    if (!exists) {
      const compressed = await createStorageThumbnail(item.dataUrl, 450);
      newItems.push({
        id: `gallery-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        imageUrl: compressed,
        category: item.category,
        createdAt: Date.now(),
        name: item.name || `${item.category} item`,
      });
    }
  }

  if (newItems.length > 0) {
    const updated = [...newItems, ...current];
    try {
      localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event("wardrobe_updated"));
    } catch (e) {
      console.warn("Storage quota limit reached when saving to gallery:", e);
    }
  }
}

export function removeGalleryItem(id: string): void {
  const current = getGalleryItems();
  const updated = current.filter((item) => item.id !== id);
  try {
    localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("wardrobe_updated"));
  } catch (e) {
    console.error("Failed to remove gallery item:", e);
  }
}

export function clearAllGallery(): void {
  try {
    localStorage.removeItem(GALLERY_STORAGE_KEY);
    window.dispatchEvent(new Event("wardrobe_updated"));
  } catch (e) {
    console.error("Failed to clear gallery:", e);
  }
}
