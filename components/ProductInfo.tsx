"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import { formatOriginalPrice, formatPrice } from "@/lib/catalog";
import ColorVariantSelector from "./ColorVariantSelector";

interface ProductInfoProps {
  product: Product;
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

export default function ProductInfo({ product }: ProductInfoProps) {
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const original = formatOriginalPrice(product);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.15em] text-gold">
          {product.collection}
        </p>
        <h1 className="font-display mt-2 text-3xl font-semibold leading-tight text-brown-dark md:text-4xl">
          {product.name}
        </h1>
        <p className="mt-1 text-sm text-text-muted">SKU: {product.id}</p>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <StarRating rating={product.rating} />
          <span className="text-sm font-medium text-brown-dark">{product.rating}</span>
          <span className="text-sm text-text-muted">
            ({product.reviewCount} reviews)
          </span>
        </div>

        <div className="mt-4 flex items-baseline gap-3 lg:hidden">
          <span className="font-display text-2xl font-semibold text-brown-dark">
            {formatPrice(product)}
          </span>
          {original && (
            <span className="text-base text-text-muted line-through">{original}</span>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <h2 className="font-display text-xl font-semibold text-brown-dark">About this bag</h2>
        <p className="mt-3 leading-relaxed text-text-muted">{product.description}</p>
      </div>

      {/* Features */}
      <div className="rounded-2xl border border-sand/60 bg-white/60 p-5">
        <h2 className="font-display text-xl font-semibold text-brown-dark">Product details</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          {[
            ["Material", product.material],
            ["Dimensions", product.dimensions],
            ["Care", product.care],
            ["Handmade", "100% artisan crochet"],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs font-medium uppercase tracking-wider text-brown">{label}</dt>
              <dd className="mt-1 text-sm text-text">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Color variants — switch between Yellow/Black ↔ Blue mini bags, etc. */}
      <ColorVariantSelector product={product} />

      {/* Size */}
      <div className="space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-brown-dark">Size</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.sizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setSelectedSize(size)}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  selectedSize === size
                    ? "border-brown-dark bg-brown-dark text-white"
                    : "border-sand bg-white text-text hover:border-gold"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
