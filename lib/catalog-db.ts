import { prisma } from "@/lib/prisma";
import { normalizeProductHighlights } from "@/lib/product-highlights";
import { resolveStoredProductId } from "@/lib/product-id";
import { sanitizeProductMedia } from "@/lib/product-media-storage";
import { normalizeProductSizes } from "@/lib/product-sizes";
import { resolveDisplayReviewStats } from "@/lib/review-stats";
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

function reviewKey(categorySlug: string, productId: string): string {
  return `${categorySlug}::${productId}`;
}

async function fetchLiveRatingsMap(): Promise<Map<string, number[]>> {
  const map = new Map<string, number[]>();
  try {
    const rows = await prisma.$queryRaw<
      { categorySlug: string; productId: string; rating: number }[]
    >`
      SELECT "categorySlug", "productId", rating
      FROM "ProductReview"
    `;

    for (const row of rows) {
      const key = reviewKey(row.categorySlug, row.productId);
      const list = map.get(key) ?? [];
      list.push(row.rating);
      map.set(key, list);
    }
  } catch (error) {
    console.error("Failed to load review ratings:", error);
  }
  return map;
}

function mapProduct(
  row: {
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
    highlights: unknown;
    rating: number;
    reviewCount: number;
    quantity: number;
    inStock: boolean;
    deliveryDays: string;
    media: unknown;
    collection: { label: string };
  },
  liveRatings: number[] = []
): Product {
  const stats = resolveDisplayReviewStats(row.productId, liveRatings);

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
    sizes: normalizeProductSizes(row.sizes),
    highlights: normalizeProductHighlights(row.highlights),
    rating: stats.rating,
    reviewCount: stats.reviewCount,
    quantity: row.quantity,
    inStock: row.inStock,
    deliveryDays: row.deliveryDays,
    media: sanitizeProductMedia(parseJsonArray<ProductMedia>(row.media, [])),
  };
}

export async function fetchCatalogFromDb(): Promise<Catalog | null> {
  try {
    const [collections, products, liveRatings] = await Promise.all([
      prisma.collection.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.product.findMany({
        include: { collection: true },
        orderBy: [{ categorySlug: "asc" }, { productId: "asc" }],
      }),
      fetchLiveRatingsMap(),
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
      products: products.map((row) =>
        mapProduct(
          row,
          liveRatings.get(reviewKey(row.categorySlug, row.productId)) ?? []
        )
      ),
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
  const [rows, liveRatings] = await Promise.all([
    prisma.product.findMany({
      where: { categorySlug },
      include: { collection: true },
      orderBy: { productId: "asc" },
    }),
    fetchLiveRatingsMap(),
  ]);
  return rows.map((row) =>
    mapProduct(
      row,
      liveRatings.get(reviewKey(row.categorySlug, row.productId)) ?? []
    )
  );
}

export async function fetchProductFromDb(
  categorySlug: string,
  id: string
): Promise<Product | undefined> {
  const storedId = await resolveStoredProductId(categorySlug, id);
  if (!storedId) return undefined;

  const [row, liveRatings] = await Promise.all([
    prisma.product.findUnique({
      where: {
        categorySlug_productId: { categorySlug, productId: storedId },
      },
      include: { collection: true },
    }),
    fetchLiveRatingsMap(),
  ]);
  if (!row) return undefined;
  return mapProduct(
    row,
    liveRatings.get(reviewKey(row.categorySlug, row.productId)) ?? []
  );
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
  heroEyebrow: string;
  heroTitle: string;
  heroText: string;
  storyImage: string;
  storyTitle: string;
  storyText: string;
  storyPoint1: string;
  storyPoint2: string;
  storyPoint3: string;
}

/** Default content for the homepage hero section. */
export const DEFAULT_HERO = {
  heroEyebrow: "Artisan Made · One of a Kind",
  heroTitle: "Handcrafted Crochet Creations",
  heroText:
    "Discover beautifully handmade crochet bags, purses, and thoughtful gifts — each piece woven with care, warmth, and timeless charm.",
} as const;

/** Default content for the homepage "Our Story" section. */
export const DEFAULT_STORY = {
  storyImage: "",
  storyTitle: "The Heart of Zrochet",
  storyText:
    "Zrochet began with a simple belief: that everyday objects deserve the warmth of human hands. What started as a quiet hobby at the kitchen table has blossomed into a boutique studio dedicated to slow, intentional craftsmanship.\n\nEvery stitch is placed with purpose. We source soft, premium yarns in earthy tones and transform them into bags, purses, and gifts that carry a piece of our story — and soon, a piece of yours.",
  storyPoint1: "100% handmade, never mass-produced",
  storyPoint2: "Eco-conscious yarn & packaging",
  storyPoint3: "Custom orders welcome",
} as const;

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
  ...DEFAULT_HERO,
  ...DEFAULT_STORY,
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
      heroEyebrow: row.heroEyebrow || DEFAULT_HERO.heroEyebrow,
      heroTitle: row.heroTitle || DEFAULT_HERO.heroTitle,
      heroText: row.heroText || DEFAULT_HERO.heroText,
      storyImage: row.storyImage ?? DEFAULT_STORY.storyImage,
      storyTitle: row.storyTitle || DEFAULT_STORY.storyTitle,
      storyText: row.storyText || DEFAULT_STORY.storyText,
      storyPoint1: row.storyPoint1 ?? DEFAULT_STORY.storyPoint1,
      storyPoint2: row.storyPoint2 ?? DEFAULT_STORY.storyPoint2,
      storyPoint3: row.storyPoint3 ?? DEFAULT_STORY.storyPoint3,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}
