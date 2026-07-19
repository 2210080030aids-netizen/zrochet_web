import { getSampleReviewSummary } from "@/lib/sample-reviews";

export interface ReviewStats {
  rating: number;
  reviewCount: number;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Average rating rounded to 1 decimal, plus count. */
export function computeReviewStats(ratings: number[]): ReviewStats {
  const valid = ratings.filter((value) => Number.isFinite(value) && value > 0);
  if (!valid.length) {
    return { rating: 0, reviewCount: 0 };
  }
  const sum = valid.reduce((total, value) => total + value, 0);
  return {
    rating: round1(sum / valid.length),
    reviewCount: valid.length,
  };
}

/**
 * Display stats blend a product's baseline rating (from its built-in sample
 * comments) with any live customer reviews. With no live reviews the headline
 * equals the configured baseline (e.g. 4.5 / 4.6 / 4.7); once customers post,
 * their ratings are folded in and the count grows accordingly.
 */
export function resolveDisplayReviewStats(
  productId: string,
  liveRatings: number[] = []
): ReviewStats {
  const { reviews, baseRating } = getSampleReviewSummary(productId);
  const sampleCount = reviews.length;
  const validLive = liveRatings.filter((value) => Number.isFinite(value) && value > 0);

  if (!validLive.length) {
    return {
      rating: sampleCount ? round1(baseRating) : 0,
      reviewCount: sampleCount,
    };
  }

  const liveSum = validLive.reduce((total, value) => total + value, 0);
  const total = baseRating * sampleCount + liveSum;
  const count = sampleCount + validLive.length;

  return {
    rating: round1(total / count),
    reviewCount: count,
  };
}
