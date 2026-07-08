import catalogData from "@/data/catalog.json";
import { TEST_BAG_PRODUCTS } from "./test-product";
import {
  fetchCatalogFromDb,
  fetchCategoryFromDb,
  fetchProductFromDb,
  fetchProductsByCategoryFromDb,
  fetchSiteSettings,
  type SiteSettingsData,
} from "./catalog-db";
import { resolveProductMediaSrc } from "./product-media-storage";
import { isDatabaseConfigured } from "./prisma";
import { normalizeProductId } from "./product-id";
import type { Catalog, Product, Category, ProductMedia } from "./types";

export type { SiteSettingsData };

type RawProduct = Product & { images?: string[] };

function normalizeProduct(raw: RawProduct): Product {
  let media: ProductMedia[] = raw.media ?? [];

  if (!media.length && raw.images?.length) {
    media = raw.images.map((src, i) => ({
      type: "image" as const,
      src,
      label: "View " + (i + 1),
    }));
  }

  return {
    ...raw,
    media: media.map((item) => ({
      ...item,
      src: resolveProductMediaSrc(item.src),
      poster: item.poster ? resolveProductMediaSrc(item.poster) : undefined,
    })),
    colorVariants: raw.colorVariants ?? [],
    colors: raw.colors ?? [],
    sizes: raw.sizes ?? ["One Size"],
  };
}

const baseCatalog = catalogData as Catalog;
const baseProducts = baseCatalog.products.map(normalizeProduct);

const missingTestProducts = TEST_BAG_PRODUCTS.filter(
  (test) =>
    !baseProducts.some(
      (p) => p.category === test.category && normalizeProductId(p.id) === normalizeProductId(test.id)
    )
);

const jsonCatalog: Catalog = {
  ...baseCatalog,
  products: [...baseProducts, ...missingTestProducts],
};

function mergeTestProducts(catalog: Catalog): Catalog {
  const missing = TEST_BAG_PRODUCTS.filter(
    (test) =>
      !catalog.products.some(
        (p) => p.category === test.category && normalizeProductId(p.id) === normalizeProductId(test.id)
      )
  );
  if (!missing.length) return catalog;
  return { ...catalog, products: [...catalog.products, ...missing] };
}

async function withDbFallback<T>(label: string, query: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await query();
  } catch (error) {
    console.error(`Database unavailable during ${label}, using fallback:`, error);
    return fallback;
  }
}

async function resolveCatalog(): Promise<Catalog> {
  if (isDatabaseConfigured()) {
    const dbCatalog = await withDbFallback("catalog load", fetchCatalogFromDb, null);
    if (dbCatalog) return mergeTestProducts(dbCatalog);
  }
  return jsonCatalog;
}

export async function getCatalog(): Promise<Catalog> {
  return resolveCatalog();
}

export async function getCategories(): Promise<Category[]> {
  const catalog = await resolveCatalog();
  return catalog.categories;
}

export async function getCategory(slug: string): Promise<Category | undefined> {
  if (isDatabaseConfigured()) {
    const cat = await withDbFallback(
      `category ${slug}`,
      () => fetchCategoryFromDb(slug),
      undefined
    );
    if (cat) return cat;
  }
  return jsonCatalog.categories.find((c) => c.slug === slug);
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  if (isDatabaseConfigured()) {
    const products = await withDbFallback(
      `products in ${categorySlug}`,
      () => fetchProductsByCategoryFromDb(categorySlug),
      []
    );
    if (products.length) return products;
  }
  return jsonCatalog.products.filter((p) => p.category === categorySlug);
}

export async function getProduct(
  categorySlug: string,
  id: string
): Promise<Product | undefined> {
  if (isDatabaseConfigured()) {
    const product = await withDbFallback(
      `product ${categorySlug}/${id}`,
      () => fetchProductFromDb(categorySlug, id),
      undefined
    );
    if (product) return product;
  }
  return jsonCatalog.products.find(
    (p) => p.category === categorySlug && normalizeProductId(p.id) === normalizeProductId(id)
  );
}

export async function getSiteSettings(): Promise<SiteSettingsData> {
  if (isDatabaseConfigured()) {
    return withDbFallback("site settings", fetchSiteSettings, {
      email: "hello@zrochet.com",
      phone: "+91 98765 43210",
      address: "123 Artisan Lane, India",
      footerText:
        "Handcrafted crochet creations made with love, patience, and a touch of magic.",
      heroImage: "/images/welcome.png",
      upiId: process.env.NEXT_PUBLIC_UPI_ID?.trim() || "sarathbhushan04@oksbi",
      upiPayeeName: process.env.NEXT_PUBLIC_UPI_PAYEE_NAME?.trim() || "Zrochet",
      instagramUrl: "https://www.instagram.com/zrochet_12?igsh=MWcwOTQzZzhrajh6",
    });
  }
  return {
    email: "hello@zrochet.com",
    phone: "+91 98765 43210",
    address: "123 Artisan Lane, India",
    footerText:
      "Handcrafted crochet creations made with love, patience, and a touch of magic.",
    heroImage: "/images/welcome.png",
    upiId: process.env.NEXT_PUBLIC_UPI_ID?.trim() || "sarathbhushan04@oksbi",
    upiPayeeName: process.env.NEXT_PUBLIC_UPI_PAYEE_NAME?.trim() || "Zrochet",
    instagramUrl: "https://www.instagram.com/zrochet_12?igsh=MWcwOTQzZzhrajh6",
  };
}

export function getCoverImage(product: Product): string {
  const media = product.media ?? [];
  const image = media.find((m) => m.type === "image");
  const src = image?.src || media[0]?.poster || media[0]?.src || "/images/placeholder.png";
  return resolveProductMediaSrc(src);
}

export function getMediaCount(product: Product): number {
  return product.media?.length ?? 0;
}

export function formatPrice(product: Product): string {
  if (product.currency === "INR") {
    return "₹" + product.price.toLocaleString("en-IN");
  }
  return "$" + product.price.toFixed(2);
}

export function formatOriginalPrice(product: Product): string | null {
  if (!product.originalPrice || product.originalPrice <= product.price) return null;
  if (product.currency === "INR") {
    return "₹" + product.originalPrice.toLocaleString("en-IN");
  }
  return "$" + product.originalPrice.toFixed(2);
}

export { getSampleReviewsForProduct, SAMPLE_REVIEWS } from "./sample-reviews";
