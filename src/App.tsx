import { useEffect, useRef, useState } from "react";
import { Bookmark, BookmarkCheck, ExternalLink, Images, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { UploadBox } from "@/components/UploadBox";
import { PinterestLogo } from "@/components/PinterestLogo";
import { PinterestConnectDialog } from "@/components/PinterestConnectDialog";
import { WardrobeDialog } from "@/components/WardrobeDialog";
import { FashionSearchDialog } from "@/components/FashionSearchDialog";
import { ProfileDialog } from "@/components/ProfileDialog";
import { GenerationModeDialog } from "@/components/GenerationModeDialog";
import { RefreshConfirmDialog } from "@/components/RefreshConfirmDialog";
import { Toaster } from "@/components/ui/sonner";
import { subscribeToAuth, GoogleUserProfile } from "@/lib/google-auth";
import { getAiLimitState, recordAiGeneration, AiLimitState } from "@/lib/ai-limits";
import {
  ClothingAnalysis,
  OutfitRecommendation,
  SimilarImageResult,
  SimilarImagesResponse,
} from "@/lib/types";
import {
  autoSaveToGallery,
  getGalleryItems,
  getSavedOutfits,
  isOutfitAlreadySaved,
  removeOutfitFromStorage,
  saveOutfitToStorage,
} from "@/lib/wardrobe";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Couldn't read ${file.name}`));
    reader.readAsDataURL(file);
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
  const [shown, setShown] = useState<Record<number, boolean>>({});
  const [similarImages, setSimilarImages] = useState<Record<number, SimilarImageResult[]>>({});
  const [similarLoading, setSimilarLoading] = useState<Record<number, boolean>>({});
  const [providerInfo, setProviderInfo] = useState<Record<number, string>>({});
  const [configNote, setConfigNote] = useState<string | null>(null);
  const [pinterestDialogOpen, setPinterestDialogOpen] = useState(false);
  const [isPinterestConnected, setIsPinterestConnected] = useState(false);

  // Wardrobe state
  const [wardrobeOpen, setWardrobeOpen] = useState(false);
  const [wardrobeTab, setWardrobeTab] = useState<"attire" | "gallery">("attire");
  const [attireCount, setAttireCount] = useState(0);
  const [galleryCount, setGalleryCount] = useState(0);
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});

  // Search Dialog state
  const [searchOpen, setSearchOpen] = useState(false);

  // Google Profile state
  const [googleUser, setGoogleUser] = useState<GoogleUserProfile | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  // Generation Mode Dialog and AI Quota state
  const [generationDialogOpen, setGenerationDialogOpen] = useState(false);
  const [refreshConfirmOpen, setRefreshConfirmOpen] = useState(false);
  const [aiLimits, setAiLimits] = useState<AiLimitState>(() => getAiLimitState());

  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setGoogleUser(user);
      setAiLimits(getAiLimitState(user?.email || user?.uid));
    });
    return () => unsubscribe();
  }, []);

  const handleAddGarmentFromSearch = (file: File, category: "tops" | "bottoms" | "soles") => {
    if (category === "tops") {
      setShirt((prev) => (prev.length < 7 ? [...prev, file] : prev));
    } else if (category === "bottoms") {
      setPants((prev) => (prev.length < 7 ? [...prev, file] : prev));
    } else if (category === "soles") {
      setShoes((prev) => (prev.length < 7 ? [...prev, file] : prev));
    }
    setRecs(null);
  };

  const results = useRef<HTMLElement>(null);
  const cache = useRef(new Map<string, ClothingAnalysis>());
  const ready = shirt.length > 0 && pants.length > 0 && !loading;

  const updateWardrobeState = () => {
    const saved = getSavedOutfits();
    const galleryItems = getGalleryItems();
    setAttireCount(saved.length);
    setGalleryCount(galleryItems.length);

    if (recs && previews.tops.length > 0) {
      const nextMap: Record<string, boolean> = {};
      recs.forEach((rec, idx) => {
        const topPrev = previews.tops[rec.top - 1];
        const bottomPrev = previews.bottoms[rec.bottom - 1];
        const solePrev = rec.sole ? previews.soles[rec.sole - 1] : undefined;
        if (isOutfitAlreadySaved(rec, topPrev, bottomPrev, solePrev)) {
          nextMap[idx] = true;
        }
      });
      setSavedMap(nextMap);
    }
  };

  useEffect(() => {
    updateWardrobeState();
    const handleUpdate = () => updateWardrobeState();
    window.addEventListener("wardrobe_updated", handleUpdate);
    return () => window.removeEventListener("wardrobe_updated", handleUpdate);
  }, [recs, previews]);

  // Auto-save any uploaded clothing images into Wardrobe Gallery
  useEffect(() => {
    const autoSave = async () => {
      const itemsToSave: Array<{
        dataUrl: string;
        category: "Top" | "Bottom" | "Sole";
        name?: string;
      }> = [];

      for (const f of shirt) {
        try {
          const dataUrl = await fileToDataUrl(f);
          itemsToSave.push({ dataUrl, category: "Top", name: f.name });
        } catch (e) {}
      }
      for (const f of pants) {
        try {
          const dataUrl = await fileToDataUrl(f);
          itemsToSave.push({ dataUrl, category: "Bottom", name: f.name });
        } catch (e) {}
      }
      for (const f of shoes) {
        try {
          const dataUrl = await fileToDataUrl(f);
          itemsToSave.push({ dataUrl, category: "Sole", name: f.name });
        } catch (e) {}
      }

      if (itemsToSave.length > 0) {
        await autoSaveToGallery(itemsToSave);
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

  // Check config and Pinterest status on initial load
  useEffect(() => {
    fetch("/api/outfits/config-status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          if (!data.geminiConfigured) {
            toast.error(
              "Gemini API key is not detected in server environment. Please ensure GEMINI_API_KEY is configured in project secrets."
            );
          }
          if (data.pinterest?.connected) {
            setIsPinterestConnected(true);
          }
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

    if (mode === "ai") {
      const currentLimits = getAiLimitState(userKey);
      if (currentLimits.used >= currentLimits.total) {
        toast.error(
          `AI daily limit reached (${currentLimits.used}/${currentLimits.total} used today). Please use Quick Shuffle.`
        );
        return;
      }
      const updatedLimits = recordAiGeneration(userKey);
      setAiLimits(updatedLimits);
    }

    setLoading(true);
    setRecs(null);
    setShown({});
    setSimilarImages({});
    setProviderInfo({});

    try {
      const [tops, bottoms, soles] = await Promise.all([
        Promise.all(shirt.map(fileToDataUrl)),
        Promise.all(pants.map(fileToDataUrl)),
        Promise.all(shoes.map(fileToDataUrl)),
      ]);

      let topsAnalysis: ClothingAnalysis[];
      let bottomsAnalysis: ClothingAnalysis[];
      let solesAnalysis: ClothingAnalysis[];

      if (mode === "basic") {
        // Fast instant analysis without hitting Gemini
        const fallbackAnalysis: ClothingAnalysis = {
          type: "garment",
          primaryColor: "neutral",
          secondaryColors: [],
          pattern: "solid",
          style: "casual",
          fabric: "cotton",
          aesthetic: "minimal",
        };
        topsAnalysis = tops.map((u) => cache.current.get(u) || fallbackAnalysis);
        bottomsAnalysis = bottoms.map((u) => cache.current.get(u) || fallbackAnalysis);
        solesAnalysis = soles.map((u) => cache.current.get(u) || fallbackAnalysis);
      } else {
        // Only send photos that haven't been analysed before to AI
        const fresh = [
          ...new Set([...tops, ...bottoms, ...soles].filter((u) => !cache.current.has(u))),
        ];

        if (fresh.length) {
          const analyseRes = await fetch("/api/outfits/analyse", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ images: fresh }),
          });

          if (!analyseRes.ok) {
            const errData = await analyseRes.json().catch(() => ({}));
            throw new Error(errData.error || "Failed to analyse clothing photos.");
          }

          const { items } = (await analyseRes.json()) as { items: ClothingAnalysis[] };
          fresh.forEach((u, i) => cache.current.set(u, items[i]!));
        }

        topsAnalysis = tops.map((u) => cache.current.get(u)!);
        bottomsAnalysis = bottoms.map((u) => cache.current.get(u)!);
        solesAnalysis = soles.map((u) => cache.current.get(u)!);
      }

      const recommendRes = await fetch("/api/outfits/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tops: topsAnalysis,
          bottoms: bottomsAnalysis,
          soles: solesAnalysis,
          mode,
        }),
      });

      if (!recommendRes.ok) {
        const errData = await recommendRes.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to generate recommendations.");
      }

      const { recommendations } = (await recommendRes.json()) as {
        recommendations: OutfitRecommendation[];
      };

      setPreviews({ tops, bottoms, soles });
      setRecs(recommendations);
      toast.success(
        mode === "basic"
          ? `Generated ${recommendations.length} basic combinations!`
          : `Generated ${recommendations.length} AI outfit recommendation${
              recommendations.length > 1 ? "s" : ""
            }!`
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong — please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSave = (index: number, rec: OutfitRecommendation) => {
    const topPreview = previews.tops[rec.top - 1];
    const bottomPreview = previews.bottoms[rec.bottom - 1];
    const solePreview = rec.sole ? previews.soles[rec.sole - 1] : undefined;

    const existingId = isOutfitAlreadySaved(rec, topPreview, bottomPreview, solePreview);
    if (existingId) {
      removeOutfitFromStorage(existingId);
      toast.info("Removed from Attire");
    } else {
      saveOutfitToStorage(rec, topPreview, bottomPreview, solePreview);
      toast.success("saved to wardrobe");
    }
    updateWardrobeState();
  };

  const toggleShown = async (index: number, rec: OutfitRecommendation) => {
    const nextState = !shown[index];
    setShown((s) => ({ ...s, [index]: nextState }));

    // If opening and not yet fetched, fetch the 4 visually similar real images
    if (nextState && !similarImages[index]) {
      setSimilarLoading((prev) => ({ ...prev, [index]: true }));
      try {
        const topAnalysis = cache.current.get(previews.tops[rec.top - 1]);
        const bottomAnalysis = cache.current.get(previews.bottoms[rec.bottom - 1]);
        const soleAnalysis =
          rec.sole && previews.soles[rec.sole - 1]
            ? cache.current.get(previews.soles[rec.sole - 1])
            : undefined;

        const res = await fetch("/api/outfits/similar-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            style: rec.style,
            colors: rec.colors,
            top: topAnalysis,
            bottom: bottomAnalysis,
            sole: soleAnalysis,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to fetch similar images.");
        }

        const data = (await res.json()) as SimilarImagesResponse;
        setSimilarImages((prev) => ({ ...prev, [index]: data.results || [] }));
        setProviderInfo((prev) => ({ ...prev, [index]: data.provider }));
        if (data.note) {
          setConfigNote(data.note);
        }
      } catch (err: any) {
        toast.error(err?.message || "Could not fetch Pinterest images.");
      } finally {
        setSimilarLoading((prev) => ({ ...prev, [index]: false }));
      }
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
    setShown({});
    setSimilarImages({});
    setProviderInfo({});
    cache.current.clear();
    window.dispatchEvent(new CustomEvent("wearbot_reset"));
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.success("All images removed", { id: "reset-toast", duration: 1400 });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <SiteHeader
        onOpenPinterest={() => setPinterestDialogOpen(true)}
        isPinterestConnected={isPinterestConnected}
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

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-4 py-10 sm:px-6 md:py-16">
        {/* Upload Boxes: Tops | Bottoms | Soles */}
        <section className="flex w-full flex-col items-center gap-10 md:flex-row md:items-stretch md:justify-center md:gap-0">
          <div className="flex flex-1 justify-center md:pr-8">
            <UploadBox
              label="Tops"
              files={shirt}
              onChange={(f) => {
                setShirt(f);
                setRecs(null);
              }}
            />
          </div>
          <div className="hidden w-px bg-line md:block" aria-hidden />
          <div className="flex flex-1 justify-center md:px-8">
            <UploadBox
              label="Bottoms"
              files={pants}
              onChange={(f) => {
                setPants(f);
                setRecs(null);
              }}
            />
          </div>
          <div className="hidden w-px bg-line md:block" aria-hidden />
          <div className="flex flex-1 justify-center md:pl-8">
            <UploadBox
              label="Soles"
              files={shoes}
              onChange={(f) => {
                setShoes(f);
                setRecs(null);
              }}
            />
          </div>
        </section>

        <div className="mt-12 hidden h-px w-full bg-line md:block" aria-hidden />

        <button
          type="button"
          disabled={!ready || loading}
          onClick={() => {
            const userKey = googleUser?.email || googleUser?.uid;
            setAiLimits(getAiLimitState(userKey));
            setGenerationDialogOpen(true);
          }}
          className="mt-12 flex w-full max-w-md items-center justify-center gap-2 rounded-md bg-pinterest px-8 py-3 text-center text-base font-medium text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Styling your outfits…" : "Generate Outfits"}
        </button>

        {recs && (
          <section ref={results} className="mt-16 w-full scroll-mt-6">
            <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-4">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
                  {recs[0]?.isBasic ? "Quick Shuffle combinations" : "Outfit recommendations"}
                  {!recs[0]?.isBasic && (
                    <button
                      type="button"
                      onClick={() => setPinterestDialogOpen(true)}
                      className="flex items-center gap-1 text-sm font-normal text-muted-foreground hover:text-pinterest transition-colors"
                    >
                      · inspired by <PinterestLogo className="h-4 w-4 text-pinterest" /> Pinterest
                      <span className="text-[10px] underline ml-0.5">(settings)</span>
                    </button>
                  )}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {recs[0]?.isBasic
                    ? "Instant wardrobe combinations."
                    : "Tailored complete combinations with AI styling analysis and visual inspiration."}
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
                  className="flex items-center gap-1.5 rounded-md border border-line bg-card px-3 py-1.5 text-xs font-medium hover:border-foreground transition-colors"
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
                  className="flex items-center gap-1.5 rounded-md border border-line bg-card px-3 py-1.5 text-xs font-medium hover:border-foreground transition-colors"
                  title="View uploaded photos in Gallery"
                >
                  <Images className="h-3.5 w-3.5" />
                  <span>Gallery ({galleryCount})</span>
                </button>

                {/* Pinterest button */}
                <button
                  type="button"
                  onClick={() => setPinterestDialogOpen(true)}
                  className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs font-medium hover:border-pinterest hover:text-pinterest transition-colors"
                >
                  <PinterestLogo className="h-3.5 w-3.5 text-pinterest" />
                  {isPinterestConnected ? "Pinterest Connected" : "Connect Pinterest"}
                </button>
              </div>
            </div>

            {/* 2x2 Recommendations Grid (2 per line on desktop) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {recs.map((rec, i) => {
                const hasSole = Boolean(rec.sole && previews.soles?.[rec.sole - 1]);

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
                          <span className="inline-flex items-center rounded-full bg-pinterest/10 px-2.5 py-0.5 text-xs font-bold text-pinterest">
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

                    {/* Action Buttons: Show Pinterest & Save to Wardrobe */}
                    <div className="mt-auto flex items-center gap-2 pt-2 border-t border-line/60">
                      {!rec.isBasic && (
                        <button
                          type="button"
                          onClick={() => toggleShown(i, rec)}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-85 cursor-pointer"
                        >
                          <PinterestLogo className="h-3.5 w-3.5 text-pinterest" />
                          {shown[i] ? "Hide Pinterest inspirations" : "4 Pinterest inspirations"}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleToggleSave(i, rec)}
                        className={`flex items-center justify-center gap-1.5 rounded-md px-4 py-2.5 text-xs font-medium border transition-all cursor-pointer ${
                          rec.isBasic ? "w-full" : ""
                        } ${
                          savedMap[i]
                            ? "bg-pinterest/10 border-pinterest text-pinterest font-semibold"
                            : "border-line hover:border-foreground bg-card text-foreground"
                        }`}
                        title={savedMap[i] ? "Saved in Attire" : "Save to Attire"}
                      >
                        {savedMap[i] ? (
                          <BookmarkCheck className="h-4 w-4 text-pinterest" />
                        ) : (
                          <Bookmark className="h-4 w-4" />
                        )}
                        <span>{savedMap[i] ? "Saved" : "Save to Wardrobe"}</span>
                      </button>
                    </div>

                    {/* Expanded 4 Visually Similar Internet Images (Only for AI generation) */}
                    {!rec.isBasic && shown[i] && (
                      <div className="mt-2 flex flex-col gap-2 border-t border-line/60 pt-2 animate-in fade-in-50 duration-200">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                          <span className="flex items-center gap-1 text-foreground">
                            <PinterestLogo className="h-3 w-3 text-pinterest" />
                            4 Similar Outfits
                          </span>
                          {providerInfo[i] && (
                            <span className="text-[10px] text-muted-foreground font-normal">
                              via {providerInfo[i]}
                            </span>
                          )}
                        </div>

                        {similarLoading[i] ? (
                          <div className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-line bg-muted/30 text-xs text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin text-pinterest" />
                            <span>Finding 4 similar outfits…</span>
                          </div>
                        ) : similarImages[i] && similarImages[i].length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                            {similarImages[i].slice(0, 4).map((item, imgIdx) => (
                              <a
                                key={item.id || imgIdx}
                                href={item.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative flex flex-col overflow-hidden rounded-md border border-line bg-background transition-all hover:border-pinterest hover:shadow-xs"
                                title={`${item.title} — Click to view on Pinterest`}
                              >
                                <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
                                  <img
                                    src={item.imageUrl}
                                    alt={item.title}
                                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                                    loading="lazy"
                                  />
                                  <span className="absolute bottom-1 right-1 rounded bg-black/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100">
                                    <ExternalLink className="h-3 w-3" />
                                  </span>
                                </div>
                                <div className="p-1">
                                  <p className="truncate text-[10px] font-medium leading-tight group-hover:text-pinterest">
                                    {item.title}
                                  </p>
                                  <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
                                    <PinterestLogo className="h-2 w-2 text-pinterest" />
                                    {item.sourceDomain}
                                  </span>
                                </div>
                              </a>
                            ))}
                          </div>
                        ) : (
                          <div className="flex aspect-[3/4] items-center justify-center rounded-md border border-dashed border-line p-2 text-center text-xs text-muted-foreground">
                            No similar images found.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {!recs[0]?.isBasic && configNote && (
              <div className="mt-8 flex items-start gap-2.5 rounded-lg border border-line bg-accent/30 p-3 text-xs text-muted-foreground">
                <Info className="h-4 w-4 shrink-0 text-foreground mt-0.5" />
                <div className="leading-relaxed">
                  <p className="font-medium text-foreground">Internet & Pinterest Image Integration</p>
                  <p>{configNote}</p>
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      <PinterestConnectDialog
        open={pinterestDialogOpen}
        onOpenChange={setPinterestDialogOpen}
        onConnectedChange={setIsPinterestConnected}
      />

      <WardrobeDialog
        open={wardrobeOpen}
        onOpenChange={setWardrobeOpen}
        defaultTab={wardrobeTab}
        onSelectGarment={handleAddGarmentFromSearch}
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
