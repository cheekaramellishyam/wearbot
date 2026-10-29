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
  "sweatpants", "joggers", "skirt", "dress", "suit", "bootcut", "flared", "baggy",
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

  // Short words (colors, brands, aesthetics) default to fashion
  return true;
}

export function detectCategory(
  query: string,
  categoryFilter?: "all" | "tops" | "bottoms" | "soles"
): "tops" | "bottoms" | "soles" {
  if (categoryFilter && categoryFilter !== "all") {
    return categoryFilter;
  }
  const lower = query.toLowerCase();
  if (/pants|jeans|trousers|chinos|shorts|cargo|joggers|slacks|bottom|bootcut|flared|denim|skirt/i.test(lower)) {
    return "bottoms";
  }
  if (/shoes|sneakers|boots|loafers|sandals|slides|oxford|footwear|soles|kicks|trainer|runner/i.test(lower)) {
    return "soles";
  }
  return "tops";
}

// Search DuckDuckGo images for live web fashion items
async function searchDuckDuckGoImages(
  query: string,
  category: "tops" | "bottoms" | "soles"
): Promise<WebFashionItem[]> {
  const results: WebFashionItem[] = [];
  try {
    const q = `${query} fashion outfit clothing`;
    const tokenRes = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(q)}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!tokenRes.ok) return [];
    const html = await tokenRes.text();
    const vqdMatch = html.match(/vqd=([0-9-]+)/) || html.match(/vqd="([^"]+)"/);
    if (!vqdMatch) return [];

    const vqd = vqdMatch[1];
    const imgRes = await fetch(
      `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(q)}&vqd=${vqd}&f=,,,`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Referer: "https://duckduckgo.com/",
        },
      }
    );

    if (!imgRes.ok) return [];
    const data = await imgRes.json();
    const list = data?.results || [];
    const seen = new Set<string>();

    for (const r of list) {
      const imgUrl = r.image;
      if (
        imgUrl &&
        (imgUrl.startsWith("http://") || imgUrl.startsWith("https://")) &&
        !seen.has(imgUrl)
      ) {
        seen.add(imgUrl);

        let itemCat = category;
        const text = `${r.title || ""} ${query}`.toLowerCase();
        if (/pants|jeans|trousers|chinos|shorts|cargo|bottom|bootcut|flare/i.test(text)) {
          itemCat = "bottoms";
        } else if (/shoe|sneaker|boot|loafer|sandal|sole|footwear|kicks/i.test(text)) {
          itemCat = "soles";
        } else if (/shirt|tee|jacket|sweater|hoodie|polo|coat|top/i.test(text)) {
          itemCat = "tops";
        }

        const cleanTitle = (r.title || `${query} Fashion Item`)
          .replace(/<\/?b>/g, "")
          .replace(/&amp;/g, "&")
          .replace(/&#39;/g, "'")
          .replace(/\.\.\.$/, "")
          .trim();

        results.push({
          id: `ddg-${results.length + 1}-${Date.now()}`,
          title: cleanTitle,
          imageUrl: imgUrl,
          thumbUrl: r.thumbnail || imgUrl,
          sourceUrl: r.url || `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`,
          category: itemCat,
        });

        if (results.length >= 36) break;
      }
    }
  } catch (err) {
    console.warn("DuckDuckGo image search error:", err);
  }
  return results;
}

// Search Bing images as secondary engine
async function searchBingImages(
  query: string,
  category: "tops" | "bottoms" | "soles"
): Promise<WebFashionItem[]> {
  const results: WebFashionItem[] = [];
  try {
    const searchUrl =
      "https://www.bing.com/images/search?q=" +
      encodeURIComponent(`${query} fashion outfit`) +
      "&qft=+filterui:aspect-tall";

    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
    });

    if (!res.ok) return [];

    const html = await res.text();
    const matches = [...html.matchAll(/class="iusc"[^>]*m="([^"]+)"/g)];
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

          let itemCat = category;
          const combined = (
            (json.t || "") +
            " " +
            (json.desc || "") +
            " " +
            query
          ).toLowerCase();

          if (/pants|jeans|trousers|chinos|shorts|cargo|bottom|bootcut/i.test(combined)) {
            itemCat = "bottoms";
          } else if (
            /shoe|sneaker|boot|loafer|sandal|sole|footwear|kicks/i.test(combined)
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
            id: `bing-${results.length + 1}-${Date.now()}`,
            title: rawTitle || `${query} Fashion Item`,
            imageUrl: imgUrl,
            thumbUrl: json.turl || imgUrl,
            sourceUrl:
              json.purl ||
              `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`,
            category: itemCat,
          });

          if (results.length >= 30) break;
        }
      } catch (e) {}
    }
  } catch (err) {
    console.warn("Bing image search error:", err);
  }
  return results;
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
        "WearBot search is dedicated exclusively to fashion, garments, and footwear. Try searching for shirts, pants, sneakers, jackets, or style aesthetics (e.g. 'bootcut jeans', 'oversized tee', 'chelsea boots').",
      query,
      results: [],
      total: 0,
    };
  }

  const category = detectCategory(query, categoryFilter);

  // 2. Primary: DuckDuckGo live web search
  let webResults = await searchDuckDuckGoImages(query, category);

  // 3. Secondary: Bing image search if DDG returned few or zero
  if (webResults.length < 12) {
    const bingResults = await searchBingImages(query, category);
    const existingUrls = new Set(webResults.map((r) => r.imageUrl));
    for (const b of bingResults) {
      if (!existingUrls.has(b.imageUrl)) {
        webResults.push(b);
        existingUrls.add(b.imageUrl);
      }
    }
  }

  // 4. Tertiary: Merge with high-resolution fashion catalog items to ensure 24-36 items minimum
  const catalogMatches = searchLocalFashionCatalog(query, categoryFilter);
  const existingUrls = new Set(webResults.map((r) => r.imageUrl));

  for (const catItem of catalogMatches) {
    if (!existingUrls.has(catItem.imageUrl)) {
      webResults.push({
        id: catItem.id,
        title: catItem.title,
        imageUrl: catItem.imageUrl,
        thumbUrl: catItem.imageUrl,
        sourceUrl: catItem.sourceUrl,
        category: catItem.category,
        subCategory: catItem.subCategory,
        color: catItem.color,
        style: catItem.style,
      });
      existingUrls.add(catItem.imageUrl);
    }
  }

  // Filter by category if user specifically picked category filter
  if (categoryFilter && categoryFilter !== "all") {
    webResults = webResults.filter((item) => item.category === categoryFilter);
  }

  return {
    isFashion: true,
    query,
    results: webResults.slice(0, 36),
    total: webResults.length,
  };
}
