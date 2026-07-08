import Image from "next/image";
import { resolveProductMediaSrc } from "@/lib/product-media-storage";

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}

/** Renders product media — uses native img for API-hosted uploads, Next Image for static /images. */
export default function ProductImage({
  src,
  alt,
  className,
  fill,
  sizes,
  priority,
  width,
  height,
  style,
}: ProductImageProps) {
  const resolved = resolveProductMediaSrc(src);

  if (resolved.startsWith("/api/")) {
    if (fill) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolved}
          alt={alt}
          className={`absolute inset-0 h-full w-full ${className ?? ""}`}
          style={{ ...style, objectFit: "cover" }}
        />
      );
    }

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolved}
        alt={alt}
        className={className}
        width={width}
        height={height}
        style={style}
      />
    );
  }

  if (fill) {
    return (
      <Image
        src={resolved}
        alt={alt}
        fill
        className={className}
        sizes={sizes}
        priority={priority}
        style={style}
        unoptimized
      />
    );
  }

  return (
    <Image
      src={resolved}
      alt={alt}
      width={width ?? 900}
      height={height ?? 1200}
      className={className}
      sizes={sizes}
      priority={priority}
      style={style}
      unoptimized
    />
  );
}
