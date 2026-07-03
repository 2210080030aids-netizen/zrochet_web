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
import { isDatabaseConfigured } from "./prisma";
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
    media,
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
      (p) => p.category === test.category && p.id.toUpperCase() === test.id.toUpperCase()
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
        (p) => p.category === test.category && p.id.toUpperCase() === test.id.toUpperCase()
      )
  );
  if (!missing.length) return catalog;
  return { ...catalog, products: [...catalog.products, ...missing] };
}

async function resolveCatalog(): Promise<Catalog> {
  if (isDatabaseConfigured()) {
    const dbCatalog = await fetchCatalogFromDb();
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
    const cat = await fetchCategoryFromDb(slug);
    if (cat) return cat;
  }
  return jsonCatalog.categories.find((c) => c.slug === slug);
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  if (isDatabaseConfigured()) {
    const products = await fetchProductsByCategoryFromDb(categorySlug);
    if (products.length) return products;
  }
  return jsonCatalog.products.filter((p) => p.category === categorySlug);
}

export async function getProduct(
  categorySlug: string,
  id: string
): Promise<Product | undefined> {
  if (isDatabaseConfigured()) {
    const product = await fetchProductFromDb(categorySlug, id);
    if (product) return product;
  }
  return jsonCatalog.products.find(
    (p) => p.category === categorySlug && p.id.toUpperCase() === id.toUpperCase()
  );
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const catalog = await resolveCatalog();
  return catalog.products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, limit);
}

export async function getSiteSettings(): Promise<SiteSettingsData> {
  if (isDatabaseConfigured()) {
    return fetchSiteSettings();
  }
  return {
    email: "hello@zrochet.com",
    phone: "+91 98765 43210",
    address: "123 Artisan Lane, India",
    footerText:
      "Handcrafted crochet creations made with love, patience, and a touch of magic.",
    heroImage: "/images/welcome.png",
  };
}

export function getCoverImage(product: Product): string {
  const media = product.media ?? [];
  const image = media.find((m) => m.type === "image");
  return image?.src || media[0]?.poster || media[0]?.src || "/images/placeholder.png";
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

export const SAMPLE_REVIEWS = [
  {
    id: "1",
    author: "Priya M.",
    rating: 5,
    date: "March 2026",
    title: "Absolutely stunning craftsmanship",
    body: "The quality exceeded my expectations. Every stitch is perfect and the bag gets compliments everywhere I go.",
    verified: true,
  },
  {
    id: "2",
    author: "Ananya R.",
    rating: 5,
    date: "February 2026",
    title: "Worth every rupee",
    body: "Beautiful handmade piece. The photos don't do justice — it's even prettier in person. Fast delivery too!",
    verified: true,
  },
  {
    id: "3",
    author: "Sarah K.",
    rating: 4,
    date: "January 2026",
    title: "Lovely bag, unique design",
    body: "Such a unique piece. Slightly smaller than I imagined but perfect for evenings out. Would buy again.",
    verified: true,
  },
];
