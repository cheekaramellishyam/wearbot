import { useEffect, useRef, useState } from "react";
import { Bookmark, BookmarkCheck, Images } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { UploadBox } from "@/components/UploadBox";
import { WardrobeDialog } from "@/components/WardrobeDialog";
import { FashionSearchDialog } from "@/components/FashionSearchDialog";
import { ProfileDialog } from "@/components/ProfileDialog";
import { GenerationModeDialog } from "@/components/GenerationModeDialog";
import { RefreshConfirmDialog } from "@/components/RefreshConfirmDialog";
import { WaveBackground } from "@/components/WaveBackground";
import { Toaster } from "@/components/ui/sonner";
import { subscribeToAuth, GoogleUserProfile } from "@/lib/google-auth";
import { getAiLimitState, recordAiGeneration, AiLimitState } from "@/lib/ai-limits";
import { ClothingAnalysis, OutfitRecommendation } from "@/lib/types";
import {
  autoSaveToGallery,
  ClothingCategory,
  getGalleryItems,
  getSavedOutfits,
  isOutfitAlreadySaved,
  removeOutfitFromStorage,
  saveOutfitToStorage,
} from "@/lib/wardrobe";
import { generateClientQuickShuffle } from "@/lib/quick-shuffle";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // If not an image or is SVG, use standard FileReader
    if (!file.type.startsWith("image/") || file.type.includes("svg")) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error(`Couldn't read ${file.name}`));
      reader.readAsDataURL(file);
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX_DIM = 960;
      let width = img.width;
      let height = img.height;

      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error(`Couldn't read ${file.name}`));
        reader.readAsDataURL(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      // High-quality JPEG compression: reduces a 5MB phone photo down to ~75KB while maintaining sharp clothing texture
      const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.82);
      resolve(compressedDataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error(`Couldn't read ${file.name}`));
      reader.readAsDataURL(file);
    };

    img.src = objectUrl;
  });
}

export default function App() {
  const [shirt, setShirt] = useState<File[]>([]);
  const [pants, setPants] = useState<File[]>([]);
  const [shoes, setShoes] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [recs, setRecs] = useState<OutfitRecommendation[] | null>(null);
  const [previews, setPreviews] = useState<{
    tops: string[];
    bottoms: string[];
    soles: string[];
  }>({
    tops: [],
    bottoms: [],
    soles: [],
  });

  // Wardrobe state
  const [wardrobeOpen, setWardrobeOpen] = useState(false);
  const [wardrobeTab, setWardrobeTab] = useState<"attire" | "gallery">("attire");
  const [attireCount, setAttireCount] = useState(0);
  const [galleryCount, setGalleryCount] = useState(0);
  const [savedMap, setSavedMap] = useState<Record<number, string | null>>({});

  // Search Dialog state
  const [searchOpen, setSearchOpen] = useState(false);

  // Google Profile state
  const [googleUser, setGoogleUser] = useState<GoogleUserProfile | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  // Generation Mode Dialog and AI Quota state
  const [generationDialogOpen, setGenerationDialogOpen] = useState(false);
  const [aiLimits, setAiLimits] = useState<AiLimitState>({
    used: 0,
    total: 20,
    date: "",
  });

  // Refresh confirmation modal state
  const [refreshConfirmOpen, setRefreshConfirmOpen] = useState(false);

  const results = useRef<HTMLDivElement>(null);
  const cache = useRef<Map<string, ClothingAnalysis>>(new Map());

  // Subscribe to Google Firebase Auth state
  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setGoogleUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Sync AI Limits whenever dialog opens or Google user changes
  useEffect(() => {
    const userKey = googleUser?.email || googleUser?.uid;
    setAiLimits(getAiLimitState(userKey));
  }, [googleUser, generationDialogOpen]);

  // Synchronize counts and saved status from localStorage
  const refreshWardrobeData = () => {
    const outfits = getSavedOutfits();
    const gallery = getGalleryItems();
    setAttireCount(outfits.length);
    setGalleryCount(gallery.length);

    if (recs && previews.tops.length > 0 && previews.bottoms.length > 0) {
      const nextMap: Record<number, string | null> = {};
      recs.forEach((rec, idx) => {
        const topUrl = previews.tops[rec.top - 1];
        const bottomUrl = previews.bottoms[rec.bottom - 1];
        const soleUrl = rec.sole ? previews.soles[rec.sole - 1] : undefined;
        if (topUrl && bottomUrl) {
          nextMap[idx] = isOutfitAlreadySaved(rec, topUrl, bottomUrl, soleUrl);
        }
      });
      setSavedMap(nextMap);
    }
  };

  useEffect(() => {
    refreshWardrobeData();
  }, [googleUser, recs, previews]);

  // Listen for storage changes
  useEffect(() => {
    const handler = () => refreshWardrobeData();
    window.addEventListener("wardrobe_updated", handler);
    return () => window.removeEventListener("wardrobe_updated", handler);
  }, [googleUser, recs, previews]);

  // Auto-save uploaded garments to Gallery
  useEffect(() => {
    const autoSave = async () => {
      try {
        const itemsToSave: Array<{ dataUrl: string; category: ClothingCategory; name?: string }> = [];
        for (const file of shirt) {
          const url = await fileToDataUrl(file);
          itemsToSave.push({ dataUrl: url, category: "Top", name: file.name });
        }
        for (const file of pants) {
          const url = await fileToDataUrl(file);
          itemsToSave.push({ dataUrl: url, category: "Bottom", name: file.name });
        }
        for (const file of shoes) {
          const url = await fileToDataUrl(file);
          itemsToSave.push({ dataUrl: url, category: "Sole", name: file.name });
        }
        if (itemsToSave.length > 0) {
          await autoSaveToGallery(itemsToSave);
          refreshWardrobeData();
        }
      } catch (e) {
        console.error("Auto save to gallery failed:", e);
      }
    };

    if (shirt.length > 0 || pants.length > 0 || shoes.length > 0) {
      autoSave();
    }
  }, [shirt, pants, shoes]);

  useEffect(() => {
    if (recs) {
      results.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [recs]);

  // Check config status on initial load
  useEffect(() => {
    fetch("/api/outfits/config-status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && !data.geminiConfigured) {
          toast.error(
            "Gemini API key is not detected in server environment. Please ensure GEMINI_API_KEY is configured in project secrets."
          );
        }
      })
      .catch(() => {});
  }, []);

  const onGenerate = async (mode: "basic" | "ai" = "ai") => {
    if (shirt.length === 0 || pants.length === 0) {
      toast.error("Please add at least 1 top and 1 bottom to generate outfits.");
      return;
    }

    const userKey = googleUser?.email || googleUser?.uid;

    if (mode === "basic") {
      setLoading(true);
      try {
        const topUrls = await Promise.all(shirt.map((file) => fileToDataUrl(file)));
        const bottomUrls = await Promise.all(pants.map((file) => fileToDataUrl(file)));
        const soleUrls = await Promise.all(shoes.map((file) => fileToDataUrl(file)));

        setPreviews({ tops: topUrls, bottoms: bottomUrls, soles: soleUrls });

        const quickRecs = generateClientQuickShuffle(
          shirt.length,
          pants.length,
          shoes.length > 0 ? shoes.length : undefined
        );

        if (quickRecs.length === 0) {
          toast.error("Could not create combinations. Please ensure you added tops and bottoms.");
          return;
        }

        setRecs(quickRecs);
        toast.success(`Generated ${quickRecs.length} outfits with Quick Shuffle!`);
      } catch (err: any) {
        console.error(err);
        toast.error(err?.message || "Failed to generate quick shuffle.");
      } finally {
        setLoading(false);
      }
      return;
    }

    // AI MODE
    const limits = getAiLimitState(userKey);
    if (limits.used >= limits.total) {
      toast.error("Daily AI styling limit reached. Use Quick Shuffle for unlimited combinations!");
      setGenerationDialogOpen(true);
      return;
    }

    setLoading(true);

    try {
      const topUrls = await Promise.all(shirt.map((file) => fileToDataUrl(file)));
      const bottomUrls = await Promise.all(pants.map((file) => fileToDataUrl(file)));
      const soleUrls = await Promise.all(shoes.map((file) => fileToDataUrl(file)));

      setPreviews({ tops: topUrls, bottoms: bottomUrls, soles: soleUrls });

      const allUrls = [...topUrls, ...bottomUrls, ...soleUrls];
      const uncached = allUrls.filter((url) => !cache.current.has(url));

      if (uncached.length > 0) {
        const res = await fetch("/api/outfits/analyse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: uncached }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to analyse clothing items.");
        }

        const data = await res.json();
        uncached.forEach((url, i) => cache.current.set(url, data.items[i]));
      }

      const tops = topUrls.map((url) => cache.current.get(url)!);
      const bottoms = bottomUrls.map((url) => cache.current.get(url)!);
      const soles = soleUrls.length > 0 ? soleUrls.map((url) => cache.current.get(url)!) : undefined;

      const res = await fetch("/api/outfits/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tops, bottoms, soles }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to generate recommendations.");
      }

      const data = await res.json();
      setRecs(data.recommendations);

      const updatedLimits = recordAiGeneration(userKey);
      setAiLimits(updatedLimits);

      const remaining = Math.max(0, updatedLimits.total - updatedLimits.used);
      toast.success(
        `AI Outfits generated! (${remaining} AI generation${
          remaining === 1 ? "" : "s"
        } left today)`
      );
    } catch (err: any) {
      console.warn("AI generation failed or timed out, trying Quick Shuffle fallback:", err);
      try {
        const topUrls = await Promise.all(shirt.map((file) => fileToDataUrl(file)));
        const bottomUrls = await Promise.all(pants.map((file) => fileToDataUrl(file)));
        const soleUrls = await Promise.all(shoes.map((file) => fileToDataUrl(file)));

        setPreviews({ tops: topUrls, bottoms: bottomUrls, soles: soleUrls });
        const fallbackRecs = generateClientQuickShuffle(
          shirt.length,
          pants.length,
          shoes.length > 0 ? shoes.length : undefined
        );

        if (fallbackRecs.length > 0) {
          setRecs(fallbackRecs);
          toast.success("Generated instant outfit combinations!");
          return;
        }
      } catch (fallbackErr) {
        console.error("Fallback also failed:", fallbackErr);
      }

      toast.error(err?.message || "An error occurred while generating outfits.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSave = (index: number, rec: OutfitRecommendation) => {
    const topUrl = previews.tops[rec.top - 1];
    const bottomUrl = previews.bottoms[rec.bottom - 1];
    const soleUrl = rec.sole ? previews.soles[rec.sole - 1] : undefined;

    if (!topUrl || !bottomUrl) {
      toast.error("Unable to save outfit: garment preview missing.");
      return;
    }

    const savedId = savedMap[index];

    if (savedId) {
      removeOutfitFromStorage(savedId);
      setSavedMap((prev) => ({ ...prev, [index]: null }));
      setAttireCount((prev) => Math.max(0, prev - 1));
      toast.info("Outfit removed from Attire wardrobe.");
    } else {
      const saved = saveOutfitToStorage(rec, topUrl, bottomUrl, soleUrl);
      setSavedMap((prev) => ({ ...prev, [index]: saved.id }));
      setAttireCount((prev) => prev + 1);
      toast.success("Outfit saved to Attire wardrobe!");
    }
  };

  const handleAddGarmentFromSearch = (file: File, category: "tops" | "bottoms" | "soles") => {
    if (category === "tops") {
      setShirt((prev) => [...prev, file]);
      toast.success("Added top garment to wardrobe.");
    } else if (category === "bottoms") {
      setPants((prev) => [...prev, file]);
      toast.success("Added bottom garment to wardrobe.");
    } else if (category === "soles") {
      setShoes((prev) => [...prev, file]);
      toast.success("Added sole/footwear to wardrobe.");
    }
  };

  const handleRemoveGarment = (identifier: string, category: "tops" | "bottoms" | "soles") => {
    if (category === "tops") {
      setShirt((prev) => prev.filter((f) => f.name !== identifier));
    } else if (category === "bottoms") {
      setPants((prev) => prev.filter((f) => f.name !== identifier));
    } else if (category === "soles") {
      setShoes((prev) => prev.filter((f) => f.name !== identifier));
    }
  };

  const handleRefresh = () => {
    const hasUploadedImages = shirt.length > 0 || pants.length > 0 || shoes.length > 0;
    const hasRecs = recs !== null;

    if (hasUploadedImages || hasRecs) {
      setRefreshConfirmOpen(true);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleConfirmReset = () => {
    setShirt([]);
    setPants([]);
    setShoes([]);
    setPreviews({ tops: [], bottoms: [], soles: [] });
    setRecs(null);
    setLoading(false);
    cache.current.clear();
    window.dispatchEvent(new CustomEvent("wearbot_reset"));
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.success("All images removed", { id: "reset-toast", duration: 1400 });
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col font-sans overflow-x-clip">
      {/* Abstract wave ribbon background matching reference inner box */}
      <WaveBackground className="fixed inset-x-0 bottom-0 pointer-events-none z-0" intensity={0.95} />

      <SiteHeader
        onOpenWardrobe={() => {
          setWardrobeTab("attire");
          setWardrobeOpen(true);
        }}
        onRefresh={handleRefresh}
        wardrobeCount={attireCount + galleryCount}
        onOpenSearch={() => setSearchOpen(true)}
        googleUser={googleUser}
        onOpenProfile={() => setProfileOpen(true)}
      />

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-4 py-10 sm:px-6 md:py-16">
        {/* Upload Boxes: Tops | Bottoms | Soles */}
        <section className="flex w-full flex-col items-center gap-10 md:flex-row md:items-stretch md:justify-center md:gap-0">
          <div className="flex flex-1 justify-center md:pr-8">
            <UploadBox
              label="Tops"
              files={shirt}
              onChange={setShirt}
            />
          </div>
          <div className="flex flex-1 justify-center md:border-x md:border-line md:px-8">
            <UploadBox
              label="Bottoms"
              files={pants}
              onChange={setPants}
            />
          </div>
          <div className="flex flex-1 justify-center md:pl-8">
            <UploadBox
              label="Soles"
              files={shoes}
              onChange={setShoes}
            />
          </div>
        </section>

        {/* Generate Button opens Mode Selection modal (Quick Shuffle vs AI Styling) */}
        <button
          type="button"
          onClick={() => {
            if (shirt.length === 0 || pants.length === 0) {
              toast.error("Please add at least 1 top and 1 bottom to generate outfits.");
              return;
            }
            setGenerationDialogOpen(true);
          }}
          disabled={loading}
          className="mt-14 w-full max-w-xs rounded-md bg-[#D3454A] hover:bg-[#BD363B] active:bg-[#A6292E] py-3 text-sm font-semibold tracking-wide text-white transition-colors disabled:opacity-50 cursor-pointer shadow-md"
        >
          {loading ? "Styling your outfits…" : "Generate Outfits"}
        </button>

        {recs && (
          <section ref={results} className="mt-16 w-full scroll-mt-6">
            <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-4">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
                  {recs[0]?.isBasic ? "Quick Shuffle combinations" : "Outfit recommendations"}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {recs[0]?.isBasic
                    ? "Instant wardrobe combinations."
                    : "Tailored complete combinations with AI styling analysis."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Attire button */}
                <button
                  type="button"
                  onClick={() => {
                    setWardrobeTab("attire");
                    setWardrobeOpen(true);
                  }}
                  className="flex items-center gap-1.5 rounded-md border border-line bg-card px-3 py-1.5 text-xs font-medium hover:border-foreground transition-colors cursor-pointer"
                  title="View saved outfits in Attire"
                >
                  <Bookmark className="h-3.5 w-3.5" />
                  <span>Attire ({attireCount})</span>
                </button>

                {/* Gallery button */}
                <button
                  type="button"
                  onClick={() => {
                    setWardrobeTab("gallery");
                    setWardrobeOpen(true);
                  }}
                  className="flex items-center gap-1.5 rounded-md border border-line bg-card px-3 py-1.5 text-xs font-medium hover:border-foreground transition-colors cursor-pointer"
                  title="View uploaded photos in Gallery"
                >
                  <Images className="h-3.5 w-3.5" />
                  <span>Gallery ({galleryCount})</span>
                </button>
              </div>
            </div>

            {/* 2x2 Recommendations Grid (2 per line on desktop) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {recs.map((rec, i) => {
                const hasSole = Boolean(rec.sole && previews.soles?.[rec.sole - 1]);
                const isSaved = Boolean(savedMap[i]);

                return (
                  <div
                    key={i}
                    className="flex flex-col gap-4 rounded-xl border border-line p-4 sm:p-5 bg-card transition-all hover:shadow-md"
                  >
                    {/* Clean Spacious Garment Photos (Individual 3:4 portrait cards) */}
                    <div
                      className={`grid ${
                        hasSole ? "grid-cols-3" : "grid-cols-2"
                      } gap-2.5 sm:gap-3 p-2.5 rounded-lg border border-line/80 bg-muted/30`}
                    >
                      {/* Top Garment */}
                      <div className="group/item relative aspect-[3/4] w-full overflow-hidden rounded-md bg-background border border-line/50 shadow-2xs">
                        <img
                          src={previews.tops[rec.top - 1]}
                          alt={`Top ${rec.top}`}
                          className="h-full w-full object-cover transition-transform duration-200 group-hover/item:scale-105"
                        />
                        <span className="absolute bottom-1.5 left-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-white uppercase backdrop-blur-xs">
                          Top
                        </span>
                      </div>

                      {/* Bottom Garment */}
                      <div className="group/item relative aspect-[3/4] w-full overflow-hidden rounded-md bg-background border border-line/50 shadow-2xs">
                        <img
                          src={previews.bottoms[rec.bottom - 1]}
                          alt={`Bottom ${rec.bottom}`}
                          className="h-full w-full object-cover transition-transform duration-200 group-hover/item:scale-105"
                        />
                        <span className="absolute bottom-1.5 left-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-white uppercase backdrop-blur-xs">
                          Bottom
                        </span>
                      </div>

                      {/* Footwear / Sole */}
                      {hasSole && (
                        <div className="group/item relative aspect-[3/4] w-full overflow-hidden rounded-md bg-background border border-line/50 shadow-2xs">
                          <img
                            src={previews.soles[rec.sole! - 1]}
                            alt={`Sole ${rec.sole}`}
                            className="h-full w-full object-cover transition-transform duration-200 group-hover/item:scale-105"
                          />
                          <span className="absolute bottom-1.5 left-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-white uppercase backdrop-blur-xs">
                            Sole
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Outfit Details - only shown for AI generated outfits */}
                    {!rec.isBasic && (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-bold text-foreground">
                            {rec.style}
                          </h3>
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                            {rec.score}/10 Match
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">Colours:</span> {rec.colors}
                        </p>
                        <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                          {rec.reason}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">Occasion:</span> {rec.occasion}
                        </p>
                      </div>
                    )}

                    {/* Action Button: Save to Wardrobe */}
                    <div className="mt-auto flex items-center gap-2 pt-2 border-t border-line/60">
                      <button
                        type="button"
                        onClick={() => handleToggleSave(i, rec)}
                        className={`w-full flex items-center justify-center gap-1.5 rounded-md px-4 py-2.5 text-xs font-medium border transition-all cursor-pointer ${
                          isSaved
                            ? "bg-primary/10 border-primary text-primary font-semibold"
                            : "border-line hover:border-foreground bg-card text-foreground"
                        }`}
                        title={isSaved ? "Saved in Attire" : "Save to Attire"}
                      >
                        {isSaved ? (
                          <BookmarkCheck className="h-4 w-4 text-primary" />
                        ) : (
                          <Bookmark className="h-4 w-4" />
                        )}
                        <span>{isSaved ? "Saved in Wardrobe" : "Save to Wardrobe"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      <WardrobeDialog
        open={wardrobeOpen}
        onOpenChange={setWardrobeOpen}
        defaultTab={wardrobeTab}
        onSelectGarment={handleAddGarmentFromSearch}
        onRemoveGarment={handleRemoveGarment}
        uploadedFiles={{ tops: shirt, bottoms: pants, soles: shoes }}
        uploadedCount={shirt.length + pants.length + shoes.length}
      />

      <FashionSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onSelectGarment={handleAddGarmentFromSearch}
      />

      <ProfileDialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
        user={googleUser}
      />

      <GenerationModeDialog
        open={generationDialogOpen}
        onClose={() => setGenerationDialogOpen(false)}
        onSelectMode={(mode) => {
          setGenerationDialogOpen(false);
          onGenerate(mode);
        }}
        limits={aiLimits}
        hasSoles={shoes.length > 0}
        topsCount={shirt.length}
        bottomsCount={pants.length}
      />

      <RefreshConfirmDialog
        open={refreshConfirmOpen}
        onOpenChange={setRefreshConfirmOpen}
        onConfirm={handleConfirmReset}
      />

      <Toaster position="bottom-right" richColors duration={1400} />
    </div>
  );
}
