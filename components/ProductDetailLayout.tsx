"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import ThumbnailRail from "./ThumbnailRail";
import MainProductMedia from "./MainProductMedia";
import ProductReviews from "./ProductReviews";

interface ProductDetailLayoutProps {
  product: Product;
  info: React.ReactNode;
  purchase: React.ReactNode;
}

export default function ProductDetailLayout({
  product,
  info,
  purchase,
}: ProductDetailLayoutProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [videoPlayToken, setVideoPlayToken] = useState(0);
  const media = product.media ?? [];
  const activeItem = media[activeIndex];

  function handleMediaSelect(index: number) {
    setActiveIndex(index);
    if (media[index]?.type === "video") {
      setVideoPlayToken((token) => token + 1);
    }
  }

  if (!media.length) {
    return (
      <div className="rounded-2xl border border-sand bg-white p-12 text-center text-text-muted">
        <p>No product images found.</p>
        <p className="mt-2 text-sm">Run npm run generate:catalog after adding images.</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 lg:hidden">{purchase}</div>

      <div className="grid items-start gap-8 xl:grid-cols-[80px_minmax(0,2.1fr)_minmax(280px,0.8fr)_252px] xl:gap-8">
        <div className="hidden xl:block xl:pt-6">
          <ThumbnailRail
            media={media}
            activeIndex={activeIndex}
            onSelect={handleMediaSelect}
          />
        </div>

        <div className="xl:pt-6">
          {activeItem && (
            <MainProductMedia
              item={activeItem}
              alt={product.name + " — " + activeItem.label}
              index={activeIndex}
              total={media.length}
              videoPlayToken={videoPlayToken}
            />
          )}
          <div className="mt-4 xl:hidden">
            <ThumbnailRail
              media={media}
              activeIndex={activeIndex}
              onSelect={handleMediaSelect}
            />
          </div>
        </div>

        <div>{info}</div>

        <div className="hidden lg:block">
          <div className="sticky top-24">{purchase}</div>
        </div>
      </div>

      <ProductReviews categorySlug={product.category} productId={product.id} />
    </>
  );
}
