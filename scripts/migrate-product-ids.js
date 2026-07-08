/**
 * Migrates legacy B1-style product IDs to prefixed IDs (mb1, pb1, …).
 * Usage: npm run db:migrate-product-ids
 */

require("./resolve-db-url").resolveDatabaseUrl();

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const CATEGORY_ID_PREFIX = {
  "mini-bags": "mb",
  "party-bags": "pb",
  "oreo-bags": "ob",
  "side-bags": "sb",
  "handle-bags": "hb",
};

function normalizeProductId(productId) {
  return productId.trim().toLowerCase();
}

function formatProductId(categorySlug, sequence) {
  return `${CATEGORY_ID_PREFIX[categorySlug]}${sequence}`;
}

function parseProductIdSuffix(productId, categorySlug) {
  const normalized = normalizeProductId(productId);
  const prefix = CATEGORY_ID_PREFIX[categorySlug];
  if (prefix && normalized.startsWith(prefix)) {
    const num = Number.parseInt(normalized.slice(prefix.length), 10);
    return Number.isFinite(num) && num > 0 ? num : null;
  }
  const legacy = normalized.match(/^b(\d+)$/);
  if (legacy) {
    const num = Number.parseInt(legacy[1], 10);
    return Number.isFinite(num) && num > 0 ? num : null;
  }
  const prefixed = normalized.match(/^[a-z]+(\d+)$/);
  if (prefixed) {
    const num = Number.parseInt(prefixed[1], 10);
    return Number.isFinite(num) && num > 0 ? num : null;
  }
  return null;
}

function sortProductIds(productIds, categorySlug) {
  return [...productIds].sort((a, b) => {
    const sa = parseProductIdSuffix(a, categorySlug) ?? Number.MAX_SAFE_INTEGER;
    const sb = parseProductIdSuffix(b, categorySlug) ?? Number.MAX_SAFE_INTEGER;
    if (sa !== sb) return sa - sb;
    return normalizeProductId(a).localeCompare(normalizeProductId(b));
  });
}

function parseColorVariants(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item) =>
      item &&
      typeof item === "object" &&
      "name" in item &&
      "swatch" in item &&
      "productId" in item
  );
}

function remapColorVariantsJson(value, fromId, toId) {
  const from = normalizeProductId(fromId);
  const to = normalizeProductId(toId);
  return parseColorVariants(value).map((variant) => ({
    name: variant.name,
    swatch: variant.swatch,
    productId:
      normalizeProductId(variant.productId) === from
        ? to
        : normalizeProductId(variant.productId),
  }));
}

async function remapColorVariantReferencesInCategory(tx, categorySlug, fromId, toId) {
  const from = normalizeProductId(fromId);
  const to = normalizeProductId(toId);
  const products = await tx.product.findMany({
    where: { categorySlug },
    select: { productId: true, colorVariants: true },
  });

  for (const product of products) {
    const variants = parseColorVariants(product.colorVariants);
    const needsUpdate = variants.some(
      (variant) => normalizeProductId(variant.productId) === from
    );
    if (!needsUpdate) continue;

    await tx.product.update({
      where: {
        categorySlug_productId: {
          categorySlug,
          productId: product.productId,
        },
      },
      data: {
        colorVariants: remapColorVariantsJson(product.colorVariants, from, to),
      },
    });
  }
}

async function findProductInCategory(tx, categorySlug, productId) {
  const target = normalizeProductId(productId);
  const products = await tx.product.findMany({
    where: { categorySlug },
    include: { reviews: true },
  });
  return products.find((product) => normalizeProductId(product.productId) === target) ?? null;
}

async function productIdExistsInCategory(tx, categorySlug, productId) {
  const target = normalizeProductId(productId);
  const products = await tx.product.findMany({
    where: { categorySlug },
    select: { productId: true },
  });
  return products.some((product) => normalizeProductId(product.productId) === target);
}

async function renameProductIdInCategory(tx, categorySlug, fromId, toId) {
  const from = normalizeProductId(fromId);
  const to = normalizeProductId(toId);
  if (from === to) return;

  const existing = await findProductInCategory(tx, categorySlug, fromId);
  if (!existing) return;

  if (await productIdExistsInCategory(tx, categorySlug, to)) {
    throw new Error(`Cannot rename ${from} to ${to}: target already exists`);
  }

  const storedFromId = existing.productId;
  const { reviews, collection: _collection, createdAt: _c, updatedAt: _u, ...productData } =
    existing;

  await tx.product.create({
    data: {
      productId: to,
      categorySlug: productData.categorySlug,
      name: productData.name,
      price: productData.price,
      originalPrice: productData.originalPrice,
      discountPercent: productData.discountPercent,
      currency: productData.currency,
      description: productData.description,
      material: productData.material,
      dimensions: productData.dimensions,
      care: productData.care,
      colors: productData.colors,
      colorVariants: remapColorVariantsJson(productData.colorVariants, from, to),
      sizes: productData.sizes,
      rating: productData.rating,
      reviewCount: productData.reviewCount,
      inStock: productData.inStock,
      deliveryDays: productData.deliveryDays,
      media: productData.media,
    },
  });

  if (reviews.length) {
    await tx.productReview.updateMany({
      where: { categorySlug, productId: storedFromId },
      data: { productId: to },
    });
  }

  await tx.product.delete({
    where: { categorySlug_productId: { categorySlug, productId: storedFromId } },
  });

  await remapColorVariantReferencesInCategory(tx, categorySlug, from, to);
}

async function migrateLegacyProductIds() {
  const collections = await prisma.collection.findMany({ select: { slug: true } });

  for (const { slug } of collections) {
    if (!CATEGORY_ID_PREFIX[slug]) continue;

    const products = await prisma.product.findMany({
      where: { categorySlug: slug },
      select: { productId: true },
    });
    if (!products.length) continue;

    const sorted = sortProductIds(
      products.map((product) => product.productId),
      slug
    );

    const renames = [];
    for (let i = 0; i < sorted.length; i++) {
      const desired = formatProductId(slug, i + 1);
      const storedId = sorted[i];
      if (normalizeProductId(storedId) !== desired) {
        renames.push({ from: storedId, to: desired });
      }
    }

    renames.sort((a, b) => {
      const sa = parseProductIdSuffix(a.from, slug) ?? 0;
      const sb = parseProductIdSuffix(b.from, slug) ?? 0;
      return sb - sa;
    });

    for (const { from, to } of renames) {
      await prisma.$transaction(async (tx) => {
        await renameProductIdInCategory(tx, slug, from, to);
      });
    }

    console.log(`Migrated ${slug}`);
  }
}

async function main() {
  const dbUrl = require("./resolve-db-url").getDatabaseUrl();
  if (!dbUrl) {
    console.error("DATABASE_URL is not set or invalid.");
    process.exit(1);
  }

  console.log("Migrating product IDs to collection prefixes...");
  await migrateLegacyProductIds();
  console.log("Done.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
