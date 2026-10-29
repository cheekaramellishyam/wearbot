import { OutfitRecommendation } from "./types";
import { db, auth } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";

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

let activeUserId: string | null = null;

export function setCurrentUserForSync(uid: string | null) {
  activeUserId = uid;
}

export function getCurrentUserForSync(): string | null {
  return activeUserId || auth.currentUser?.uid || null;
}

// ----------------- CLOUD HELPERS -----------------

async function saveOutfitToCloud(uid: string, outfit: SavedOutfit) {
  try {
    const outfitRef = doc(db, "users", uid, "attire", outfit.id);
    await setDoc(outfitRef, outfit);
  } catch (err) {
    console.warn("Could not sync outfit to Firestore:", err);
  }
}

async function removeOutfitFromCloud(uid: string, outfitId: string) {
  try {
    const outfitRef = doc(db, "users", uid, "attire", outfitId);
    await deleteDoc(outfitRef);
  } catch (err) {
    console.warn("Could not delete outfit from Firestore:", err);
  }
}

async function saveGalleryItemToCloud(uid: string, item: GalleryItem) {
  try {
    const itemRef = doc(db, "users", uid, "gallery", item.id);
    await setDoc(itemRef, item);
  } catch (err) {
    console.warn("Could not sync gallery item to Firestore:", err);
  }
}

async function removeGalleryItemFromCloud(uid: string, itemId: string) {
  try {
    const itemRef = doc(db, "users", uid, "gallery", itemId);
    await deleteDoc(itemRef);
  } catch (err) {
    console.warn("Could not delete gallery item from Firestore:", err);
  }
}

/**
 * Synchronizes local wardrobe and attire data with Firestore.
 * Merges cloud items into local cache, and uploads any unsynced local items to cloud.
 */
export async function syncWardrobeWithCloud(uid: string): Promise<void> {
  activeUserId = uid;
  try {
    // 1. Fetch Cloud Attire
    const attireCol = collection(db, "users", uid, "attire");
    const attireSnapshot = await getDocs(attireCol);
    const cloudAttires: SavedOutfit[] = [];
    attireSnapshot.forEach((docSnap) => {
      cloudAttires.push(docSnap.data() as SavedOutfit);
    });

    // 2. Fetch Cloud Gallery & Deduplicate
    const galleryCol = collection(db, "users", uid, "gallery");
    const gallerySnapshot = await getDocs(galleryCol);
    const cloudGallery: GalleryItem[] = [];
    const seenCloudKeys = new Set<string>();

    gallerySnapshot.forEach((docSnap) => {
      const item = docSnap.data() as GalleryItem;
      const key = `${item.category}-${(item.imageUrl || "").slice(0, 150)}-${(item.imageUrl || "").length}`;
      if (seenCloudKeys.has(key)) {
        // Remove redundant duplicate from cloud
        removeGalleryItemFromCloud(uid, item.id);
      } else {
        seenCloudKeys.add(key);
        cloudGallery.push(item);
      }
    });

    // 3. Local items
    const localAttires = getSavedOutfits();
    const localGallery = getGalleryItems();

    // Merge Attires (Cloud + Local)
    const attireMap = new Map<string, SavedOutfit>();
    cloudAttires.forEach((a) => attireMap.set(a.id, a));

    for (const localA of localAttires) {
      if (!attireMap.has(localA.id)) {
        attireMap.set(localA.id, localA);
        saveOutfitToCloud(uid, localA);
      }
    }
    const mergedAttires = Array.from(attireMap.values()).sort(
      (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
    );
    try {
      localStorage.setItem(ATTIRE_STORAGE_KEY, JSON.stringify(mergedAttires));
    } catch (e) {
      console.warn("localStorage quota reached while caching attire:", e);
    }

    // Merge Gallery (Cloud + Local) with image content deduplication
    const galleryMap = new Map<string, GalleryItem>();
    const seenImageKeys = new Set<string>();

    cloudGallery.forEach((g) => {
      const key = `${g.category}-${(g.imageUrl || "").slice(0, 150)}-${(g.imageUrl || "").length}`;
      if (!seenImageKeys.has(key)) {
        seenImageKeys.add(key);
        galleryMap.set(g.id, g);
      }
    });

    for (const localG of localGallery) {
      const key = `${localG.category}-${(localG.imageUrl || "").slice(0, 150)}-${(localG.imageUrl || "").length}`;
      if (!galleryMap.has(localG.id) && !seenImageKeys.has(key)) {
        seenImageKeys.add(key);
        galleryMap.set(localG.id, localG);
        saveGalleryItemToCloud(uid, localG);
      }
    }
    const mergedGallery = Array.from(galleryMap.values()).sort(
      (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
    );
    try {
      localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(mergedGallery));
    } catch (e) {
      console.warn("localStorage quota reached while caching gallery:", e);
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("wardrobe_updated"));
    }
  } catch (err) {
    console.error("Failed to sync wardrobe with Firestore:", err);
  }
}

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

  // Cloud sync if authenticated
  const uid = getCurrentUserForSync();
  if (uid) {
    saveOutfitToCloud(uid, newOutfit);
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

  // Cloud deletion if authenticated
  const uid = getCurrentUserForSync();
  if (uid) {
    removeOutfitFromCloud(uid, id);
  }
}

export function clearAllAttire(): void {
  try {
    localStorage.removeItem(ATTIRE_STORAGE_KEY);
    window.dispatchEvent(new Event("wardrobe_updated"));
  } catch (e) {
    console.error("Failed to clear attire:", e);
  }

  const uid = getCurrentUserForSync();
  if (uid) {
    getDocs(collection(db, "users", uid, "attire"))
      .then((snap) => {
        const batch = writeBatch(db);
        snap.forEach((d) => batch.delete(d.ref));
        return batch.commit();
      })
      .catch((err) => console.warn("Failed to clear cloud attire:", err));
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
    if (!raw) return [];
    const items: GalleryItem[] = JSON.parse(raw);

    // Deduplicate by ID and content signature to prevent replica accumulation
    const seenIds = new Set<string>();
    const seenSignatures = new Set<string>();
    const deduplicated: GalleryItem[] = [];

    for (const item of items) {
      if (!item || !item.id || seenIds.has(item.id)) continue;
      const signature = `${item.category}-${(item.imageUrl || "").slice(0, 150)}-${(item.imageUrl || "").length}`;
      if (seenSignatures.has(signature)) {
        // Redundant replica - skip and purge from cloud if signed in
        const uid = getCurrentUserForSync();
        if (uid) {
          removeGalleryItemFromCloud(uid, item.id);
        }
        continue;
      }
      seenIds.add(item.id);
      seenSignatures.add(signature);
      deduplicated.push(item);
    }

    if (deduplicated.length !== items.length) {
      try {
        localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(deduplicated));
      } catch (e) {}
    }

    return deduplicated;
  } catch (e) {
    console.error("Failed to load gallery:", e);
    return [];
  }
}

/** Downscales an image for safe and fast storage in cloud and local cache */
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
    // 1. If item came from gallery (identified by prefix or gallery id tag), never re-add
    if (
      item.name?.startsWith("gallery-") ||
      item.name?.startsWith("top-gallery-") ||
      item.name?.startsWith("bottom-gallery-") ||
      item.name?.startsWith("sole-gallery-") ||
      item.name?.includes("-gallery-")
    ) {
      continue;
    }

    // 2. Check if identical name/data already exists in current gallery
    const exists = current.some((g) => {
      if (g.category !== item.category) return false;
      if (item.name && (g.name === item.name || g.id === item.name || item.name.includes(g.id))) {
        return true;
      }
      if (g.imageUrl === item.dataUrl) return true;
      return false;
    });

    if (!exists) {
      const compressed = await createStorageThumbnail(item.dataUrl, 450);

      // 3. Double-check thumbnail doesn't match an existing compressed item
      const matchesExisting = current.some(
        (g) =>
          g.category === item.category &&
          (g.imageUrl === compressed ||
            (g.imageUrl.length === compressed.length &&
              g.imageUrl.slice(0, 150) === compressed.slice(0, 150)))
      );
      if (matchesExisting) continue;

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

    // Cloud sync if authenticated
    const uid = getCurrentUserForSync();
    if (uid) {
      for (const item of newItems) {
        saveGalleryItemToCloud(uid, item);
      }
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

  // Cloud deletion if authenticated
  const uid = getCurrentUserForSync();
  if (uid) {
    removeGalleryItemFromCloud(uid, id);
  }
}

export function clearAllGallery(): void {
  try {
    localStorage.removeItem(GALLERY_STORAGE_KEY);
    window.dispatchEvent(new Event("wardrobe_updated"));
  } catch (e) {
    console.error("Failed to clear gallery:", e);
  }

  const uid = getCurrentUserForSync();
  if (uid) {
    getDocs(collection(db, "users", uid, "gallery"))
      .then((snap) => {
        const batch = writeBatch(db);
        snap.forEach((d) => batch.delete(d.ref));
        return batch.commit();
      })
      .catch((err) => console.warn("Failed to clear cloud gallery:", err));
  }
}
