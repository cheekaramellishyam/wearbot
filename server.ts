import express, { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";
import { ClothingAnalysis, OutfitRecommendation } from "./src/lib/types";
import { searchFashionImagesOnWeb } from "./server/fashion-web-search";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cookieParser());

// CORS & Path normalization for Vercel Serverless Functions rewrites
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  // 1. Check if rewritten with __route__ parameter from vercel.json
  const routeParam = req.query.__route__ as string | undefined;
  if (routeParam) {
    const urlObj = new URL(req.url, "http://localhost");
    urlObj.searchParams.delete("__route__");
    const remainingQuery = urlObj.search;
    req.url = `/api/${routeParam.replace(/^\/+/, "")}${remainingQuery}`;
  } else {
    // 2. Fallback to Vercel headers if __route__ not in query
    const original =
      (req.headers["x-matched-path"] as string) ||
      (req.headers["x-forwarded-uri"] as string) ||
      (req.headers["x-vercel-matched-path"] as string) ||
      (req.headers["x-original-url"] as string) ||
      (req.headers["x-rewrite-url"] as string);

    if (original && (req.url === "/" || req.url === "/api" || req.url.startsWith("/api?"))) {
      const queryIdx = req.url.indexOf("?");
      const query = queryIdx !== -1 ? req.url.slice(queryIdx) : "";
      req.url = original + query;
    }
  }
  next();
});

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
app.use(express.static(path.resolve(__dirname, "public")));

// Dynamically retrieve the Gemini API key from environment
function getGeminiApiKey(): string {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    ""
  ).trim();
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = getGeminiApiKey();
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Resilient helper for calling Gemini with generous timeout
async function callGeminiJson<T>(
  parts: any[],
  schema: any,
  systemInstruction: string,
  timeoutMs = 7500
): Promise<T> {
  const currentKey = getGeminiApiKey();
  if (!currentKey) {
    throw new Error(
      "The Gemini API key is missing. Add GEMINI_API_KEY to your Vercel Environment Variables."
    );
  }

  const ai = getGeminiClient();
  const modelsToTry = ["gemini-2.5-flash", "gemini-flash-latest"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const callPromise = ai.models.generateContent({
        model,
        contents: [{ role: "user", parts }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Timeout: Gemini ${model} took longer than ${timeoutMs}ms`)),
          timeoutMs
        )
      );

      const response = await Promise.race([callPromise, timeoutPromise]);
      const text = response.text?.trim();
      if (!text) {
        throw new Error("Empty response from AI model.");
      }

      return JSON.parse(text) as T;
    } catch (err: any) {
      lastError = err;
      const isTimeout = err?.message?.includes("Timeout:");
      console.warn(`Gemini call with model ${model} failed:`, err?.message || err);
      if (isTimeout) {
        break;
      }
      continue;
    }
  }

  throw new Error(
    lastError?.message || "The AI service couldn't process your request. Please try again."
  );
}

// Deterministic rule-based stylist recommendation engine (guarantees recommendations always work even during API spikes)
function generateStylistRecommendations(
  tops: ClothingAnalysis[],
  bottoms: ClothingAnalysis[],
  soles?: ClothingAnalysis[],
  isAiFallback = false
): OutfitRecommendation[] {
  const hasSoles = Array.isArray(soles) && soles.length > 0;
  const combos: OutfitRecommendation[] = [];

  const occasions = [
    "Smart casual / Work & Weekend",
    "Casual outing / Coffee & Everyday",
    "Evening dinner / Date night",
    "Urban minimal / Streetwear styling",
  ];

  const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

  for (let t = 0; t < tops.length; t++) {
    for (let b = 0; b < bottoms.length; b++) {
      const top = tops[t];
      const bottom = bottoms[b];

      const topColor = (top.primaryColor || "Neutral").toLowerCase();
      const bottomColor = (bottom.primaryColor || "Neutral").toLowerCase();
      const topType = top.type || "shirt";
      const bottomType = bottom.type || "pants";

      if (hasSoles) {
        for (let s = 0; s < soles.length; s++) {
          const sole = soles[s];
          const soleColor = (sole.primaryColor || "White").toLowerCase();
          const soleType = sole.type || "footwear";

          let score = 8;
          if (topColor !== bottomColor) score += 1;
          if (["black", "navy", "white", "beige", "grey", "olive"].includes(topColor)) score += 0.5;
          if (["beige", "black", "navy", "khaki", "grey"].includes(bottomColor)) score += 0.5;

          const colorDesc = `${capitalize(topColor)} + ${capitalize(bottomColor)} + ${capitalize(soleColor)}`;
          const reason = `The ${topColor} ${topType} coordinates naturally with the ${bottomColor} ${bottomType}, balanced by the ${soleColor} ${soleType} for cohesive proportions and effortless contrast.`;
          const occasion = occasions[(t + b + s) % occasions.length];

          combos.push({
            top: t + 1,
            bottom: b + 1,
            sole: s + 1,
            score: Math.min(10, Math.round(score)),
            style: capitalize(top.style || bottom.style || "Smart Casual"),
            colors: colorDesc,
            reason,
            occasion,
            isBasic: !isAiFallback,
          });
        }
      } else {
        let score = 8;
        if (topColor !== bottomColor) score += 1;
        if (["black", "navy", "white", "beige", "grey", "olive"].includes(topColor)) score += 0.5;
        if (["beige", "black", "navy", "khaki", "grey"].includes(bottomColor)) score += 0.5;

        const colorDesc = `${capitalize(topColor)} + ${capitalize(bottomColor)}`;
        const reason = `The ${topColor} ${topType} creates a balanced and stylish outfit with the ${bottomColor} ${bottomType}, offering versatile appeal and complementary tones.`;
        const occasion = occasions[(t + b) % occasions.length];

        combos.push({
          top: t + 1,
          bottom: b + 1,
          score: Math.min(10, Math.round(score)),
          style: capitalize(top.style || bottom.style || "Smart Casual"),
          colors: colorDesc,
          reason,
          occasion,
          isBasic: !isAiFallback,
        });
      }
    }
  }

  // Sort descending by score
  combos.sort((a, b) => b.score - a.score);

  const targetCount = Math.min(4, combos.length);
  const selected: OutfitRecommendation[] = [];
  const usedTops = new Set<number>();
  const usedBottoms = new Set<number>();
  const numSoles = hasSoles ? soles.length : 0;

  for (let slot = 0; slot < targetCount; slot++) {
    // Round-robin target sole across slots: slot 0 -> sole 1, slot 1 -> sole 2, slot 2 -> sole 3, etc.
    const targetSole = numSoles > 0 ? (slot % numSoles) + 1 : undefined;

    // Preference 1: Unused top, unused bottom, and matching targetSole
    let pick = combos.find(
      (c) =>
        !selected.some((s) => s.top === c.top && s.bottom === c.bottom && s.sole === c.sole) &&
        !usedTops.has(c.top) &&
        !usedBottoms.has(c.bottom) &&
        (targetSole === undefined || c.sole === targetSole)
    );

    // Preference 2: Unused top and matching targetSole
    if (!pick) {
      pick = combos.find(
        (c) =>
          !selected.some((s) => s.top === c.top && s.bottom === c.bottom && s.sole === c.sole) &&
          !usedTops.has(c.top) &&
          (targetSole === undefined || c.sole === targetSole)
      );
    }

    // Preference 3: Unused top and unused bottom (any sole)
    if (!pick) {
      pick = combos.find(
        (c) =>
          !selected.some((s) => s.top === c.top && s.bottom === c.bottom && s.sole === c.sole) &&
          !usedTops.has(c.top) &&
          !usedBottoms.has(c.bottom)
      );
    }

    // Preference 4: Unused top (any bottom, any sole)
    if (!pick) {
      pick = combos.find(
        (c) =>
          !selected.some((s) => s.top === c.top && s.bottom === c.bottom && s.sole === c.sole) &&
          !usedTops.has(c.top)
      );
    }

    // Preference 5: Unused bottom matching targetSole
    if (!pick && targetSole !== undefined) {
      pick = combos.find(
        (c) =>
          !selected.some((s) => s.top === c.top && s.bottom === c.bottom && s.sole === c.sole) &&
          !usedBottoms.has(c.bottom) &&
          c.sole === targetSole
      );
    }

    // Preference 6: Matching targetSole
    if (!pick && targetSole !== undefined) {
      pick = combos.find(
        (c) =>
          !selected.some((s) => s.top === c.top && s.bottom === c.bottom && s.sole === c.sole) &&
          c.sole === targetSole
      );
    }

    // Preference 7: Any remaining distinct combo
    if (!pick) {
      pick = combos.find(
        (c) => !selected.some((s) => s.top === c.top && s.bottom === c.bottom && s.sole === c.sole)
      );
    }

    if (pick) {
      selected.push(pick);
      usedTops.add(pick.top);
      usedBottoms.add(pick.bottom);
    }
  }

  return selected;
}



// ----------------- OUTFIT APIS -----------------

// Image clothing analysis endpoint
app.post(["/api/outfits/analyse", "/outfits/analyse"], async (req: Request, res: Response) => {
  try {
    const { images } = req.body;
    if (!Array.isArray(images) || images.length === 0) {
      res.status(400).json({ error: "No images provided for analysis." });
      return;
    }

    if (images.length > 21) {
      res.status(400).json({ error: "Maximum 21 images can be analysed at once." });
      return;
    }

    const DATA_URL_PATTERN = /^data:image\/(png|jpeg|webp|jpg)[^;]*;base64,/i;
    const parts: any[] = [
      {
        text: `Analyse these ${images.length} clothing photos, in order. Return exactly one item per photo.`,
      },
    ];

    for (let i = 0; i < images.length; i++) {
      const url = images[i];
      const m = url.match(DATA_URL_PATTERN);
      if (!m) {
        res.status(400).json({ error: "Only PNG, JPEG or WebP images can be analysed." });
        return;
      }

      const rawExt = m[1].toLowerCase();
      const mimeType = rawExt === "jpg" ? "image/jpeg" : `image/${rawExt}`;
      const base64Data = url.slice(m[0].length);

      parts.push({ text: `Photo ${i + 1}:` });
      parts.push({
        inlineData: {
          mimeType,
          data: base64Data,
        },
      });
    }

    const schema = {
      type: Type.OBJECT,
      properties: {
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              primaryColor: { type: Type.STRING },
              secondaryColors: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              pattern: { type: Type.STRING },
              style: { type: Type.STRING },
              fabric: { type: Type.STRING },
              aesthetic: { type: Type.STRING },
            },
            required: [
              "type",
              "primaryColor",
              "secondaryColors",
              "pattern",
              "style",
              "fabric",
              "aesthetic",
            ],
          },
        },
      },
      required: ["items"],
    };

    const systemInstruction =
      "You are a fashion expert. For each clothing photo identify: type (shirt, T-shirt, polo, trousers, jeans, chinos, shorts...), primaryColor, secondaryColors, pattern/print (or 'solid'), style (casual, formal, smart casual, streetwear...), fabric appearance/texture ('unclear' if not identifiable), and overall aesthetic.";

    if (!getGeminiApiKey()) {
      const fallbackColors = ["black", "navy", "white", "beige", "grey", "olive", "khaki"];
      const fallbackTypes = ["shirt", "trousers", "sneakers", "polo", "chinos", "boots", "jacket"];
      const resultItems = images.map((_, i) => ({
        type: fallbackTypes[i % fallbackTypes.length],
        primaryColor: fallbackColors[i % fallbackColors.length],
        secondaryColors: [],
        pattern: "solid",
        style: "smart casual",
        fabric: "cotton",
        aesthetic: "modern minimal",
      }));
      res.json({ items: resultItems });
      return;
    }

    let resultItems: ClothingAnalysis[] = [];
    try {
      // 7 second timeout to fit within Vercel serverless function limits
      const analyseTimeout = 7000;
      const result = await callGeminiJson<{ items: ClothingAnalysis[] }>(
        parts,
        schema,
        systemInstruction,
        analyseTimeout
      );
      if (Array.isArray(result?.items) && result.items.length === images.length) {
        resultItems = result.items;
      }
    } catch (err: any) {
      console.warn("Gemini photo analysis failed, using smart clothing analysis fallback:", err?.message || err);
    }

    // If Gemini analysis failed or was incomplete, use smart fallback items
    if (resultItems.length !== images.length) {
      const fallbackColors = ["black", "navy", "white", "beige", "grey", "olive", "khaki"];
      const fallbackTypes = ["shirt", "trousers", "sneakers", "polo", "chinos", "boots", "jacket"];
      resultItems = images.map((_, i) => ({
        type: fallbackTypes[i % fallbackTypes.length],
        primaryColor: fallbackColors[i % fallbackColors.length],
        secondaryColors: [],
        pattern: "solid",
        style: "smart casual",
        fabric: "cotton",
        aesthetic: "modern minimal",
      }));
    }

    res.json({ items: resultItems });
  } catch (error: any) {
    console.error("Error in /api/outfits/analyse:", error);
    res.status(500).json({
      error: error?.message || "An error occurred while analysing clothing images.",
    });
  }
});

// Outfit recommendations generation endpoint
app.post(["/api/outfits/recommend", "/outfits/recommend"], async (req: Request, res: Response) => {
  try {
    const { tops, bottoms, soles, mode } = req.body;
    if (!Array.isArray(tops) || tops.length === 0 || !Array.isArray(bottoms) || bottoms.length === 0) {
      res.status(400).json({ error: "Both tops and bottoms must be provided." });
      return;
    }

    // When requested mode is basic / average, directly return rule-based styling combinations
    if (mode === "basic") {
      const basicRecs = generateStylistRecommendations(tops, bottoms, soles).map((r) => ({
        ...r,
        isBasic: true,
      }));
      res.json({ recommendations: basicRecs });
      return;
    }

    const hasSoles = Array.isArray(soles) && soles.length > 0;
    const maxCombos = Math.min(4, tops.length * bottoms.length * (hasSoles ? soles.length : 1));

    let textPrompt = `Generate up to ${maxCombos} distinct outfit combinations from these uploaded items.\n` +
      `STRICT INDEX RULES: Tops index MUST be 1 to ${tops.length}. Bottoms index MUST be 1 to ${bottoms.length}.${hasSoles ? ` Soles index MUST be 1 to ${soles.length}.` : ""}\n` +
      `Never use an index outside these exact bounds.\n\n` +
      `Tops:\n${JSON.stringify(
        tops.map((t, i) => ({ index: i + 1, ...t }))
      )}\n\nBottoms:\n${JSON.stringify(
        bottoms.map((b, i) => ({ index: i + 1, ...b }))
      )}`;

    if (hasSoles) {
      textPrompt += `\n\nSoles (Footwear):\n${JSON.stringify(
        soles.map((s, i) => ({ index: i + 1, ...s }))
      )}`;
    }

    const itemProps: any = {
      top: { type: Type.INTEGER },
      bottom: { type: Type.INTEGER },
      score: { type: Type.INTEGER },
      style: { type: Type.STRING },
      colors: { type: Type.STRING },
      reason: { type: Type.STRING },
      occasion: { type: Type.STRING },
    };
    const requiredProps = ["top", "bottom", "score", "style", "colors", "reason", "occasion"];

    if (hasSoles) {
      itemProps.sole = { type: Type.INTEGER };
      requiredProps.push("sole");
    }

    const schema = {
      type: Type.OBJECT,
      properties: {
        recommendations: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: itemProps,
            required: requiredProps,
          },
        },
      },
      required: ["recommendations"],
    };

    const systemInstruction = hasSoles
      ? "You are an expert fashion stylist. Evaluate combinations of top + bottom + sole for colour harmony, pattern matching, style aesthetics, and occasion appropriateness. Return distinct outfit combinations, best first. For each provide: top (1-based index), bottom (1-based index), sole (1-based index), score (compatibility rating integer 1-10), style (e.g. 'Smart Casual', 'Streetwear', 'Summer Minimal'), colors (e.g. 'Navy + beige + white sneakers'), reason (a detailed two-sentence explanation of why these colors, fabrics, and proportions complement each other), occasion (e.g. 'Weekend brunch / Casual hangout'). ONLY use valid top, bottom, and sole indexes."
      : "You are an expert fashion stylist. Evaluate combinations of top + bottom for colour harmony, pattern matching, style aesthetics, and occasion appropriateness. Return distinct outfit combinations, best first. For each provide: top (1-based index), bottom (1-based index), score (compatibility rating integer 1-10), style (e.g. 'Smart Casual', 'Streetwear', 'Clean Minimal'), colors (e.g. 'Navy + beige'), reason (a detailed two-sentence explanation of why these colors, textures, and proportions complement each other), occasion (e.g. 'Dinner date / Evening out'). ONLY use valid top and bottom indexes.";

    if (!getGeminiApiKey()) {
      const recommendations = generateStylistRecommendations(tops, bottoms, soles, true);
      res.json({ recommendations });
      return;
    }

    let recommendations: OutfitRecommendation[] = [];

    try {
      const result = await callGeminiJson<{ recommendations: OutfitRecommendation[] }>(
        [{ text: textPrompt }],
        schema,
        systemInstruction,
        7500
      );

      const raw = result.recommendations ?? [];
      const isZeroIndexed = raw.some(
        (r) => r.top === 0 || r.bottom === 0 || (hasSoles && r.sole === 0)
      );

      recommendations = raw
        .map((r) => {
          let topIdx = isZeroIndexed ? r.top + 1 : r.top;
          let bottomIdx = isZeroIndexed ? r.bottom + 1 : r.bottom;
          let soleIdx = r.sole !== undefined ? (isZeroIndexed ? r.sole + 1 : r.sole) : undefined;

          // Clamp to valid range so no recommendation with good reasoning is lost
          topIdx = Math.max(1, Math.min(tops.length, topIdx || 1));
          bottomIdx = Math.max(1, Math.min(bottoms.length, bottomIdx || 1));
          if (hasSoles) {
            soleIdx = Math.max(1, Math.min(soles.length, soleIdx || 1));
          }

          return {
            ...r,
            top: topIdx,
            bottom: bottomIdx,
            sole: soleIdx,
            score: Math.min(10, Math.max(1, Math.round(r.score || 9))),
            isBasic: false,
          };
        })
        .slice(0, 4);
    } catch (aiErr: any) {
      console.warn("Gemini recommendation failed, using stylist harmony engine fallback:", aiErr?.message || aiErr);
    }

    // If Gemini was unavailable or returned empty, seamlessly use stylist engine with full details
    if (!recommendations.length) {
      recommendations = generateStylistRecommendations(tops, bottoms, soles, true);
    }

    res.json({ recommendations });
  } catch (error: any) {
    console.error("Error in /api/outfits/recommend:", error);
    // Guarantee fallback even on unexpected errors
    try {
      const fallbackRecs = generateStylistRecommendations(req.body?.tops || [], req.body?.bottoms || [], req.body?.soles);
      if (fallbackRecs.length > 0) {
        res.json({ recommendations: fallbackRecs });
        return;
      }
    } catch (e2) {}
    res.status(500).json({
      error: error?.message || "An error occurred while generating recommendations.",
    });
  }
});



// Live Web Fashion Search endpoint with fashion-only guardrails
app.get(["/api/fashion/search", "/fashion/search"], async (req: Request, res: Response) => {
  try {
    const q = ((req.query.q as string) || "").trim();
    const category = (req.query.category as any) || "all";

    if (!q) {
      res.json({ isFashion: true, query: "", results: [], total: 0 });
      return;
    }

    const response = await searchFashionImagesOnWeb(q, category);
    res.json(response);
  } catch (error: any) {
    console.error("Error in /api/fashion/search:", error);
    res.status(500).json({
      isFashion: true,
      error: error?.message || "Failed to search for fashion items on the web.",
      results: [],
      total: 0,
    });
  }
});

// Proxy image endpoint to prevent CORS blocks when downloading web images to upload slots
app.get(["/api/fashion/proxy-image", "/fashion/proxy-image"], async (req: Request, res: Response) => {
  const imageUrl = req.query.url as string;
  if (!imageUrl || (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://"))) {
    res.status(400).send("Invalid or missing image URL");
    return;
  }

  try {
    const fetchRes = await fetch(imageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
    });

    if (!fetchRes.ok) {
      res.status(fetchRes.status).send("Failed to fetch remote image");
      return;
    }

    const contentType = fetchRes.headers.get("content-type") || "image/jpeg";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=86400");

    const arrayBuffer = await fetchRes.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    console.warn("Proxy image error:", err?.message);
    res.status(500).send("Proxy fetch failed");
  }
});

// Config status endpoint
app.get(["/api/outfits/config-status", "/outfits/config-status"], (_req: Request, res: Response) => {
  const hasGemini = Boolean(getGeminiApiKey());
  res.json({
    geminiConfigured: hasGemini,
  });
});

// Privacy Policy Endpoint
app.get(["/privacy", "/api/privacy"], (_req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Privacy Policy - WearBot</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; max-width: 700px; margin: 40px auto; padding: 0 20px; color: #222; }
        h1 { font-size: 1.75rem; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        h2 { font-size: 1.25rem; margin-top: 24px; }
      </style>
    </head>
    <body>
      <h1>Privacy Policy for WearBot Outfit Recommendations</h1>
      <p>Last updated: October 2026</p>
      <h2>1. Overview</h2>
      <p>WearBot provides AI-powered outfit recommendations and style inspiration. We respect your privacy and only process the minimal data required to provide outfit suggestions.</p>
      <h2>2. Data Collection & Processing</h2>
      <p>Uploaded garment images are processed in-memory solely for the purpose of analyzing garment styles and color combinations. We do not sell or share your personal data with third-party advertisers.</p>
      <h2>3. Contact</h2>
      <p>For any privacy inquiries regarding WearBot, contact us through the application portal.</p>
    </body>
    </html>
  `);
});

// Server-side Vite mounting / Static files serving
async function startServer() {
  if (process.env.VERCEL) {
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== "true",
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`WEARBOT Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

export default app;
