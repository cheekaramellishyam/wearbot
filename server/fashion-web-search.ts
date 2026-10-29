import { searchLocalFashionCatalog } from "../src/components/FashionSearchCatalog";

export interface WebFashionItem {
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

export interface WebFashionSearchResponse {
  isFashion: boolean;
  message?: string;
  query: string;
  enhancedQuery?: string;
  results: WebFashionItem[];
  total: number;
}

const NON_FASHION_KEYWORDS = [
  "math", "algebra", "calculus", "equation", "theorem", "physics",
  "python", "javascript", "c++", "programming", "coding", "algorithm",
  "crypto", "bitcoin", "ethereum", "stock market", "forex", "trading",
  "car engine", "exhaust", "airplane", "aerospace", "submarine",
  "surgery", "medical diagnosis", "disease", "vaccine", "bacteria", "virus",
  "recipe", "pizza", "burger", "baking cake", "cooking pasta"
];

const FASHION_KEYWORDS = [
  "shirt", "tee", "t-shirt", "top", "polo", "blouse", "sweater", "knit", "knitwear",
  "hoodie", "sweatshirt", "jacket", "coat", "blazer", "overshirt", "cardigan", "vest",
  "denim", "jeans", "pants", "trousers", "chinos", "slacks", "shorts", "cargo",
  "sweatpants", "joggers", "skirt", "dress", "suit",
  "shoes", "sneakers", "boots", "loafers", "oxfords", "brogues", "sandals", "slides",
  "mules", "heels", "flats", "kicks", "footwear", "soles", "trainer", "runners",
  "clothing", "clothes", "outfit", "apparel", "wear", "wardrobe", "attire",
  "fashion", "style", "streetwear", "smart casual", "formal", "casual", "vintage",
  "retro", "minimalist", "preppy", "y2k", "grunge", "athleisure", "linen", "cotton",
  "leather", "suede", "wool", "silk", "corduroy", "flannel", "fleece", "cashmere",
  "beige", "black", "white", "navy", "blue", "brown", "olive", "khaki", "green",
  "grey", "charcoal", "burgundy", "cream", "oversized", "tailored", "relaxed", "slim"
];

export function isFashionRelated(query: string): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;

  // Check explicit non-fashion blacklist
  for (const bad of NON_FASHION_KEYWORDS) {
    if (q.includes(bad)) {
      return false;
    }
  }

  // If query contains any fashion keyword, it's fashion
  for (const good of FASHION_KEYWORDS) {
    if (q.includes(good)) {
      return true;
    }
  }

  // If short (1-3 words) and not non-fashion, treat as fashion aesthetics/colors/brands
  // (e.g. "zara", "nike", "cream textured", "oversized", "dark aesthetic")
  return true;
}

export function buildFashionSearchQuery(
  rawQuery: string,
  categoryFilter?: "all" | "tops" | "bottoms" | "soles"
): { enhancedQuery: string; category: "tops" | "bottoms" | "soles" } {
  const q = rawQuery.trim();
  const lower = q.toLowerCase();

  let detectedCategory: "tops" | "bottoms" | "soles" = "tops";

  if (categoryFilter && categoryFilter !== "all") {
    detectedCategory = categoryFilter;
  } else if (/pants|jeans|trousers|chinos|shorts|cargo|joggers|slacks|bottom/i.test(lower)) {
    detectedCategory = "bottoms";
  } else if (/shoes|sneakers|boots|loafers|sandals|slides|oxford|footwear|soles|kicks/i.test(lower)) {
    detectedCategory = "soles";
  } else {
    detectedCategory = "tops";
  }

  let scope = "fashion clothing outfit";
  if (detectedCategory === "tops") {
    scope = "shirt jacket tops fashion apparel outfit";
  } else if (detectedCategory === "bottoms") {
    scope = "pants jeans trousers chinos bottoms fashion outfit";
  } else if (detectedCategory === "soles") {
    scope = "shoes sneakers loafers boots footwear fashion";
  }

  const enhancedQuery = `${q} ${scope}`.trim();
  return { enhancedQuery, category: detectedCategory };
}

export async function searchFashionImagesOnWeb(
  rawQuery: string,
  categoryFilter?: "all" | "tops" | "bottoms" | "soles"
): Promise<WebFashionSearchResponse> {
  const query = rawQuery.trim();

  // 1. Guardrail: Verify fashion relation
  if (!isFashionRelated(query)) {
    return {
      isFashion: false,
      message:
        "WearBot search is dedicated exclusively to fashion, garments, and footwear. Try searching for shirts, pants, sneakers, jackets, or style aesthetics (e.g. 'linen shirt', 'raw denim', 'chelsea boots').",
      query,
      results: [],
      total: 0,
    };
  }

  // 2. Build scoped fashion search query
  const { enhancedQuery, category } = buildFashionSearchQuery(query, categoryFilter);

  try {
    const searchUrl =
      "https://www.bing.com/images/search?q=" +
      encodeURIComponent(enhancedQuery) +
      "&qft=+filterui:aspect-tall";

    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
    });

    if (!res.ok) {
      throw new Error(`Web image search returned status ${res.status}`);
    }

    const html = await res.text();
    const matches = [...html.matchAll(/class="iusc"[^>]*m="([^"]+)"/g)];
    const results: WebFashionItem[] = [];
    const seenUrls = new Set<string>();

    for (const match of matches) {
      try {
        const decoded = match[1].replace(/&quot;/g, '"');
        const json = JSON.parse(decoded);
        const imgUrl = json.murl;

        if (
          imgUrl &&
          (imgUrl.startsWith("http://") || imgUrl.startsWith("https://")) &&
          !seenUrls.has(imgUrl)
        ) {
          seenUrls.add(imgUrl);

          // Categorize
          let itemCat: "tops" | "bottoms" | "soles" = category;
          const combined = (
            (json.t || "") +
            " " +
            (json.desc || "") +
            " " +
            query
          ).toLowerCase();

          if (/pants|jeans|trousers|chinos|shorts|cargo|bottom/i.test(combined)) {
            itemCat = "bottoms";
          } else if (
            /shoe|sneaker|boot|loafer|sandal|sole|footwear|kicks|slides/i.test(combined)
          ) {
            itemCat = "soles";
          } else if (/shirt|tee|jacket|sweater|hoodie|polo|coat|top/i.test(combined)) {
            itemCat = "tops";
          }

          const rawTitle = (json.t || json.desc || query)
            .replace(/<\/?b>/g, "")
            .replace(/&amp;/g, "&")
            .replace(/\.\.\.$/, "")
            .trim();

          results.push({
            id: `web-${results.length + 1}-${Date.now()}`,
            title: rawTitle || `${query} Fashion Item`,
            imageUrl: imgUrl,
            thumbUrl: json.turl || imgUrl,
            sourceUrl:
              json.purl ||
              `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`,
            category: itemCat,
          });

          if (results.length >= 24) break;
        }
      } catch (e) {
        // Continue to next match
      }
    }

    if (results.length === 0) {
      const localMatches = searchLocalFashionCatalog(query, categoryFilter);
      if (localMatches.length > 0) {
        return {
          isFashion: true,
          query,
          enhancedQuery,
          results: localMatches.map((item) => ({
            id: item.id,
            title: item.title,
            imageUrl: item.imageUrl,
            thumbUrl: item.imageUrl,
            sourceUrl: item.sourceUrl,
            category: item.category,
            subCategory: item.subCategory,
            color: item.color,
            style: item.style,
          })),
          total: localMatches.length,
        };
      }
    }

    return {
      isFashion: true,
      query,
      enhancedQuery,
      results,
      total: results.length,
    };
  } catch (err: any) {
    console.error("Error searching web fashion images:", err);
    const localMatches = searchLocalFashionCatalog(query, categoryFilter);
    if (localMatches.length > 0) {
      return {
        isFashion: true,
        query,
        enhancedQuery,
        results: localMatches.map((item) => ({
          id: item.id,
          title: item.title,
          imageUrl: item.imageUrl,
          thumbUrl: item.imageUrl,
          sourceUrl: item.sourceUrl,
          category: item.category,
          subCategory: item.subCategory,
          color: item.color,
          style: item.style,
        })),
        total: localMatches.length,
      };
    }

    return {
      isFashion: true,
      query,
      enhancedQuery,
      results: [],
      total: 0,
      message: err?.message || "Failed to fetch images from the web.",
    };
  }
}

