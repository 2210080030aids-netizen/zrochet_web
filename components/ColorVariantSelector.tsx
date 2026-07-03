"use client";

import Link from "next/link";
import type { Product } from "@/lib/types";

interface ColorVariantSelectorProps {
  product: Product;
}

export default function ColorVariantSelector({ product }: ColorVariantSelectorProps) {
  if (!product.colorVariants.length) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-brown-dark">Color</h3>
      <p className="mt-1 text-xs text-text-muted">
        Available in {product.colorVariants.length} colour
        {product.colorVariants.length > 1 ? "s" : ""}
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        {product.colorVariants.map((variant) => {
          const isActive = variant.productId === product.id;

          const swatch = (
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                isActive
                  ? "border-brown-dark ring-2 ring-gold/40 ring-offset-2 scale-110"
                  : "border-sand hover:border-gold hover:scale-105"
              }`}
              style={{ backgroundColor: variant.swatch }}
              title={variant.name}
            >
              {isActive && (
                <svg className="h-4 w-4 text-white drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
          );

          return (
            <div key={variant.productId} className="flex flex-col items-center gap-1.5">
              {isActive ? (
                <div aria-current="true">{swatch}</div>
              ) : (
                <Link
                  href={`/${product.category}/${variant.productId}`}
                  aria-label={"View " + variant.name + " colour"}
                >
                  {swatch}
                </Link>
              )}
              <span
                className={`max-w-[72px] text-center text-[10px] leading-tight ${
                  isActive ? "font-semibold text-brown-dark" : "text-text-muted"
                }`}
              >
                {variant.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
