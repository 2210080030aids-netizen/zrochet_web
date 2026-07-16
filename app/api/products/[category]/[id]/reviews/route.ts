import { NextResponse } from "next/server";
import { resolveStoredProductId } from "@/lib/product-id";
import {
  createProductReview,
  listProductReviews,
  syncProductRatingFromReviews,
} from "@/lib/product-reviews-db";
import { resolveDisplayReviewStats } from "@/lib/review-stats";

interface RouteParams {
  params: Promise<{ category: string; id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { category, id } = await params;
    const productId = await resolveStoredProductId(category, id);
    if (!productId) {
      return NextResponse.json({ reviews: [], stats: { rating: 0, reviewCount: 0 } });
    }
    const reviews = await listProductReviews(category, productId);
    const stats = resolveDisplayReviewStats(
      productId,
      reviews.map((review) => review.rating)
    );
    return NextResponse.json({ reviews, stats });
  } catch (error) {
    console.error("Reviews fetch failed:", error);
    return NextResponse.json(
      { reviews: [], stats: { rating: 0, reviewCount: 0 }, error: "Could not load reviews" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { category, id } = await params;
    const productId = await resolveStoredProductId(category, id);
    if (!productId) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const body = await request.json();
    const authorName = String(body.authorName ?? "").trim();
    const title = body.title ? String(body.title).trim() : null;
    const comment = String(body.body ?? "").trim();
    const rating = Number(body.rating);

    if (!authorName || authorName.length < 2) {
      return NextResponse.json({ error: "Please enter your name" }, { status: 400 });
    }

    if (!comment || comment.length < 10) {
      return NextResponse.json(
        { error: "Please write at least 10 characters in your comment" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    const review = await createProductReview({
      categorySlug: category,
      productId,
      authorName,
      title,
      body: comment,
      rating,
    });

    const stats = await syncProductRatingFromReviews(category, productId);

    return NextResponse.json({ review, stats }, { status: 201 });
  } catch (error) {
    console.error("Review create failed:", error);
    return NextResponse.json({ error: "Could not post your comment" }, { status: 500 });
  }
}
