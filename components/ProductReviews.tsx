"use client";

import { useEffect, useState } from "react";
import { getSampleReviewsForProduct } from "@/lib/sample-reviews";

interface ProductReview {
  id: string;
  authorName: string;
  rating: number;
  title: string | null;
  body: string;
  createdAt: string;
}

interface ProductReviewsProps {
  categorySlug: string;
  productId: string;
}

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

export default function ProductReviews({ categorySlug, productId }: ProductReviewsProps) {
  const sampleReviews = getSampleReviewsForProduct(productId);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [rating, setRating] = useState(5);

  async function loadReviews() {
    try {
      const res = await fetch(
        `/api/products/${encodeURIComponent(categorySlug)}/${encodeURIComponent(productId)}/reviews`
      );
      const text = await res.text();
      const data = text ? JSON.parse(text) : { reviews: [] };
      setReviews(data.reviews ?? []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews();
  }, [categorySlug, productId]);

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

    setReviews((current) => [data.review, ...current]);
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
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review) => (
              <article
                key={review.id}
                className="flex h-full flex-col rounded-2xl border border-sand/60 bg-cream/40 p-5 transition hover:luxury-shadow"
              >
                <div className="flex items-center justify-between gap-4">
                  <StarRating rating={review.rating} />
                  <span className="text-xs font-medium text-brown">Customer</span>
                </div>
                {review.title && (
                  <h3 className="mt-3 font-medium text-brown-dark">{review.title}</h3>
                )}
                <p className="mt-2 flex-1 text-sm leading-relaxed text-text-muted">{review.body}</p>
                <p className="mt-4 text-xs text-text-muted">
                  {review.authorName} · {formatReviewDate(review.createdAt)}
                </p>
              </article>
            ))}

            {sampleReviews.map((review) => (
              <article
                key={`sample-${review.id}`}
                className="flex h-full flex-col rounded-2xl border border-sand/60 bg-white p-5 transition hover:luxury-shadow"
              >
                <div className="flex items-center justify-between gap-4">
                  <StarRating rating={review.rating} />
                  {review.verified && (
                    <span className="text-xs font-medium text-emerald-700">Verified Purchase</span>
                  )}
                </div>
                <h3 className="mt-3 font-medium text-brown-dark">{review.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-text-muted">{review.body}</p>
                <p className="mt-4 text-xs text-text-muted">
                  {review.author} · {review.date}
                </p>
              </article>
            ))}
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
