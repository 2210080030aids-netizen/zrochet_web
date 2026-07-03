"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { ProductMedia } from "@/lib/types";

interface MainProductMediaProps {
  item: ProductMedia;
  alt: string;
  index: number;
  total: number;
}

export default function MainProductMedia({
  item,
  alt,
  index,
  total,
}: MainProductMediaProps) {
  const [zooming, setZooming] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const mainRef = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!mainRef.current || item.type === "video") return;
    const rect = mainRef.current.getBoundingClientRect();
    setZoomPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }

  return (
    <div>
      <div
        ref={mainRef}
        className="relative aspect-[4/5] min-h-[520px] w-full overflow-hidden rounded-2xl bg-white luxury-shadow-lg sm:min-h-[620px] lg:min-h-[740px] xl:min-h-[880px]"
        onMouseEnter={() => item.type === "image" && setZooming(true)}
        onMouseLeave={() => setZooming(false)}
        onMouseMove={handleMouseMove}
      >
        {item.type === "video" ? (
          <video
            src={item.src}
            poster={item.poster}
            controls
            playsInline
            className="h-full w-full object-cover"
            aria-label={alt}
          >
            Your browser does not support video playback.
          </video>
        ) : (
          <Image
            src={item.src}
            alt={alt}
            fill
            priority={index === 0}
            className={`object-cover transition-transform duration-300 ease-out ${
              zooming ? "scale-[3]" : "scale-100"
            }`}
            style={
              zooming ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : undefined
            }
            sizes="(max-width: 1280px) 100vw, 55vw"
          />
        )}
        <div className="absolute bottom-4 left-4 rounded-full bg-brown-dark/80 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
          {item.label}
        </div>
        {total > 1 && (
          <div className="absolute bottom-4 right-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-brown-dark shadow-sm">
            {index + 1} / {total}
          </div>
        )}
      </div>
      <p className="mt-3 text-center text-xs text-text-muted">
        {item.type === "video"
          ? "Watch the product video"
          : "Hover to zoom for detailed viewing"}
      </p>
    </div>
  );
}
