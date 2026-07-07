"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { ProductMedia } from "@/lib/types";

interface MainProductMediaProps {
  item: ProductMedia;
  alt: string;
  index: number;
  total: number;
  videoPlayToken?: number;
}

export default function MainProductMedia({
  item,
  alt,
  index,
  total,
  videoPlayToken = 0,
}: MainProductMediaProps) {
  const [zooming, setZooming] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const mainRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (item.type !== "video") return;

    const video = videoRef.current;
    if (!video) return;

    void video.play().catch(() => {
      // Some browsers block autoplay until the user interacts with the video directly.
    });

    return () => {
      video.pause();
      video.currentTime = 0;
    };
  }, [item.src, item.type, index, videoPlayToken]);

  function handleVideoClick() {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      void video.play();
    }
  }

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
        className="relative w-full overflow-hidden rounded-2xl bg-cream luxury-shadow-lg"
        onMouseEnter={() => item.type === "image" && setZooming(true)}
        onMouseLeave={() => setZooming(false)}
        onMouseMove={handleMouseMove}
      >
        {item.type === "video" ? (
          <video
            ref={videoRef}
            src={item.src}
            poster={item.poster}
            controls
            playsInline
            className="h-auto w-full cursor-pointer"
            aria-label={alt}
            onClick={handleVideoClick}
          >
            Your browser does not support video playback.
          </video>
        ) : (
          <Image
            src={item.src}
            alt={alt}
            width={900}
            height={1200}
            priority={index === 0}
            className={`h-auto w-full transition-transform duration-300 ease-out ${
              zooming ? "scale-[2]" : "scale-100"
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
          ? "Tap the video or select it from thumbnails to play"
          : "Hover to zoom for detailed viewing"}
      </p>
    </div>
  );
}
