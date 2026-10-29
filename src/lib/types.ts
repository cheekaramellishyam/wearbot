export type ClothingAnalysis = {
  type: string;
  primaryColor: string;
  secondaryColors: string[];
  pattern: string;
  style: string;
  fabric: string;
  aesthetic: string;
};

export type OutfitRecommendation = {
  top: number;
  bottom: number;
  sole?: number;
  score: number;
  style: string;
  colors: string;
  reason: string;
  occasion: string;
  isBasic?: boolean;
};
