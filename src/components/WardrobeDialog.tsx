import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Bookmark,
  Calendar,
  Check,
  Eye,
  Filter,
  Images,
  Plus,
  Sparkles,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  clearAllAttire,
  clearAllGallery,
  ClothingCategory,
  GalleryItem,
  getGalleryItems,
  getSavedOutfits,
  removeGalleryItem,
  removeOutfitFromStorage,
  SavedOutfit,
} from "@/lib/wardrobe";
import { WardrobeHangerLogo } from "@/components/WardrobeHangerLogo";
import { WaveBackground } from "@/components/WaveBackground";

interface WardrobeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "attire" | "gallery";
  onSelectGarment?: (file: File, category: "tops" | "bottoms" | "soles") => void;
  onRemoveGarment?: (identifier: string, category: "tops" | "bottoms" | "soles") => void;
  uploadedFiles?: { tops: File[]; bottoms: File[]; soles: File[] };
  uploadedCount?: number;
}

export function WardrobeDialog({
  open,
  onOpenChange,
  defaultTab = "attire",
  onSelectGarment,
  onRemoveGarment,
  uploadedFiles,
  uploadedCount = 0,
}: WardrobeDialogProps) {
  const [activeTab, setActiveTab] = useState<"attire" | "gallery">(defaultTab);
  const [outfits, setOutfits] = useState<SavedOutfit[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<"All" | ClothingCategory>("All");
  const [previewImage, setPreviewImage] = useState<GalleryItem | null>(null);
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    actionLabel?: string;
    onConfirm: () => void;
  } | null>(null);

  const loadData = () => {
    setOutfits(getSavedOutfits());
    setGallery(getGalleryItems());
  };

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  useEffect(() => {
    if (uploadedCount === 0) {
      setAddedItemIds({});
    }
  }, [uploadedCount]);

  useEffect(() => {
    const handleReset = () => {
      setAddedItemIds({});
    };
    window.addEventListener("wearbot_reset", handleReset);
    return () => window.removeEventListener("wearbot_reset", handleReset);
  }, []);

  useEffect(() => {
    const handleUpdate = () => loadData();
    window.addEventListener("wardrobe_updated", handleUpdate);
    return () => window.removeEventListener("wardrobe_updated", handleUpdate);
  }, []);

  const handleRequestRemoveOutfit = (id: string, style: string) => {
    setConfirmDialog({
      open: true,
      title: "Delete from Attire",
      message: `Are you sure you want to delete "${style}" from your Attire?`,
      actionLabel: "Yes, Delete",
      onConfirm: () => {
        removeOutfitFromStorage(id);
        loadData();
        toast.success(`Removed "${style}" from Attire`, { duration: 1400 });
      },
    });
  };

  const handleRequestClearAttire = () => {
    setConfirmDialog({
      open: true,
      title: "Clear All Attire",
      message: "Are you sure you want to delete all saved outfits from your Attire?",
      actionLabel: "Clear All",
      onConfirm: () => {
        clearAllAttire();
        loadData();
        toast.success("All outfits removed from Attire", { duration: 1400 });
      },
    });
  };

  const handleRequestRemoveGalleryItem = (id: string, category: string) => {
    setConfirmDialog({
      open: true,
      title: "Delete from Gallery",
      message: `Are you sure you want to delete this ${category} photo from your Gallery?`,
      actionLabel: "Yes, Delete",
      onConfirm: () => {
        removeGalleryItem(id);
        loadData();
        toast.success(`Deleted ${category} image from Gallery`, { duration: 1400 });
      },
    });
  };

  const handleRequestClearGallery = () => {
    setConfirmDialog({
      open: true,
      title: "Clear All Gallery",
      message: "Are you sure you want to delete all uploaded photos from your Gallery?",
      actionLabel: "Clear All",
      onConfirm: () => {
        clearAllGallery();
        loadData();
        toast.success("All images removed from Gallery", { duration: 1400 });
      },
    });
  };

  async function urlOrDataUrlToFile(url: string, filename: string): Promise<File> {
    if (url.startsWith("data:")) {
      const arr = url.split(",");
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new File([u8arr], filename, { type: mime });
    }

    const res = await fetch(url);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type || "image/jpeg" });
  }

  const isItemAdded = (item: GalleryItem): boolean => {
    if (addedItemIds[item.id]) return true;
    const cat = item.category === "Top" ? "tops" : item.category === "Bottom" ? "bottoms" : "soles";
    if (uploadedFiles && uploadedFiles[cat]) {
      return uploadedFiles[cat].some((f) => f.name.includes(item.id));
    }
    return false;
  };

  const handleToggleGalleryItemToOutfit = async (item: GalleryItem) => {
    const category =
      item.category === "Top" ? "tops" : item.category === "Bottom" ? "bottoms" : "soles";
    const targetLabel = item.category === "Top" ? "Tops" : item.category === "Bottom" ? "Bottoms" : "Soles";
    const currentlyAdded = isItemAdded(item);

    if (currentlyAdded) {
      if (onRemoveGarment) {
        onRemoveGarment(item.id, category);
      }
      setAddedItemIds((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      toast.info(`Removed from ${targetLabel}`, { duration: 1400 });
      return;
    }

    if (!onSelectGarment) return;
    try {
      const filename = `${item.category.toLowerCase()}-${item.id}.jpg`;
      const file = await urlOrDataUrlToFile(item.imageUrl, filename);
      onSelectGarment(file, category);
      setAddedItemIds((prev) => ({ ...prev, [item.id]: true }));
      toast.success(`Added to ${targetLabel}`, { duration: 1400 });
    } catch (e) {
      console.error("Failed to add image to outfit:", e);
      toast.error("Failed to add image to outfit");
    }
  };

  const getButtonLabel = (category: string, isAdded: boolean) => {
    const target = category === "Top" ? "Tops" : category === "Bottom" ? "Bottoms" : "Soles";
    return isAdded ? `Added to ${target}` : `Add to ${target}`;
  };

  const filteredGallery = gallery.filter((item) => {
    if (categoryFilter === "All") return true;
    return item.category === categoryFilter;
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl w-[95vw] h-[92vh] max-h-[92vh] flex flex-col p-4 sm:p-6 md:p-8 overflow-hidden bg-background">
          {/* Abstract wave ribbon background matching reference inner box */}
          <WaveBackground className="absolute inset-x-0 bottom-0 pointer-events-none z-0" intensity={0.9} />

          {/* Header & Tabs */}
          <DialogHeader className="border-b border-line pb-4 shrink-0 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pr-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                  <WardrobeHangerLogo className="h-5 w-auto" />
                </div>
                <div>
                  <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight">
                    My Wardrobe
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Browse your saved complete outfits and auto-archived uploaded clothing items.
                  </DialogDescription>
                </div>
              </div>

              {/* Section Tabs: Attire vs Gallery */}
              <div className="flex items-center rounded-lg border border-line bg-muted/40 p-1 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab("attire")}
                  className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === "attire"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Bookmark className="h-3.5 w-3.5" />
                  <span>Attire</span>
                  <span className="ml-1 rounded-full bg-muted px-1.5 py-0.2 text-[10px] font-bold text-foreground">
                    {outfits.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("gallery")}
                  className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === "gallery"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Images className="h-3.5 w-3.5" />
                  <span>Gallery</span>
                  <span className="ml-1 rounded-full bg-muted px-1.5 py-0.2 text-[10px] font-bold text-foreground">
                    {gallery.length}
                  </span>
                </button>
              </div>
            </div>
          </DialogHeader>

          {/* Section Body */}
          <div className="flex-1 overflow-y-auto py-4 relative z-10">
            {/* 1. ATTIRE TAB */}
            {activeTab === "attire" && (
              <div>
                {outfits.length > 0 && (
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {outfits.length} saved recommendation{outfits.length > 1 ? "s" : ""}
                    </p>
                    <button
                      type="button"
                      onClick={handleRequestClearAttire}
                      className="text-xs text-destructive hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Clear all Attire
                    </button>
                  </div>
                )}

                {outfits.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted border border-line mb-3">
                      <Sparkles className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-base font-semibold">No Outfits in Attire Yet</h3>
                    <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                      Whenever you generate outfit recommendations, click the{" "}
                      <span className="font-semibold text-foreground">Save</span> button to
                      archive your favorite pairings here.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5 pb-8">
                    {outfits.map((item) => {
                      const rec = item.recommendation;
                      const hasSole = Boolean(item.solePreview);
                      const formattedDate = new Date(item.createdAt).toLocaleDateString(
                        undefined,
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      );

                      return (
                        <div
                          key={item.id}
                          className="flex flex-col gap-3 rounded-lg border border-line p-3.5 bg-card transition-all hover:shadow-xs"
                        >
                          {/* Spacious Individual 3:4 Garment Previews */}
                          <div
                            className={`grid ${
                              hasSole ? "grid-cols-3" : "grid-cols-2"
                            } gap-2 p-2 rounded-lg border border-line/70 bg-muted/30`}
                          >
                            <div className="relative aspect-[3/4] w-full overflow-hidden rounded bg-background border border-line/40 shadow-2xs">
                              <img
                                src={item.topPreview}
                                alt="Top"
                                className="h-full w-full object-cover"
                              />
                              <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[8px] font-semibold text-white uppercase backdrop-blur-xs">
                                Top
                              </span>
                            </div>
                            <div className="relative aspect-[3/4] w-full overflow-hidden rounded bg-background border border-line/40 shadow-2xs">
                              <img
                                src={item.bottomPreview}
                                alt="Bottom"
                                className="h-full w-full object-cover"
                              />
                              <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[8px] font-semibold text-white uppercase backdrop-blur-xs">
                                Bottom
                              </span>
                            </div>
                            {item.solePreview && (
                              <div className="relative aspect-[3/4] w-full overflow-hidden rounded bg-background border border-line/40 shadow-2xs">
                                <img
                                  src={item.solePreview}
                                  alt="Sole"
                                  className="h-full w-full object-cover"
                                />
                                <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[8px] font-semibold text-white uppercase backdrop-blur-xs">
                                  Sole
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Outfit Details */}
                          <div className="flex flex-col gap-1 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold">{rec.style}</p>
                              <span className="text-xs font-bold text-primary">
                                {rec.score}/10
                              </span>
                            </div>

                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium text-foreground">Colours:</span>{" "}
                              {rec.colors}
                            </p>

                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {rec.reason}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium text-foreground">Occasion:</span>{" "}
                              {rec.occasion}
                            </p>

                            <div className="mt-auto pt-2 flex items-center justify-between border-t border-line/50 text-[10px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Saved {formattedDate}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleRequestRemoveOutfit(item.id, rec.style)}
                                className="flex items-center gap-1 text-destructive hover:underline p-1 cursor-pointer font-medium"
                                title="Delete from Attire"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 2. GALLERY TAB */}
            {activeTab === "gallery" && (
              <div>
                {/* Gallery Filters & Clear Button */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground mr-1 flex items-center gap-1">
                      <Filter className="h-3 w-3" />
                      Filter:
                    </span>
                    {(["All", "Top", "Bottom", "Sole"] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategoryFilter(cat)}
                        className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                          categoryFilter === cat
                            ? "bg-foreground text-background font-semibold"
                            : "bg-muted/60 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {cat === "All" ? "All Items" : `${cat}s`}
                      </button>
                    ))}
                  </div>

                  {gallery.length > 0 && (
                    <button
                      type="button"
                      onClick={handleRequestClearGallery}
                      className="text-xs text-destructive hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Clear all Gallery
                    </button>
                  )}
                </div>

                {filteredGallery.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted border border-line mb-3">
                      <Images className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-base font-semibold">No Images in Gallery</h3>
                    <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                      {gallery.length === 0
                        ? "Any tops, bottoms, or soles you upload on the main page are automatically saved into your Gallery."
                        : `No ${categoryFilter} items found. Try switching filters.`}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3.5 sm:gap-4 pb-8">
                    {filteredGallery.map((item) => {
                      const formattedDate = new Date(item.createdAt).toLocaleDateString(
                        undefined,
                        {
                          month: "short",
                          day: "numeric",
                        }
                      );

                      return (
                        <div
                          key={item.id}
                          className="group relative flex flex-col rounded-lg border border-line bg-card overflow-hidden transition-all hover:shadow-xs hover:border-foreground/30"
                        >
                          {/* Image preview with quick actions */}
                          <div
                            onClick={() => setPreviewImage(item)}
                            className="relative aspect-[3/4] w-full overflow-hidden bg-muted/40 cursor-pointer"
                          >
                            <img
                              src={item.imageUrl}
                              alt={item.name || item.category}
                              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                              loading="lazy"
                            />

                            {/* Category Tag */}
                            <span className="absolute top-2 left-2 rounded-sm bg-black/75 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase backdrop-blur-xs">
                              {item.category}
                            </span>

                            {/* Delete Button (with permission confirmation) */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRequestRemoveGalleryItem(item.id, item.category);
                              }}
                              className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-background/90 text-destructive shadow-xs hover:bg-destructive hover:text-white transition-all cursor-pointer opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
                              title="Delete from Gallery"
                              aria-label="Delete image"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* Footer Info & Delete */}
                          <div className="p-2 flex items-center justify-between text-[11px] text-muted-foreground">
                            <span className="truncate max-w-[100px]">{item.category}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px]">{formattedDate}</span>
                              <button
                                type="button"
                                onClick={() => handleRequestRemoveGalleryItem(item.id, item.category)}
                                className="text-destructive hover:text-destructive/80 p-0.5 cursor-pointer sm:hidden"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Add to Tops / Bottoms / Soles based on image category */}
                          <div className="p-2 pt-0">
                            <button
                              type="button"
                              onClick={() => handleToggleGalleryItemToOutfit(item)}
                              className={`w-full flex items-center justify-center gap-1.5 rounded-md py-1.5 px-2 text-[11px] font-semibold transition-all cursor-pointer shadow-2xs ${
                                isItemAdded(item)
                                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                  : "bg-foreground text-background hover:opacity-90"
                              }`}
                            >
                              {isItemAdded(item) ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Plus className="h-3 w-3" />
                              )}
                              <span>{getButtonLabel(item.category, isItemAdded(item))}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Enlarged Gallery Image Viewer Dialog */}
      {previewImage && (
        <Dialog open={Boolean(previewImage)} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent className="max-w-md p-4">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-base font-bold">
                  {previewImage.category} Item
                </DialogTitle>
                <button
                  type="button"
                  onClick={() => {
                    const item = previewImage;
                    setPreviewImage(null);
                    handleRequestRemoveGalleryItem(item.id, item.category);
                  }}
                  className="flex items-center gap-1 text-xs text-destructive hover:underline cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </DialogHeader>

            <div className="aspect-[3/4] w-full overflow-hidden rounded-lg bg-muted border border-line my-2">
              <img
                src={previewImage.imageUrl}
                alt={previewImage.name || previewImage.category}
                className="h-full w-full object-contain"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                handleToggleGalleryItemToOutfit(previewImage);
              }}
              className={`w-full flex items-center justify-center gap-1.5 rounded-lg py-2 px-3 text-xs font-semibold transition-all cursor-pointer shadow-2xs mt-1 ${
                isItemAdded(previewImage)
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-foreground text-background hover:opacity-90"
              }`}
            >
              {isItemAdded(previewImage) ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              <span>{getButtonLabel(previewImage.category, isItemAdded(previewImage))}</span>
            </button>
          </DialogContent>
        </Dialog>
      )}

      {/* Permission Confirmation Modal for Deleting */}
      {confirmDialog && (
        <Dialog open={confirmDialog.open} onOpenChange={() => setConfirmDialog(null)}>
          <DialogContent className="max-w-sm p-5">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {confirmDialog.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground pt-1.5 leading-relaxed">
                {confirmDialog.message}
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="rounded-md border border-line px-3.5 py-1.5 text-xs font-medium hover:bg-muted cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className="rounded-md bg-destructive text-destructive-foreground px-3.5 py-1.5 text-xs font-semibold hover:opacity-90 cursor-pointer shadow-xs"
              >
                {confirmDialog.actionLabel || "Yes, Delete"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
