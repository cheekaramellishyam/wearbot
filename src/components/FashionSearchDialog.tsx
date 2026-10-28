import { useState, useEffect, useRef, useMemo } from "react";
import {
  AlertCircle,
  ExternalLink,
  Globe,
  Loader2,
  Plus,
  Search,
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
import { WaveBackground } from "@/components/WaveBackground";

interface WebFashionItem {
  id: string;
  title: string;
  imageUrl: string;
  thumbUrl: string;
  sourceUrl: string;
  category: "tops" | "bottoms" | "soles";
  subCategory?: string;
  color?: string;
  style?: string;
}

interface FashionSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectGarment?: (file: File, category: "tops" | "bottoms" | "soles") => void;
}

export function FashionSearchDialog({
  open,
  onOpenChange,
  onSelectGarment,
}: FashionSearchDialogProps) {
  const [query, setQuery] = useState("");
  const [webResults, setWebResults] = useState<WebFashionItem[]>([]);
  const [loadingWeb, setLoadingWeb] = useState(false);
  const [nonFashionError, setNonFashionError] = useState<string | null>(null);
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const searchTimeoutRef = useRef<any>(null);

  // Search the web whenever query changes
  const performWebSearch = async (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      setWebResults([]);
      setNonFashionError(null);
      setLoadingWeb(false);
      return;
    }

    setLoadingWeb(true);
    setNonFashionError(null);

    try {
      const url = `/api/fashion/search?q=${encodeURIComponent(trimmed)}&category=all`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Search service temporarily unavailable");
      const data = await res.json();

      if (data.isFashion === false) {
        setNonFashionError(
          data.message ||
            "Please search for clothing, footwear, fabrics, or fashion styles. Search is strictly scoped to fashion."
        );
        setWebResults([]);
      } else {
        setNonFashionError(null);
        setWebResults(data.results || []);
      }
    } catch (err: any) {
      console.warn("Fashion web search error:", err);
      setWebResults([]);
    } finally {
      setLoadingWeb(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim()) {
      setWebResults([]);
      setNonFashionError(null);
      setLoadingWeb(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      performWebSearch(query);
    }, 400);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [query, open]);

  // Strictly return web results when searched; NO images displayed before searching
  const displayItems = useMemo(() => {
    if (!query.trim()) return [];
    return webResults;
  }, [query, webResults]);

  const handleAddGarment = async (item: WebFashionItem) => {
    if (!onSelectGarment) return;
    setLoadingItemId(item.id);

    try {
      const proxyUrl = `/api/fashion/proxy-image?url=${encodeURIComponent(item.imageUrl)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error("Could not download garment image");
      const blob = await res.blob();
      const filename = `${item.title.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 40)}.jpg`;
      const file = new File([blob], filename, { type: blob.type || "image/jpeg" });

      onSelectGarment(file, item.category);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load garment. Please try another image or drag & drop.");
    } finally {
      setLoadingItemId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] h-[88vh] max-h-[88vh] flex flex-col p-4 sm:p-6 overflow-hidden bg-background">
        {/* Abstract wave ribbon background matching reference inner box */}
        <WaveBackground className="absolute inset-x-0 bottom-0 pointer-events-none z-0" intensity={0.75} />

        {/* Search Header */}
        <DialogHeader className="border-b border-line pb-4 relative z-10">
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight">
                  Live Fashion Web Search
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Search fashion garments from the web
                </DialogDescription>
              </div>
            </div>

            {loadingWeb && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-pinterest" />
                <span>Searching web…</span>
              </div>
            )}
          </div>

          {/* Search Input Box */}
          <div className="relative mt-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  performWebSearch(query);
                }
              }}
              placeholder="Search fashion garments (e.g. brown leather jacket, linen trousers, samba sneakers)..."
              className="w-full rounded-lg border border-line bg-muted/40 py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:bg-background focus:outline-hidden transition-all shadow-2xs"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setWebResults([]);
                  setNonFashionError(null);
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </DialogHeader>

        {/* Results Grid / Feedback */}
        <div className="flex-1 overflow-y-auto py-4 relative z-10">
          {/* Non-Fashion Guardrail Notice */}
          {nonFashionError ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-3">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">Fashion Only Search</h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-md leading-relaxed">
                {nonFashionError}
              </p>
            </div>
          ) : loadingWeb && displayItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-pinterest mb-3" />
              <h3 className="text-sm font-semibold">Browsing the web for "{query}"…</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Retrieving real fashion photos and styling inspiration.
              </p>
            </div>
          ) : !query.trim() ? (
            /* Clean Empty State when dialog opens: NO pre-loaded images */
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted border border-line mb-3">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Search for Fashion Items</h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                Type above to find clothing items and footwear to add to your outfit combinations.
              </p>
            </div>
          ) : displayItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted border border-line mb-3">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold">No fashion results for "{query}"</h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                Try searching for specific garments, colors, or styles (e.g. "oversized black tee", "navy chinos", "leather loafers").
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-4">
              {displayItems.map((item: WebFashionItem) => {
                const isLoading = loadingItemId === item.id;
                const buttonLabel =
                  item.category === "tops"
                    ? "Add to Tops"
                    : item.category === "bottoms"
                    ? "Add to Bottoms"
                    : "Add to Soles";

                return (
                  <div
                    key={item.id}
                    className="group relative flex flex-col rounded-xl border border-line bg-card overflow-hidden transition-all hover:shadow-md hover:border-foreground/30"
                  >
                    {/* Item Image with Source Link */}
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
                      <img
                        src={item.thumbUrl || item.imageUrl}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.src.includes("/api/fashion/proxy-image")) {
                            target.src = `/api/fashion/proxy-image?url=${encodeURIComponent(
                              item.imageUrl
                            )}`;
                          }
                        }}
                      />

                      {/* Category Badge */}
                      <span className="absolute top-2 left-2 rounded-sm bg-black/75 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase backdrop-blur-xs">
                        {item.category === "tops"
                          ? "Top"
                          : item.category === "bottoms"
                          ? "Bottom"
                          : "Sole"}
                      </span>

                      {/* Source Link */}
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-pinterest"
                        title="View style source"
                        aria-label="View source"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>

                    {/* Content & Metadata */}
                    <div className="p-3 flex flex-col flex-1 gap-1">
                      <h4
                        className="text-xs font-bold text-foreground line-clamp-2 leading-snug"
                        title={item.title}
                      >
                        {item.title}
                      </h4>

                      {/* Action Button: Add to Outfit Generator */}
                      <button
                        type="button"
                        onClick={() => handleAddGarment(item)}
                        disabled={isLoading}
                        className="mt-auto pt-2 w-full flex items-center justify-center gap-1.5 rounded-md bg-foreground text-background py-2 px-3 text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer shadow-2xs"
                      >
                        {isLoading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Plus className="h-3.5 w-3.5" />
                        )}
                        <span>{isLoading ? "Adding…" : buttonLabel}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
