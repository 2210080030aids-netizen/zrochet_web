"use client";

import Image from "next/image";
import type { ProductMedia } from "@/lib/types";
import { resolveProductMediaSrc } from "@/lib/product-media-storage";

interface ThumbnailRailProps {
  media: ProductMedia[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

export default function ThumbnailRail({
  media = [],
  activeIndex,
  onSelect,
}: ThumbnailRailProps) {
  if (!media.length) return null;
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 lg:w-[88px] lg:flex-col lg:overflow-x-visible lg:overflow-y-auto lg:max-h-[820px] lg:pb-0">
      {media.map((item, i) => (
        <button
          key={item.src + i}
          type="button"
          onClick={() => onSelect(i)}
          aria-label={item.label}
          title={item.label}
          className={`relative h-[68px] w-[68px] shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-300 lg:h-[76px] lg:w-[76px] ${
            activeIndex === i
              ? "border-gold luxury-shadow ring-2 ring-gold/30"
              : "border-transparent opacity-65 hover:opacity-100 hover:border-sand"
          }`}
        >
          {item.type === "video" ? (
            <>
              {item.poster ? (
                <Image src={item.poster} alt="" fill className="object-cover" sizes="76px" />
              ) : (
                <div className="absolute inset-0 bg-brown-dark" />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-brown-dark/35">
                <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7L8 5z" />
                </svg>
              </div>
            </>
          ) : (
            <Image
              src={resolveProductMediaSrc(item.src)}
              alt=""
              fill
              className="object-cover"
              sizes="76px"
              unoptimized
            />
          )}
        </button>
      ))}
    </div>
  );
}
