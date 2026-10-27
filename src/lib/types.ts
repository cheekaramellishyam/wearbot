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

export type SimilarImageResult = {
  id: string;
  imageUrl: string;
  title: string;
  sourceUrl: string;
  sourceDomain: string;
  author?: string;
};

export type SimilarImagesResponse = {
  results: SimilarImageResult[];
  provider: string;
  configuredApi?: string;
  note?: string;
};
