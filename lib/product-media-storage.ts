import path from "path";

const PRODUCT_UPLOADS_DIR = path.join(process.cwd(), "public", "uploads", "products");

export function getProductUploadsDir(): string {
  return PRODUCT_UPLOADS_DIR;
}

/** URL-safe filename for admin uploads (no spaces or parentheses). */
export function buildProductUploadFilename(
  productId: string,
  index: number,
  ext: string
): string {
  const safeId = productId.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const safeExt = ext.replace(/^\./, "").toLowerCase();
  return `${safeId || "product"}-upload-${index}.${safeExt}`;
}

export function productMediaPublicPath(filename: string): string {
  return `/api/media/products/${encodeURIComponent(filename)}`;
}

export function mimeForProductUpload(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".mp4":
      return "video/mp4";
    default:
      return "image/jpeg";
  }
}

export function resolveProductUploadFilePath(filename: string): string {
  const safeName = path.basename(decodeURIComponent(filename));
  return path.join(PRODUCT_UPLOADS_DIR, safeName);
}

export function legacyProductUploadFilePath(filename: string): string {
  const safeName = path.basename(decodeURIComponent(filename));
  return path.join(process.cwd(), "public", "images", safeName);
}

/** Resolve a stored media src to a fetchable URL (handles legacy /images paths). */
export function resolveProductMediaSrc(src: string): string {
  if (!src) return src;
  if (src.startsWith("/api/media/products/")) return src;
  if (src.startsWith("/uploads/products/")) {
    const filename = src.replace("/uploads/products/", "");
    return productMediaPublicPath(filename);
  }
  if (src.startsWith("/images/")) {
    const filename = decodeURIComponent(src.slice("/images/".length));
    if (filename.includes("_upload")) {
      return productMediaPublicPath(filename);
    }
    return src;
  }
  return src;
}
