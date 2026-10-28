import { OutfitRecommendation } from "./types";

const STYLES = [
  "Smart Casual",
  "Casual Minimal",
  "Streetwear Clean",
  "Urban Classic",
  "Relaxed Chic",
  "Monochrome Modern",
];

const OCCASIONS = [
  "Casual outing / Coffee & everyday",
  "Smart casual / Work & weekend brunch",
  "Evening dinner / Social gathering",
  "City stroll / Minimalist streetwear",
];

const REASONS = [
  "Complementary cut and clean silhouette create an effortless, balanced day-to-night look.",
  "Balanced tones provide versatile contrast while keeping the overall aesthetic cohesive.",
  "Modern proportions and textures coordinate seamlessly for a polished, everyday style.",
  "Clean lines and neutral harmony give this pairing a sharp and confident presence.",
];

/**
 * Generates instant, diverse outfit combinations client-side with zero network dependencies.
 * Ensures every combination has a valid top, bottom, optional sole, rating score, and detailed rationale.
 */
export function generateClientQuickShuffle(
  numTops: number,
  numBottoms: number,
  numSoles: number = 0
): OutfitRecommendation[] {
  if (numTops <= 0 || numBottoms <= 0) return [];

  const hasSoles = numSoles > 0;
  const allCombos: OutfitRecommendation[] = [];

  // Generate all possible pairing permutations
  for (let t = 1; t <= numTops; t++) {
    for (let b = 1; b <= numBottoms; b++) {
      if (hasSoles) {
        for (let s = 1; s <= numSoles; s++) {
          const score = 8 + ((t + b + s) % 3); // 8, 9, or 10 rating
          const style = STYLES[(t + b + s) % STYLES.length];
          const occasion = OCCASIONS[(t + b + s) % OCCASIONS.length];
          const reason = REASONS[(t * 2 + b + s) % REASONS.length];

          allCombos.push({
            top: t,
            bottom: b,
            sole: s,
            score,
            style,
            colors: `Top #${t} + Bottom #${b} + Footwear #${s}`,
            reason,
            occasion,
            isBasic: true,
          });
        }
      } else {
        const score = 8 + ((t + b) % 3);
        const style = STYLES[(t + b) % STYLES.length];
        const occasion = OCCASIONS[(t + b) % OCCASIONS.length];
        const reason = REASONS[(t * 2 + b) % REASONS.length];

        allCombos.push({
          top: t,
          bottom: b,
          score,
          style,
          colors: `Top #${t} + Bottom #${b}`,
          reason,
          occasion,
          isBasic: true,
        });
      }
    }
  }

  // Shuffle permutations with Fisher-Yates for genuine randomness on every click
  for (let i = allCombos.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allCombos[i], allCombos[j]] = [allCombos[j], allCombos[i]];
  }

  // Pick up to 4 balanced, distinct recommendations
  const selected: OutfitRecommendation[] = [];
  const usedTops = new Set<number>();
  const usedBottoms = new Set<number>();

  for (const combo of allCombos) {
    if (selected.length >= 4) break;
    // Prefer distinct tops and bottoms first
    if (!usedTops.has(combo.top) || !usedBottoms.has(combo.bottom)) {
      selected.push(combo);
      usedTops.add(combo.top);
      usedBottoms.add(combo.bottom);
    }
  }

  // If still fewer than 4, fill with any remaining distinct combos
  if (selected.length < 4) {
    for (const combo of allCombos) {
      if (selected.length >= 4) break;
      if (!selected.some((s) => s.top === combo.top && s.bottom === combo.bottom && s.sole === combo.sole)) {
        selected.push(combo);
      }
    }
  }

  return selected;
}
