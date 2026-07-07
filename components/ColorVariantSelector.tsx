"use client";

import Link from "next/link";
import type { Product } from "@/lib/types";

interface ColorVariantSelectorProps {
  product: Product;
}

export default function ColorVariantSelector({ product }: ColorVariantSelectorProps) {
  if (!product.colorVariants.length) return null;

  const pillClass = (isActive: boolean) =>
    [
      "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-wider bg-brown-dark text-white transition",
      isActive ? "ring-2 ring-gold ring-offset-2" : "opacity-80 hover:bg-brown hover:opacity-100",
    ].join(" ");

  return (
    <div>
      <h3 className="text-sm font-semibold text-brown-dark">Color</h3>
      <p className="mt-1 text-xs text-text-muted">
        Available in {product.colorVariants.length} colour
        {product.colorVariants.length > 1 ? "s" : ""}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {product.colorVariants.map((variant) => {
          const isActive = variant.productId === product.id;
          const label = (
            <>
              <span
                className="h-3 w-3 shrink-0 rounded-full border border-white/60"
                style={{ backgroundColor: variant.swatch }}
                aria-hidden="true"
              />
              <span>{variant.name}</span>
            </>
          );

          if (isActive) {
            return (
              <span key={variant.productId} className={pillClass(true)} aria-current="true">
                {label}
              </span>
            );
          }

          return (
            <Link
              key={variant.productId}
              href={`/${product.category}/${variant.productId}`}
              className={pillClass(false)}
              aria-label={`View ${variant.name} colour`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
