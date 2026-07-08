/**
 * Seeds PostgreSQL from data/catalog.json (run once after deploy).
 * Usage: npm run db:seed
 */

require("./resolve-db-url").resolveDatabaseUrl();

const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const ROOT = path.join(__dirname, "..");
const CATALOG_PATH = path.join(ROOT, "data", "catalog.json");

const COLLECTION_PATTERNS = {
  "mini-bags": "minibag",
  "party-bags": "partybag",
  "oreo-bags": "oreo",
  "side-bags": "side",
  "handle-bags": "handle",
};

async function main() {
  const dbUrl = require("./resolve-db-url").getDatabaseUrl();
  if (!dbUrl) {
    console.error(
      "DATABASE_URL is not set or invalid. Use Railway PUBLIC URL in .env.local for local dev."
    );
    process.exit(1);
  }

  const existingProducts = await prisma.product.count();
  if (existingProducts > 0) {
    console.log(
      `Database already has ${existingProducts} product(s). Skipping seed.`
    );
    return;
  }

  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));

  console.log("Seeding collections...");
  for (let i = 0; i < catalog.categories.length; i++) {
    const cat = catalog.categories[i];
    await prisma.collection.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        label: cat.label,
        pattern: COLLECTION_PATTERNS[cat.slug] || null,
        sortOrder: i,
      },
      create: {
        slug: cat.slug,
        name: cat.name,
        label: cat.label,
        pattern: COLLECTION_PATTERNS[cat.slug] || null,
        sortOrder: i,
        defaultPrice: 500,
      },
    });
  }

  console.log("Seeding products...");
  for (const product of catalog.products) {
    const quantity =
      typeof product.quantity === "number"
        ? Math.max(0, Math.floor(product.quantity))
        : product.inStock === false
          ? 0
          : 10;
    const inStock = quantity > 0;

    await prisma.product.upsert({
      where: {
        categorySlug_productId: {
          categorySlug: product.category,
          productId: product.id,
        },
      },
      update: {
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        discountPercent: product.discountPercent ?? 0,
        currency: product.currency ?? "INR",
        description: product.description,
        material: product.material,
        dimensions: product.dimensions,
        care: product.care,
        colors: product.colors ?? [],
        colorVariants: product.colorVariants ?? [],
        sizes: product.sizes ?? ["One Size"],
        rating: product.rating ?? 4.8,
        reviewCount: product.reviewCount ?? 24,
        quantity,
        inStock,
        deliveryDays: product.deliveryDays ?? "3–5 business days",
        media: product.media ?? [],
      },
      create: {
        productId: product.id,
        categorySlug: product.category,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        discountPercent: product.discountPercent ?? 0,
        currency: product.currency ?? "INR",
        description: product.description,
        material: product.material,
        dimensions: product.dimensions,
        care: product.care,
        colors: product.colors ?? [],
        colorVariants: product.colorVariants ?? [],
        sizes: product.sizes ?? ["One Size"],
        rating: product.rating ?? 4.8,
        reviewCount: product.reviewCount ?? 24,
        quantity,
        inStock,
        deliveryDays: product.deliveryDays ?? "3–5 business days",
        media: product.media ?? [],
      },
    });
  }

  console.log("Seeding site settings...");
  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      email: "hello@zrochet.com",
      phone: "+91 98765 43210",
      address: "123 Artisan Lane, India",
      footerText:
        "Handcrafted crochet creations made with love, patience, and a touch of magic.",
      heroImage: "/images/welcome.png",
    },
  });

  console.log("Done! Seeded", catalog.products.length, "products.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
