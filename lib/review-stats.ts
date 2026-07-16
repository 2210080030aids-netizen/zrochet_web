import { getSampleReviewsForProduct } from "@/lib/sample-reviews";

export interface ReviewStats {
  rating: number;
  reviewCount: number;
}

/** Average rating rounded to 1 decimal, plus count. */
export function computeReviewStats(ratings: number[]): ReviewStats {
  const valid = ratings.filter((value) => Number.isFinite(value) && value > 0);
  if (!valid.length) {
    return { rating: 0, reviewCount: 0 };
  }
  const sum = valid.reduce((total, value) => total + value, 0);
  return {
    rating: Math.round((sum / valid.length) * 10) / 10,
    reviewCount: valid.length,
  };
}

/**
 * Display stats match what customers see: sample comments + live comments.
 * Pass liveRatings when available; otherwise falls back to samples only.
 */
export function resolveDisplayReviewStats(
  productId: string,
  liveRatings: number[] = []
): ReviewStats {
  const samples = getSampleReviewsForProduct(productId);
  return computeReviewStats([
    ...liveRatings,
    ...samples.map((review) => review.rating),
  ]);
}
