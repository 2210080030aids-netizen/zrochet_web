"use client";

import { useEffect, useMemo, useState } from "react";
import { getSampleReviewsForProduct } from "@/lib/sample-reviews";
import { computeReviewStats, type ReviewStats } from "@/lib/review-stats";

interface ProductReview {
  id: string;
  authorName: string;
  rating: number;
  title: string | null;
  body: string;
  createdAt: string;
}

interface DisplayReview {
  key: string;
  author: string;
  rating: number;
  title: string | null;
  body: string;
  date: string;
}

interface ProductReviewsProps {
  categorySlug: string;
  productId: string;
  onStatsChange?: (stats: ReviewStats) => void;
}

const PAGE_SIZE = 3;

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`h-4 w-4 ${i < Math.round(rating) ? "text-gold" : "text-sand"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292Z" />
        </svg>
      ))}
    </div>
  );
}

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const star = i + 1;
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-0.5 transition hover:scale-110"
            aria-label={`Rate ${star} stars`}
          >
            <svg
              className={`h-6 w-6 ${star <= value ? "text-gold" : "text-sand"}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292Z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

function formatReviewDate(value: string): string {
  return new Date(value).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

function ReviewCard({ review }: { review: DisplayReview }) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-sand/60 bg-white p-5 transition hover:luxury-shadow">
      <div className="flex items-center justify-between gap-4">
        <StarRating rating={review.rating} />
        <span className="text-xs font-medium text-brown">Customer</span>
      </div>
      {review.title && (
        <h3 className="mt-3 font-medium text-brown-dark">{review.title}</h3>
      )}
      <p className="mt-2 flex-1 text-sm leading-relaxed text-text-muted">{review.body}</p>
      <p className="mt-4 text-xs text-text-muted">
        {review.author} · {review.date}
      </p>
    </article>
  );
}

export default function ProductReviews({
  categorySlug,
  productId,
  onStatsChange,
}: ProductReviewsProps) {
  const sampleReviews = getSampleReviewsForProduct(productId);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [rating, setRating] = useState(5);

  function emitStats(liveReviews: ProductReview[]) {
    const stats = computeReviewStats([
      ...liveReviews.map((review) => review.rating),
      ...sampleReviews.map((review) => review.rating),
    ]);
    onStatsChange?.(stats);
  }

  async function loadReviews() {
    try {
      const res = await fetch(
        `/api/products/${encodeURIComponent(categorySlug)}/${encodeURIComponent(productId)}/reviews`
      );
      const text = await res.text();
      const data = text ? JSON.parse(text) : { reviews: [] };
      const nextReviews = data.reviews ?? [];
      setReviews(nextReviews);
      if (data.stats) {
        onStatsChange?.(data.stats);
      } else {
        emitStats(nextReviews);
      }
    } catch {
      setReviews([]);
      emitStats([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setPage(0);
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when product changes
  }, [categorySlug, productId]);

  const allReviews = useMemo<DisplayReview[]>(() => {
    const live = reviews.map((review) => ({
      key: review.id,
      author: review.authorName,
      rating: review.rating,
      title: review.title,
      body: review.body,
      date: formatReviewDate(review.createdAt),
    }));

    const samples = sampleReviews.map((review) => ({
      key: `sample-${review.id}`,
      author: review.author,
      rating: review.rating,
      title: review.title,
      body: review.body,
      date: review.date,
    }));

    return [...live, ...samples].sort((a, b) => b.rating - a.rating);
  }, [reviews, sampleReviews]);

  const totalPages = Math.max(1, Math.ceil(allReviews.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const visibleReviews = allReviews.slice(
    currentPage * PAGE_SIZE,
    currentPage * PAGE_SIZE + PAGE_SIZE
  );
  const canGoPrev = currentPage > 0;
  const canGoNext = currentPage < totalPages - 1;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    const res = await fetch(
      `/api/products/${encodeURIComponent(categorySlug)}/${encodeURIComponent(productId)}/reviews`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorName, title, body, rating }),
      }
    );

    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error || "Could not post your comment");
      return;
    }

    const nextReviews = [data.review, ...reviews];
    setReviews(nextReviews);
    if (data.stats) {
      onStatsChange?.(data.stats);
    } else {
      emitStats(nextReviews);
    }
    setPage(0);
    setAuthorName("");
    setTitle("");
    setBody("");
    setRating(5);
    setMessage("Thank you! Your comment is now visible to everyone.");
  }

  return (
    <section className="mt-12 border-t border-sand pt-12">
      <h2 className="font-display text-2xl font-semibold text-brown-dark md:text-3xl">
        Customer Reviews
      </h2>

      <div className="mt-8">
        {loading ? (
          <p className="text-sm text-text-muted">Loading comments…</p>
        ) : allReviews.length === 0 ? (
          <p className="text-sm text-text-muted">No comments yet. Be the first to share.</p>
        ) : (
          <div className="relative">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {visibleReviews.map((review) => (
                <ReviewCard key={review.key} review={review} />
              ))}
            </div>

            {allReviews.length > PAGE_SIZE && (
              <div className="mt-6 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={!canGoPrev}
                  aria-label="Previous comments"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-sand bg-white text-brown-dark transition hover:border-gold hover:bg-cream disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <span className="min-w-[5rem] text-center text-sm text-text-muted">
                  {currentPage + 1} / {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={!canGoNext}
                  aria-label="Next comments"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-sand bg-white text-brown-dark transition hover:border-gold hover:bg-cream disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-12 rounded-2xl border border-sand bg-beige/30 p-6 md:p-8">
        <h3 className="font-display text-xl font-semibold text-brown-dark md:text-2xl">
          Share your experience
        </h3>
        <p className="mt-2 text-sm text-text-muted">
          Leave a comment below — it will be public and visible to everyone.
        </p>

        <form onSubmit={handleSubmit} className="mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-brown-dark">
              Your name
              <input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                required
                placeholder="e.g. Priya M."
                className="mt-2 w-full rounded-xl border border-sand bg-white px-4 py-3 text-sm"
              />
            </label>
            <label className="block text-sm font-medium text-brown-dark">
              Rating
              <div className="mt-3">
                <StarPicker value={rating} onChange={setRating} />
              </div>
            </label>
          </div>
          <label className="mt-4 block text-sm font-medium text-brown-dark">
            Title (optional)
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Beautiful craftsmanship"
              className="mt-2 w-full rounded-xl border border-sand bg-white px-4 py-3 text-sm"
            />
          </label>
          <label className="mt-4 block text-sm font-medium text-brown-dark">
            Your comment
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={4}
              placeholder="Tell others what you think about this bag..."
              className="mt-2 w-full rounded-xl border border-sand bg-white px-4 py-3 text-sm"
            />
          </label>
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          {message && <p className="mt-4 text-sm text-emerald-700">{message}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="mt-5 rounded-full bg-brown-dark px-8 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-brown disabled:opacity-50"
          >
            {submitting ? "Posting…" : "Post comment"}
          </button>
        </form>
      </div>
    </section>
  );
}
