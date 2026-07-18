"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Product } from "@/lib/types";
import { formatOriginalPrice, formatPrice } from "@/lib/catalog";
import { useCart } from "@/lib/cart-context";
import {
  PRODUCT_HIGHLIGHTS,
  normalizeProductHighlights,
  type ProductHighlightKey,
} from "@/lib/product-highlights";

interface PurchasePanelProps {
  product: Product;
  selectedSize?: string;
}

const HIGHLIGHT_ICONS: Record<ProductHighlightKey, string> = {
  freeDelivery:
    "M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9m3.75 11.25v-3a1.5 1.5 0 0 0-3 0v3m3.75 0h-3.375",
  secureCheckout:
    "M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z",
  easyReturns:
    "M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3",
};

export default function PurchasePanel({ product, selectedSize }: PurchasePanelProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const maxQuantity = Math.max(0, Math.min(10, product.quantity));
  const [quantity, setQuantity] = useState(maxQuantity > 0 ? 1 : 0);
  const [added, setAdded] = useState(false);

  const original = formatOriginalPrice(product);
  const canPurchase = product.inStock && product.quantity > 0;
  const lowStock = canPurchase && product.quantity < 5;
  const size = selectedSize || product.sizes?.[0] || "One Size";
  const enabledHighlightKeys = normalizeProductHighlights(product.highlights);
  const highlights = PRODUCT_HIGHLIGHTS.filter((h) =>
    enabledHighlightKeys.includes(h.key)
  );

  function handleAddToCart() {
    if (!canPurchase) return;
    addItem(product, quantity, size);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleBuyNow() {
    if (!canPurchase) return;
    addItem(product, quantity, size);
    router.push("/checkout");
  }

  return (
    <aside className="sticky top-24 rounded-2xl border border-sand/80 bg-white p-4 luxury-shadow-lg xl:p-5">
      <div className="mb-1 flex flex-wrap items-baseline gap-2">
        <span className="font-display text-2xl font-semibold text-brown-dark">
          {formatPrice(product)}
        </span>
        {original && (
          <span className="text-base text-text-muted line-through">{original}</span>
        )}
      </div>

      {product.discountPercent > 0 && (
        <p className="mb-3 text-xs font-medium text-emerald-700">
          Save {product.discountPercent}% today
        </p>
      )}

      <div
        className={`mb-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
          !canPurchase
            ? "bg-red-50 text-red-700"
            : lowStock
              ? "bg-amber-50 text-amber-800"
              : "bg-emerald-50 text-emerald-800"
        }`}
      >
        <span
          className={`h-2 w-2 rounded-full ${
            !canPurchase ? "bg-red-500" : lowStock ? "bg-amber-500" : "bg-emerald-500"
          }`}
        />
        {!canPurchase
          ? "Out of Stock"
          : lowStock
            ? `Only ${product.quantity} left`
            : product.quantity < 11
              ? `In Stock (${product.quantity} available)`
              : "In Stock"}
      </div>

      {highlights.length > 0 && (
        <div className="mb-4 space-y-2.5 text-xs text-text-muted">
          {highlights.map((highlight) => (
            <div key={highlight.key} className="flex gap-2.5">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path d={HIGHLIGHT_ICONS[highlight.key]} />
              </svg>
              <div>
                <p className="font-medium text-brown-dark">{highlight.title}</p>
                <p>
                  {highlight.key === "freeDelivery"
                    ? `Estimated ${product.deliveryDays}`
                    : highlight.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <label className="mb-3 block text-xs font-medium text-brown-dark">
        Quantity
        <div className="mt-1.5 flex items-center rounded-lg border border-sand">
          <button
            type="button"
            className="px-3 py-2 text-base transition hover:bg-beige disabled:opacity-40"
            disabled={!canPurchase || quantity <= 1}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="flex-1 text-center font-medium">{quantity}</span>
          <button
            type="button"
            className="px-3 py-2 text-base transition hover:bg-beige disabled:opacity-40"
            disabled={!canPurchase || quantity >= maxQuantity}
            onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </label>

      <div className="space-y-2">
        <button
          type="button"
          disabled={!canPurchase}
          onClick={handleAddToCart}
          className={`w-full rounded-full py-2.5 text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
            added
              ? "bg-brown text-white"
              : "bg-brown-dark text-white hover:bg-brown hover:-translate-y-0.5 hover:luxury-shadow"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {added ? "Added to Cart ✓" : "Add to Cart"}
        </button>

        <button
          type="button"
          disabled={!canPurchase}
          onClick={handleBuyNow}
          className="w-full rounded-full border-2 border-gold bg-gold/10 py-2.5 text-xs font-semibold uppercase tracking-wider text-brown-dark transition hover:bg-gold/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Buy Now
        </button>
      </div>
    </aside>
  );
}
