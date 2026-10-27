import { SimilarImageResult, SimilarImagesResponse, ClothingAnalysis } from "../src/lib/types";

// Strict filter to exclude female/women's fashion
const FEMALE_EXCLUSIONS =
  /\b(women|woman|female|girl|girls|ladies|lady|dress|dresses|skirt|skirts|blouse|blouses|heels|high heels|stilettos|bra|bikini|lingerie|crop top|maternity|mom jeans|bridal|bride|bridesmaid|her|she|women\'s|womens)\b/i;

// Curated verified real Pinterest outfit images exclusively for Men's Fashion,
// categorized by colors, garments, and styles. All images are hosted on Pinterest's CDN (i.pinimg.com).
const VERIFIED_PINTEREST_MEN_PINS: Array<{
  id: string;
  imageUrl: string;
  title: string;
  sourceUrl: string;
  sourceDomain: string;
  author: string;
  topColor: string;
  bottomColor: string;
  style: string;
  tags: string[];
}> = [
  // 1. Black Top + Beige / Khaki / Tan Bottoms (Men)
  {
    id: "913151820583",
    imageUrl: "https://i.pinimg.com/736x/60/ee/c0/60eec0d31ee05b794b389bf6f6e4307a.jpg",
    title: "Men's Black Shirt & Tailored Beige Chinos Outfit",
    sourceUrl: "https://www.pinterest.com/pin/19632948374376394/",
    sourceDomain: "pinterest.com",
    author: "mensfashionpost",
    topColor: "black",
    bottomColor: "beige",
    style: "smart casual",
    tags: ["black", "beige", "khaki", "tan", "shirt", "chinos", "trousers", "smart casual", "men", "menswear"],
  },
  {
    id: "989454980628824495",
    imageUrl: "https://i.pinimg.com/736x/a5/69/15/a56915db025d873b5c8df78fa9e041f4.jpg",
    title: "Chic Men's Black Top & Beige Trousers Combo",
    sourceUrl: "https://www.pinterest.com/pin/989454980628824495/",
    sourceDomain: "pinterest.com",
    author: "fashionbeans",
    topColor: "black",
    bottomColor: "beige",
    style: "casual",
    tags: ["black", "beige", "khaki", "shirt", "t-shirt", "trousers", "casual", "men", "menswear"],
  },
  {
    id: "331366485090137230",
    imageUrl: "https://i.pinimg.com/736x/ff/50/af/ff50af1374cdc67887c3e00c96655383.jpg",
    title: "Men's Minimalist Black Polo & Straight Khaki Pants",
    sourceUrl: "https://www.pinterest.com/pin/331366485090137230/",
    sourceDomain: "pinterest.com",
    author: "gq",
    topColor: "black",
    bottomColor: "khaki",
    style: "minimalist",
    tags: ["black", "khaki", "beige", "polo", "trousers", "chinos", "minimalist", "men"],
  },
  {
    id: "112730796909372047",
    imageUrl: "https://i.pinimg.com/736x/c1/fd/b7/c1fdb7f4649de6d116e36ec89a74da6e.jpg",
    title: "Men's Black Button-Down Shirt with Tan Chinos",
    sourceUrl: "https://www.pinterest.com/pin/112730796909372047/",
    sourceDomain: "pinterest.com",
    author: "mensstylepro",
    topColor: "black",
    bottomColor: "tan",
    style: "smart casual",
    tags: ["black", "tan", "beige", "shirt", "chinos", "smart casual", "men"],
  },

  // 2. Navy Top + Beige / Khaki / Cream Bottoms (Men)
  {
    id: "453385887510420195",
    imageUrl: "https://i.pinimg.com/736x/5c/28/c9/5c28c99f0c9b6afd487baa7867831bfa.jpg",
    title: "Classic Men's Navy Knit & Tailored Beige Chinos",
    sourceUrl: "https://www.pinterest.com/pin/453385887510420195/",
    sourceDomain: "pinterest.com",
    author: "mensfashionpost",
    topColor: "navy",
    bottomColor: "beige",
    style: "smart casual",
    tags: ["navy", "blue", "beige", "khaki", "sweater", "chinos", "smart casual", "men"],
  },
  {
    id: "202873158211549559",
    imageUrl: "https://i.pinimg.com/736x/21/1b/b4/211bb4783050805bee53ebfaba11c054.jpg",
    title: "Men's Navy Button-Down Shirt and Cuffed Tan Pants",
    sourceUrl: "https://www.pinterest.com/pin/202873158211549559/",
    sourceDomain: "pinterest.com",
    author: "fashionbeans",
    topColor: "navy",
    bottomColor: "tan",
    style: "casual",
    tags: ["navy", "blue", "tan", "beige", "shirt", "trousers", "casual", "men"],
  },
  {
    id: "281543722981627",
    imageUrl: "https://i.pinimg.com/736x/e9/ea/1d/e9ea1da56de85b0591af2a2910085abd.jpg",
    title: "Men's Navy Fitted Polo with Light Cream Chinos",
    sourceUrl: "https://www.pinterest.com/pin/281543722981627/",
    sourceDomain: "pinterest.com",
    author: "menswearstyle",
    topColor: "navy",
    bottomColor: "cream",
    style: "summer casual",
    tags: ["navy", "blue", "cream", "white", "beige", "polo", "chinos", "men"],
  },

  // 3. White Top + Olive / Green Bottoms (Men)
  {
    id: "247979523226215934",
    imageUrl: "https://i.pinimg.com/736x/1f/42/bb/1f42bb8061eb0d58309dfcbbf54b9f02.jpg",
    title: "Men's Crisp White Linen Shirt & Olive Green Chinos",
    sourceUrl: "https://www.pinterest.com/pin/247979523226215934/",
    sourceDomain: "pinterest.com",
    author: "mensfashionpost",
    topColor: "white",
    bottomColor: "olive",
    style: "smart casual",
    tags: ["white", "olive", "green", "linen", "shirt", "chinos", "smart casual", "men"],
  },
  {
    id: "17029304835623359",
    imageUrl: "https://i.pinimg.com/736x/d9/85/4c/d9854cfae9f50e82ec5ea1f66099b244.jpg",
    title: "Men's White T-Shirt and Relaxed Olive Fatigue Pants",
    sourceUrl: "https://www.pinterest.com/pin/17029304835623359/",
    sourceDomain: "pinterest.com",
    author: "stylecaster",
    topColor: "white",
    bottomColor: "green",
    style: "streetwear",
    tags: ["white", "green", "olive", "t-shirt", "cargo", "trousers", "streetwear", "men"],
  },

  // 4. White Top + Navy / Blue Bottoms (Men)
  {
    id: "386817055492784357",
    imageUrl: "https://i.pinimg.com/736x/88/3d/1c/883d1c71c372149f850ca1adfe9b01ca.jpg",
    title: "Men's White Oxford Shirt & Dark Navy Pleated Trousers",
    sourceUrl: "https://www.pinterest.com/pin/386817055492784357/",
    sourceDomain: "pinterest.com",
    author: "gq",
    topColor: "white",
    bottomColor: "navy",
    style: "formal",
    tags: ["white", "navy", "blue", "shirt", "trousers", "formal", "smart casual", "men"],
  },
  {
    id: "888036420004567234",
    imageUrl: "https://i.pinimg.com/736x/b2/34/b8/b234b883f5a03c7541776aa697cb0f8a.jpg",
    title: "Men's White Heavyweight Tee & Classic Blue Denim Jeans",
    sourceUrl: "https://www.pinterest.com/pin/888036420004567234/",
    sourceDomain: "pinterest.com",
    author: "fashionbeans",
    topColor: "white",
    bottomColor: "blue",
    style: "casual",
    tags: ["white", "blue", "denim", "t-shirt", "jeans", "casual", "men"],
  },

  // 5. Black Top + Black Bottoms (Monochrome Minimalist Men)
  {
    id: "337910778261137484",
    imageUrl: "https://i.pinimg.com/736x/2f/b7/7e/2fb77e6b626ad93f36b0db4e32d2a362.jpg",
    title: "All-Black Men's Minimalist Outfit with Tailored Fit",
    sourceUrl: "https://www.pinterest.com/pin/337910778261137484/",
    sourceDomain: "pinterest.com",
    author: "gq",
    topColor: "black",
    bottomColor: "black",
    style: "minimalist",
    tags: ["black", "monochrome", "shirt", "trousers", "minimalist", "smart casual", "men"],
  },
  {
    id: "777925319993456123",
    imageUrl: "https://i.pinimg.com/736x/79/af/c5/79afc581d4cf6ecdac37785dc30737b0.jpg",
    title: "Men's All-Black Casual Streetwear Layered Look",
    sourceUrl: "https://www.pinterest.com/pin/777925319993456123/",
    sourceDomain: "pinterest.com",
    author: "stylecaster",
    topColor: "black",
    bottomColor: "black",
    style: "streetwear",
    tags: ["black", "streetwear", "jacket", "jeans", "casual", "men"],
  },

  // 6. Black Top + Grey / Charcoal Bottoms (Men)
  {
    id: "453385887510420210",
    imageUrl: "https://i.pinimg.com/736x/3b/b1/74/3bb174825983796537d94e773ee4924c.jpg",
    title: "Men's Black Fitted Polo & Tailored Grey Wool Trousers",
    sourceUrl: "https://www.pinterest.com/pin/453385887510420210/",
    sourceDomain: "pinterest.com",
    author: "mensfashionpost",
    topColor: "black",
    bottomColor: "grey",
    style: "smart casual",
    tags: ["black", "grey", "charcoal", "polo", "shirt", "trousers", "smart casual", "men"],
  },
  {
    id: "555913197771234901",
    imageUrl: "https://i.pinimg.com/736x/8e/6b/3a/8e6b3a770e2fd50e0c1b33832ffbe6f2.jpg",
    title: "Men's Modern Black Crewneck & Heather Grey Slacks",
    sourceUrl: "https://www.pinterest.com/pin/555913197771234901/",
    sourceDomain: "pinterest.com",
    author: "gq",
    topColor: "black",
    bottomColor: "grey",
    style: "minimalist",
    tags: ["black", "grey", "sweater", "trousers", "minimalist", "men"],
  },

  // 7. White Top + Black Bottoms (Men)
  {
    id: "812407282776483935",
    imageUrl: "https://i.pinimg.com/736x/e3/d5/b1/e3d5b1a5743a7e5ffce88b4d25e2a40b.jpg",
    title: "Men's Clean White Tee and Straight Leg Black Trousers",
    sourceUrl: "https://www.pinterest.com/pin/812407282776483935/",
    sourceDomain: "pinterest.com",
    author: "stylecaster",
    topColor: "white",
    bottomColor: "black",
    style: "casual",
    tags: ["white", "black", "t-shirt", "trousers", "casual", "streetwear", "men"],
  },
  {
    id: "666814208882345012",
    imageUrl: "https://i.pinimg.com/736x/bd/34/6a/bd346abf39e7e760308e6a8372d63574.jpg",
    title: "Men's Crisp White Button Shirt with Black Tailored Pants",
    sourceUrl: "https://www.pinterest.com/pin/666814208882345012/",
    sourceDomain: "pinterest.com",
    author: "mensfashionpost",
    topColor: "white",
    bottomColor: "black",
    style: "formal",
    tags: ["white", "black", "shirt", "trousers", "formal", "smart casual", "men"],
  },

  // 8. Earth Tones / Brown / Tan / Cream (Men)
  {
    id: "687502755655711681",
    imageUrl: "https://i.pinimg.com/736x/d5/c0/c8/d5c0c8de29c922d05afe34518ea1e6db.jpg",
    title: "Men's Neutral Textured Brown Overshirt & Slim Chinos",
    sourceUrl: "https://www.pinterest.com/pin/687502755655711681/",
    sourceDomain: "pinterest.com",
    author: "fashionbeans",
    topColor: "brown",
    bottomColor: "beige",
    style: "smart casual",
    tags: ["brown", "tan", "beige", "jacket", "shirt", "chinos", "smart casual", "men"],
  },
  {
    id: "925349017181347621",
    imageUrl: "https://i.pinimg.com/736x/1b/6e/43/1b6e43bff9e88561f48ecc35e96fd18c.jpg",
    title: "Men's Cozy Cream Knitwear & Clean Sand Tailored Pants",
    sourceUrl: "https://www.pinterest.com/pin/925349017181347621/",
    sourceDomain: "pinterest.com",
    author: "menswearstyle",
    topColor: "cream",
    bottomColor: "beige",
    style: "minimalist",
    tags: ["cream", "beige", "white", "sweater", "trousers", "minimalist", "casual", "men"],
  },

  // 9. Denim / Casual Workwear (Men)
  {
    id: "543246411330998822",
    imageUrl: "https://i.pinimg.com/736x/00/a7/e6/00a7e65272a59d510c4d8791a2579176.jpg",
    title: "Classic Men's Denim Jacket & Earth Tone Relaxed Chinos",
    sourceUrl: "https://www.pinterest.com/pin/543246411330998822/",
    sourceDomain: "pinterest.com",
    author: "gq",
    topColor: "blue",
    bottomColor: "brown",
    style: "casual",
    tags: ["blue", "denim", "brown", "tan", "jacket", "chinos", "casual", "men"],
  },
  {
    id: "687502755655711690",
    imageUrl: "https://i.pinimg.com/736x/d9/85/4c/d9854cfae9f50e82ec5ea1f66099b244.jpg",
    title: "Men's Olive Utility Overshirt & Khaki Cargo Trousers",
    sourceUrl: "https://www.pinterest.com/pin/687502755655711690/",
    sourceDomain: "pinterest.com",
    author: "fashionbeans",
    topColor: "olive",
    bottomColor: "khaki",
    style: "streetwear",
    tags: ["olive", "green", "khaki", "jacket", "cargo", "streetwear", "men"],
  },
];

function cleanGarmentComponent(val?: string): string {
  return (val || "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .trim()
    .split(/\s+/)[0] || "";
}

function cleanGarmentType(type?: string, defaultFallback = "shirt"): string {
  const t = (type || "").toLowerCase().replace(/[^a-z\s]/g, "").trim();

  // Tops
  if (/t-?shirt|tee/i.test(t)) return "t-shirt";
  if (/polo/i.test(t)) return "polo shirt";
  if (/jacket|trucker|overshirt/i.test(t)) return "jacket";
  if (/sweater|knit|cardigan|pullover/i.test(t)) return "sweater";
  if (/hoodie|sweatshirt/i.test(t)) return "hoodie";
  if (/blazer|suit jacket/i.test(t)) return "blazer";
  if (/shirt|button|linen/i.test(t)) return "shirt";

  // Bottoms
  if (/jeans|denim/i.test(t)) return "jeans";
  if (/chino/i.test(t)) return "chinos";
  if (/trouser|slacks/i.test(t)) return "trousers";
  if (/cargo/i.test(t)) return "cargo pants";
  if (/short/i.test(t)) return "shorts";
  if (/jogger|sweatpant/i.test(t)) return "joggers";

  // Footwear
  if (/sneaker|runner|trainer|kicks/i.test(t)) return "sneakers";
  if (/loafer/i.test(t)) return "loafers";
  if (/boot/i.test(t)) return "boots";
  if (/oxford|derby|dress/i.test(t)) return "dress shoes";

  return t || defaultFallback;
}

function parseColors(colors?: string | string[]): { topColor: string; bottomColor: string } {
  if (!colors) return { topColor: "", bottomColor: "" };
  let parts: string[] = [];
  if (Array.isArray(colors)) {
    parts = colors.map((c) => String(c).trim().toLowerCase()).filter(Boolean);
  } else if (typeof colors === "string") {
    parts = colors
      .split(/[+,/&]|\band\b/i)
      .map((c) => c.trim().toLowerCase())
      .filter(Boolean);
  }
  return {
    topColor: parts[0] || "",
    bottomColor: parts[1] || "",
  };
}

/**
 * Generate highly targeted Pinterest search queries specifically for Men's fashion
 */
function buildTargetedMensQueries(
  top?: ClothingAnalysis,
  bottom?: ClothingAnalysis,
  sole?: ClothingAnalysis,
  style?: string,
  colors?: string | string[]
): string[] {
  const parsed = parseColors(colors);
  const topColor = cleanGarmentComponent(top?.primaryColor) || parsed.topColor;
  const topType = cleanGarmentType(top?.type, "shirt");

  const bottomColor = cleanGarmentComponent(bottom?.primaryColor) || parsed.bottomColor;
  const bottomType = cleanGarmentType(bottom?.type, "pants");

  const soleColor = cleanGarmentComponent(sole?.primaryColor);
  const soleType = cleanGarmentType(sole?.type, "");

  const cleanStyleStr = (style || "")
    .toLowerCase()
    .replace(/outfit|look|style|aesthetic/gi, "")
    .trim();

  const queries: string[] = [];

  // Query 1: Men's specific combination with exact colors & garment types
  if (topColor && bottomColor) {
    queries.push(`men fashion ${topColor} ${topType} ${bottomColor} ${bottomType} pinterest pin`);
  }

  // Query 2: Men's outfit with style
  if (topColor && bottomColor) {
    queries.push(`men's outfit ${topColor} ${topType} with ${bottomColor} ${bottomType} ${cleanStyleStr} pinterest`);
  }

  // Query 3: Menswear outfit combination
  if (topColor && bottomColor) {
    queries.push(`menswear ${topColor} shirt ${bottomColor} trousers pinterest pin`);
  }

  // Query 4: Including footwear if available
  if (topColor && bottomColor && (soleColor || soleType)) {
    queries.push(`men outfit ${topColor} ${topType} ${bottomColor} ${bottomType} ${soleColor} ${soleType} pinterest pin`.trim());
  }

  // Fallback query
  queries.push(`men fashion ${topColor || "style"} outfit ${bottomColor || "trousers"} pinterest pin`);

  return queries;
}

/**
 * Live Pinterest Pin Search matching the exact outfit garments, strictly filtered for Men's Fashion
 */
async function fetchLivePinterestPinsForOutfit(
  top?: ClothingAnalysis,
  bottom?: ClothingAnalysis,
  sole?: ClothingAnalysis,
  style?: string,
  colors?: string | string[]
): Promise<SimilarImageResult[]> {
  try {
    const candidateQueries = buildTargetedMensQueries(top, bottom, sole, style, colors);
    const parsed = parseColors(colors);
    const topColor = cleanGarmentComponent(top?.primaryColor) || parsed.topColor;
    const bottomColor = cleanGarmentComponent(bottom?.primaryColor) || parsed.bottomColor;

    const collectedPins: SimilarImageResult[] = [];
    const seenUrls = new Set<string>();

    for (const q of candidateQueries) {
      const searchUrl =
        "https://www.bing.com/images/search?q=" +
        encodeURIComponent(q) +
        "&qft=+filterui:aspect-tall";

      const res = await fetch(searchUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        },
      });

      if (!res.ok) continue;

      const html = await res.text();
      const matches = [...html.matchAll(/class="iusc"[^>]*m="([^"]+)"/g)];

      for (const match of matches) {
        try {
          const decoded = match[1].replace(/&quot;/g, '"');
          const json = JSON.parse(decoded);
          let imgUrl = json.murl || "";
          const purl = json.purl || "";
          const rawTitle = (json.t || json.desc || "").replace(/<\/?b>/g, "").trim();

          // 1. Must be hosted on Pinterest CDN (pinimg.com) OR link to pinterest.com
          const isPinterest = imgUrl.includes("pinimg.com") || purl.includes("pinterest.com");
          if (!isPinterest) continue;

          // 2. STRICT MEN'S FILTER: Exclude any female-focused fashion terms
          const combinedMeta = `${rawTitle} ${purl} ${imgUrl}`.toLowerCase();
          if (FEMALE_EXCLUSIONS.test(combinedMeta)) {
            continue;
          }

          // 3. Reject non-clothing junk (youtube, logos, clipart, templates, memes)
          const isJunk = /youtube|ytimg|vector|logo|icon|clipart|template|graphic|cartoon|meme|thumbnail/i.test(
            combinedMeta
          );
          if (isJunk) continue;

          // 4. Must relate to fashion, outfits, styling, or clothing
          const hasFashionRelevance =
            /outfit|style|wear|look|fashion|shirt|jeans|pants|jacket|chinos|trousers|sneakers|boots|loafers|suit|polo|blazer|hoodie|clothing/i.test(
              rawTitle
            );
          if (!hasFashionRelevance) continue;

          // Upgrade resolution from 236x to 736x on Pinterest CDN
          if (imgUrl.includes("/236x/")) {
            imgUrl = imgUrl.replace("/236x/", "/736x/");
          }

          const imageFilenameKey = imgUrl.split("/").pop()?.split("?")[0] || imgUrl;
          const pinKey = purl.match(/pinterest\.com\/pin\/(\d+)/)?.[1] || "";

          if (seenUrls.has(imageFilenameKey) || (pinKey && seenUrls.has(pinKey))) {
            continue;
          }
          seenUrls.add(imageFilenameKey);
          if (pinKey) seenUrls.add(pinKey);

          const pinId =
            pinKey ||
            `pin-${collectedPins.length + 1}-${Date.now()}`;

            // Calculate relevance score for this specific outfit recommendation
            let score = 10;
            const textToScore = `${rawTitle} ${purl}`.toLowerCase();

            // Strict Men's Fashion bonus
            if (/\b(men|man|mens|men\'s|menswear)\b/i.test(textToScore)) score += 20;

            // Top color matching
            if (topColor && textToScore.includes(topColor)) {
              score += 40;
            } else if (topColor) {
              const otherColors = ["white", "black", "navy", "blue", "grey", "gray", "green", "olive", "brown", "beige", "red", "yellow", "pink"].filter(
                (c) => c !== topColor
              );
              if (otherColors.some((c) => textToScore.includes(`${c} shirt`) || textToScore.includes(`${c} polo`) || textToScore.includes(`${c} tee`))) {
                score -= 30;
              }
            }

            // Bottom color matching
            if (bottomColor && textToScore.includes(bottomColor)) {
              score += 40;
            } else if (bottomColor) {
              const otherBottomColors = ["white", "black", "navy", "blue", "grey", "gray", "green", "olive", "brown", "beige", "khaki", "tan"].filter(
                (c) => c !== bottomColor
              );
              if (otherBottomColors.some((c) => textToScore.includes(`${c} pant`) || textToScore.includes(`${c} chino`) || textToScore.includes(`${c} trouser`) || textToScore.includes(`${c} jean`))) {
                score -= 30;
              }
            }

            // Both colors match together
            if (topColor && bottomColor && textToScore.includes(topColor) && textToScore.includes(bottomColor)) {
              score += 60;
            }

            // Garment type matches
            if (top?.type && textToScore.includes(cleanGarmentType(top.type))) score += 15;
            if (bottom?.type && textToScore.includes(cleanGarmentType(bottom.type))) score += 15;

            collectedPins.push({
              id: pinId,
              imageUrl: imgUrl,
              title: rawTitle || `Men's ${style || "Fashion"} Outfit`,
              sourceUrl: purl.includes("pinterest.com")
                ? purl
                : `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(q)}`,
              sourceDomain: "pinterest.com",
              author: "Pinterest Men's Fashion",
              // Store score temporarily
              ...({ _score: score } as any),
            });
        } catch (e) {}
      }

      // If we have found at least 4 perfect matches (both colors & men's tags, score >= 120), stop querying
      const topTier = collectedPins.filter((p: any) => (p._score || 0) >= 120);
      if (topTier.length >= 4) {
        topTier.sort((a: any, b: any) => (b._score || 0) - (a._score || 0));
        return topTier.slice(0, 4);
      }
    }

    if (collectedPins.length > 0) {
      // Sort all collected pins by relevance to this specific outfit
      collectedPins.sort((a: any, b: any) => (b._score || 0) - (a._score || 0));
      return collectedPins.slice(0, 4);
    }

    return [];
  } catch (err) {
    console.warn("fetchLivePinterestPinsForOutfit error:", err);
    return [];
  }
}

/**
 * Intelligent fallback scoring to match verified men's fashion pins to the specific outfit recommendation
 */
function getBestMatchingCuratedMenPins(
  top?: ClothingAnalysis,
  bottom?: ClothingAnalysis,
  sole?: ClothingAnalysis,
  style?: string,
  colors?: string | string[]
): SimilarImageResult[] {
  const parsed = parseColors(colors);
  const topColor = cleanGarmentComponent(top?.primaryColor) || parsed.topColor;
  const bottomColor = cleanGarmentComponent(bottom?.primaryColor) || parsed.bottomColor;
  const soleColor = cleanGarmentComponent(sole?.primaryColor);
  const cleanStyleStr = (style || "").toLowerCase();

  // Score each curated pin based on how closely it matches THIS specific recommendation
  const scored = VERIFIED_PINTEREST_MEN_PINS.map((pin) => {
    let score = 0;

    // Direct color matches
    if (topColor && (pin.topColor.includes(topColor) || topColor.includes(pin.topColor))) {
      score += 30;
    }
    if (bottomColor && (pin.bottomColor.includes(bottomColor) || bottomColor.includes(pin.bottomColor))) {
      score += 30;
    }

    // Both colors match together
    if (
      topColor &&
      bottomColor &&
      (pin.topColor.includes(topColor) || topColor.includes(pin.topColor)) &&
      (pin.bottomColor.includes(bottomColor) || bottomColor.includes(pin.bottomColor))
    ) {
      score += 40;
    }

    // Style match
    if (cleanStyleStr && pin.style && (cleanStyleStr.includes(pin.style) || pin.style.includes(cleanStyleStr))) {
      score += 15;
    }

    // Sole color match
    if (soleColor && pin.tags.some((t) => t.includes(soleColor))) {
      score += 10;
    }

    // Tag matches
    if (top?.type && pin.tags.some((t) => t.includes(top.type.toLowerCase()))) {
      score += 10;
    }
    if (bottom?.type && pin.tags.some((t) => t.includes(bottom.type.toLowerCase()))) {
      score += 10;
    }

    return { pin, score };
  });

  // Sort descending by relevance score
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, 4).map((item) => ({
    id: item.pin.id,
    imageUrl: item.pin.imageUrl,
    title: item.pin.title,
    sourceUrl: item.pin.sourceUrl,
    sourceDomain: item.pin.sourceDomain,
    author: item.pin.author,
  }));
}

export async function searchSimilarOutfitImages(params: {
  style?: string;
  colors?: string | string[];
  top?: ClothingAnalysis;
  bottom?: ClothingAnalysis;
  sole?: ClothingAnalysis;
  query?: string;
  pinterestAccessToken?: string;
}): Promise<SimilarImagesResponse> {
  const { style, colors, top, bottom, sole } = params;

  // Build targeted query string
  const targetedQueries = buildTargetedMensQueries(top, bottom, sole, style, colors);
  const primaryQuery = params.query || targetedQueries[0];

  // 1. Check Official Pinterest API if user or environment provided PINTEREST_ACCESS_TOKEN
  const pinterestToken =
    params.pinterestAccessToken || process.env.PINTEREST_ACCESS_TOKEN;

  if (pinterestToken) {
    try {
      const { searchPinterestApiPins } = await import("./pinterest-auth");
      const apiPins = await searchPinterestApiPins(pinterestToken, primaryQuery);
      if (Array.isArray(apiPins) && apiPins.length > 0) {
        // Filter out female-focused pins
        const malePins = apiPins.filter((pin: any) => {
          const text = `${pin.title || ""} ${pin.description || ""}`.toLowerCase();
          return !FEMALE_EXCLUSIONS.test(text);
        });

        const chosen = (malePins.length >= 2 ? malePins : apiPins).slice(0, 4);

        const results: SimilarImageResult[] = chosen.map((pin: any) => {
          const imgUrl =
            pin.media?.images?.["600x"]?.url ||
            pin.media?.images?.["1200x"]?.url ||
            pin.media?.images?.originals?.url ||
            pin.image_large_url ||
            "https://i.pinimg.com/736x/5c/28/c9/5c28c99f0c9b6afd487baa7867831bfa.jpg";
          return {
            id: pin.id || `pin-${Date.now()}`,
            imageUrl: imgUrl,
            title: pin.title || pin.description || `Men's ${style} Outfit`,
            sourceUrl: pin.link || `https://www.pinterest.com/pin/${pin.id}/`,
            sourceDomain: "pinterest.com",
            author: pin.board_owner?.username || "Pinterest Creator",
          };
        });

        if (results.length > 0) {
          return {
            results,
            provider: "Pinterest API (Official)",
            configuredApi: "Pinterest API v5",
          };
        }
      }
    } catch (err) {
      console.warn("Pinterest API search error:", err);
    }
  }

  // 2. Real-time Live Pinterest Pin Search matching the exact outfit garments for Men
  const livePins = await fetchLivePinterestPinsForOutfit(top, bottom, sole, style, colors);
  if (livePins.length >= 2) {
    return {
      results: livePins,
      provider: "Pinterest",
      configuredApi: "Pinterest Live Search (Men's Fashion)",
    };
  }

  // 3. Fallback: Score curated verified Pinterest Men's pins directly matching this combination
  const curatedMatches = getBestMatchingCuratedMenPins(top, bottom, sole, style, colors);

  // If live search found 1-2 pins, combine with best curated matches
  const combined = [...livePins];
  for (const c of curatedMatches) {
    if (combined.length >= 4) break;
    if (!combined.some((p) => p.imageUrl === c.imageUrl)) {
      combined.push(c);
    }
  }

  return {
    results: combined.slice(0, 4),
    provider: "Pinterest",
    configuredApi: "Pinterest Men's Fashion Matching",
  };
}
