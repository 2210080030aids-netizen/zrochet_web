import { prisma } from "@/lib/prisma";
import { normalizeProductId, resolveStoredProductId } from "@/lib/product-id";
import { resolveProductMediaSrc } from "@/lib/product-media-storage";
import type {
  Catalog,
  Category,
  ColorVariant,
  Product,
  ProductMedia,
} from "@/lib/types";

function parseJsonArray<T>(value: unknown, fallback: T[]): T[] {
  if (Array.isArray(value)) return value as T[];
  return fallback;
}

function mapProduct(row: {
  productId: string;
  categorySlug: string;
  name: string;
  price: number;
  originalPrice: number | null;
  discountPercent: number;
  currency: string;
  description: string;
  material: string;
  dimensions: string;
  care: string;
  colors: unknown;
  colorVariants: unknown;
  sizes: unknown;
  rating: number;
  reviewCount: number;
  quantity: number;
  inStock: boolean;
  deliveryDays: string;
  media: unknown;
  collection: { label: string };
}): Product {
  return {
    id: row.productId,
    category: row.categorySlug,
    collection: row.collection.label,
    name: row.name,
    price: row.price,
    originalPrice: row.originalPrice,
    discountPercent: row.discountPercent,
    currency: row.currency,
    description: row.description,
    material: row.material,
    dimensions: row.dimensions,
    care: row.care,
    colors: parseJsonArray<string>(row.colors, []),
    colorVariants: parseJsonArray<ColorVariant>(row.colorVariants, []),
    sizes: parseJsonArray<string>(row.sizes, ["One Size"]),
    rating: row.rating,
    reviewCount: row.reviewCount,
    quantity: row.quantity,
    inStock: row.inStock,
    deliveryDays: row.deliveryDays,
    media: parseJsonArray<ProductMedia>(row.media, []).map((item) => ({
      ...item,
      src: resolveProductMediaSrc(item.src),
      poster: item.poster ? resolveProductMediaSrc(item.poster) : undefined,
    })),
  };
}

export async function fetchCatalogFromDb(): Promise<Catalog | null> {
  try {
    const [collections, products] = await Promise.all([
      prisma.collection.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.product.findMany({
        include: { collection: true },
        orderBy: [{ categorySlug: "asc" }, { productId: "asc" }],
      }),
    ]);

    if (!collections.length) return null;

    return {
      generatedAt: new Date().toISOString(),
      categories: collections.map((c) => ({
        slug: c.slug,
        name: c.name,
        label: c.label,
        defaultPrice: c.defaultPrice,
      })),
      products: products.map(mapProduct),
    };
  } catch (error) {
    console.error("Failed to fetch catalog from database:", error);
    return null;
  }
}

export async function fetchCategoryFromDb(slug: string): Promise<Category | undefined> {
  const row = await prisma.collection.findUnique({ where: { slug } });
  if (!row) return undefined;
  return { slug: row.slug, name: row.name, label: row.label, defaultPrice: row.defaultPrice };
}

export async function fetchProductsByCategoryFromDb(categorySlug: string): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { categorySlug },
    include: { collection: true },
    orderBy: { productId: "asc" },
  });
  return rows.map(mapProduct);
}

export async function fetchProductFromDb(
  categorySlug: string,
  id: string
): Promise<Product | undefined> {
  const storedId = await resolveStoredProductId(categorySlug, id);
  if (!storedId) return undefined;

  const row = await prisma.product.findUnique({
    where: {
      categorySlug_productId: { categorySlug, productId: storedId },
    },
    include: { collection: true },
  });
  return row ? mapProduct(row) : undefined;
}

export interface SiteSettingsData {
  email: string;
  phone: string;
  address: string;
  footerText: string;
  heroImage: string;
  upiId: string;
  upiPayeeName: string;
  instagramUrl: string;
}

const DEFAULT_SETTINGS: SiteSettingsData = {
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

export async function fetchSiteSettings(): Promise<SiteSettingsData> {
  try {
    const row = await prisma.siteSettings.findUnique({ where: { id: 1 } });
    if (!row) return DEFAULT_SETTINGS;
    return {
      email: row.email,
      phone: row.phone,
      address: row.address,
      footerText: row.footerText,
      heroImage: row.heroImage,
      upiId: row.upiId,
      upiPayeeName: row.upiPayeeName,
      instagramUrl: row.instagramUrl || DEFAULT_SETTINGS.instagramUrl,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}
