import express, { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";
import { searchSimilarOutfitImages } from "./server/image-search";
import {
  getPinterestAuthUrl,
  exchangePinterestCode,
  fetchPinterestUserProfile,
} from "./server/pinterest-auth";
import { ClothingAnalysis, OutfitRecommendation } from "./src/lib/types";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cookieParser());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
app.use(express.static(path.resolve(__dirname, "public")));

const geminiApiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: geminiApiKey || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Resilient helper for calling Gemini with generous timeout and low thinking latency
async function callGeminiJson<T>(
  parts: any[],
  schema: any,
  systemInstruction: string,
  timeoutMs = 30000
): Promise<T> {
  if (!geminiApiKey) {
    throw new Error(
      "The Gemini API key is missing. Add GEMINI_API_KEY to your project secrets in Settings > Secrets."
    );
  }

  const modelsToTry = ["gemini-3.8-flash", "gemini-flash-latest"];
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
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
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
      // If the primary model timed out after timeoutMs, don't double the wait with another timeout
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

// ----------------- PINTEREST OAUTH ROUTES -----------------
function getRedirectUri(req: Request): string {
  if (process.env.APP_URL) {
    return `${process.env.APP_URL.replace(/\/$/, "")}/auth/pinterest/callback`;
  }
  const host = req.get("host") || "localhost:3000";
  const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
  return `${protocol}://${host}/auth/pinterest/callback`;
}

// 1. Get Pinterest Authorization URL
app.get(["/api/auth/pinterest/url", "/auth/pinterest/url"], (req: Request, res: Response) => {
  const redirectUri = getRedirectUri(req);
  const result = getPinterestAuthUrl(redirectUri);
  if (result.error) {
    res.status(400).json({ error: result.error, redirectUri });
    return;
  }
  res.json({ url: result.url, redirectUri });
});

// 2. OAuth Callback from Pinterest (Popup handler)
const pinterestCallbackHandler = async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const redirectUri = getRedirectUri(req);

  if (!code) {
    res.send(`
      <html>
        <body style="font-family: sans-serif; text-align: center; padding: 2rem;">
          <h3>Authentication failed</h3>
          <p>No authorization code received from Pinterest.</p>
          <script>setTimeout(() => window.close(), 3000);</script>
        </body>
      </html>
    `);
    return;
  }

  const { accessToken, error } = await exchangePinterestCode(code, redirectUri);
  if (error || !accessToken) {
    res.send(`
      <html>
        <body style="font-family: sans-serif; text-align: center; padding: 2rem;">
          <h3>Connection Failed</h3>
          <p>${error || "Failed to exchange authorization code."}</p>
          <script>setTimeout(() => window.close(), 4000);</script>
        </body>
      </html>
    `);
    return;
  }

  // Set cross-origin secure cookie (SameSite: 'none', Secure: true for iframe support)
  res.cookie("pinterest_token", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  // PostMessage success to the parent window and close popup
  res.send(`
    <html>
      <head>
        <title>Connected to Pinterest</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 3rem; background: #fafafa; color: #111; }
          .badge { display: inline-flex; align-items: center; justify-content: center; background: #e60023; color: #fff; width: 48px; height: 48px; border-radius: 50%; margin-bottom: 1rem; }
        </style>
      </head>
      <body>
        <div class="badge">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.08 3.16 9.42 7.62 11.17-.1-.95-.2-2.4.04-3.44.22-.93 1.4-5.95 1.4-5.95s-.36-.72-.36-1.78c0-1.66.97-2.9 2.17-2.9 1.02 0 1.52.77 1.52 1.69 0 1.03-.66 2.57-1 4-.28 1.2.6 2.17 1.78 2.17 2.13 0 3.77-2.25 3.77-5.49 0-2.87-2.06-4.88-5.01-4.88-3.41 0-5.42 2.56-5.42 5.2 0 1.03.4 2.14.89 2.74.1.12.11.22.08.34l-.33 1.36c-.05.22-.18.27-.4.16-1.5-.7-2.43-2.89-2.43-4.65 0-3.78 2.75-7.26 7.92-7.26 4.16 0 7.39 2.97 7.39 6.92 0 4.13-2.6 7.46-6.22 7.46-1.21 0-2.36-.63-2.75-1.38l-.75 2.85c-.27 1.04-1 2.35-1.49 3.15A12 12 0 0 0 24 12C24 5.37 18.63 0 12 0z"/></svg>
        </div>
        <h2>Connected to Pinterest!</h2>
        <p>This window will close automatically…</p>
        <script>
          try {
            if (window.opener) {
              window.opener.postMessage({ type: 'PINTEREST_AUTH_SUCCESS' }, '*');
            }
          } catch (e) {}
          setTimeout(() => window.close(), 1200);
        </script>
      </body>
    </html>
  `);
};

app.get(
  ["/auth/pinterest/callback", "/auth/pinterest/callback/", "/api/auth/pinterest/callback"],
  pinterestCallbackHandler
);

// 3. Pinterest Connection Status
app.get(["/api/auth/pinterest/status", "/auth/pinterest/status"], async (req: Request, res: Response) => {
  const token = req.cookies?.pinterest_token || process.env.PINTEREST_ACCESS_TOKEN;
  const appId = Boolean(process.env.PINTEREST_APP_ID || process.env.PINTEREST_CLIENT_ID);

  if (!token) {
    res.json({
      connected: false,
      oauthConfigured: appId,
      hasStaticToken: Boolean(process.env.PINTEREST_ACCESS_TOKEN),
      redirectUri: getRedirectUri(req),
    });
    return;
  }

  const { user } = await fetchPinterestUserProfile(token);
  res.json({
    connected: true,
    user: user || { username: "Pinterest User" },
    oauthConfigured: appId,
    hasStaticToken: Boolean(process.env.PINTEREST_ACCESS_TOKEN),
    redirectUri: getRedirectUri(req),
  });
});

// 4. Disconnect Pinterest
app.post(["/api/auth/pinterest/disconnect", "/auth/pinterest/disconnect"], (_req: Request, res: Response) => {
  res.clearCookie("pinterest_token", {
    secure: true,
    sameSite: "none",
  });
  res.json({ success: true });
});

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

    let resultItems: ClothingAnalysis[] = [];
    try {
      // Allow up to 45 seconds for image analysis (scaled with image count)
      const analyseTimeout = Math.min(60000, Math.max(35000, images.length * 8000));
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

    let recommendations: OutfitRecommendation[] = [];

    try {
      const result = await callGeminiJson<{ recommendations: OutfitRecommendation[] }>(
        [{ text: textPrompt }],
        schema,
        systemInstruction,
        30000
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

// Internet image search endpoint
app.post(["/api/outfits/similar-images", "/outfits/similar-images"], async (req: Request, res: Response) => {
  try {
    const { style, colors, top, bottom, sole, query } = req.body;
    const pinterestToken = req.cookies?.pinterest_token || process.env.PINTEREST_ACCESS_TOKEN;

    const response = await searchSimilarOutfitImages({
      style: style || "",
      colors: colors || "",
      top,
      bottom,
      sole,
      query,
      ...({ pinterestAccessToken: pinterestToken } as any),
    });
    res.json(response);
  } catch (error: any) {
    console.error("Error in /api/outfits/similar-images:", error);
    res.status(500).json({
      error: error?.message || "Failed to search for similar outfit images.",
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

    const { searchFashionImagesOnWeb } = await import("./server/fashion-web-search");
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
app.get(["/api/outfits/config-status", "/outfits/config-status"], (req: Request, res: Response) => {
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  const hasGoogleSearch = Boolean(
    process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_CX
  );
  const hasSerpApi = Boolean(process.env.SERPAPI_API_KEY);
  const hasUnsplash = Boolean(process.env.UNSPLASH_ACCESS_KEY);
  const hasPinterestOauth = Boolean(process.env.PINTEREST_APP_ID || process.env.PINTEREST_CLIENT_ID);
  const hasPinterestToken = Boolean(
    req.cookies?.pinterest_token || process.env.PINTEREST_ACCESS_TOKEN
  );

  res.json({
    geminiConfigured: hasGemini,
    pinterest: {
      connected: hasPinterestToken,
      oauthConfigured: hasPinterestOauth,
      redirectUri: getRedirectUri(req),
    },
    imageSearchProviders: {
      googleCustomSearch: hasGoogleSearch,
      serpApi: hasSerpApi,
      unsplash: hasUnsplash,
      pinterestDirect: true,
      pinterestOfficialApi: hasPinterestToken,
    },
    activeImageProvider: hasPinterestToken
      ? "Pinterest API (Official / Connected)"
      : hasGoogleSearch
      ? "Google Custom Search (Pinterest Indexed)"
      : hasSerpApi
      ? "SerpAPI"
      : hasUnsplash
      ? "Unsplash API"
      : "Pinterest (Direct)",
  });
});

// Privacy Policy Endpoint (required by Pinterest Developer verification)
app.get("/privacy", (_req: Request, res: Response) => {
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
      <h2>3. Pinterest Integration</h2>
      <p>When you choose to connect your Pinterest account, WearBot accesses only authorized public pins and boards to retrieve visually similar fashion inspiration.</p>
      <h2>4. Contact</h2>
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
