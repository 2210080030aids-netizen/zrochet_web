/**
 * Deletes all orders and restores stock for placed orders that still hold reservations.
 * Usage: node scripts/clear-orders.js
 */

require("./resolve-db-url").resolveDatabaseUrl();

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const STOCK_HELD_STATUSES = new Set(["payment_submitted", "approved"]);

function normalizeProductId(productId) {
  return String(productId || "").trim().toLowerCase();
}

function normalizeQuantity(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.floor(parsed));
}

function inStockFromQuantity(quantity) {
  return quantity > 0;
}

async function findProduct(tx, categorySlug, productId) {
  const target = normalizeProductId(productId);
  const products = await tx.product.findMany({
    where: { categorySlug },
    select: { productId: true, quantity: true },
  });
  return products.find((p) => normalizeProductId(p.productId) === target) ?? null;
}

async function restoreStockForOrderItems(items) {
  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      const product = await findProduct(tx, item.category, item.id);
      if (!product) continue;
      const nextQuantity = product.quantity + Math.max(0, Number(item.quantity) || 0);
      await tx.product.update({
        where: {
          categorySlug_productId: {
            categorySlug: item.category,
            productId: product.productId,
          },
        },
        data: {
          quantity: nextQuantity,
          inStock: inStockFromQuantity(nextQuantity),
        },
      });
    }
  });
}

async function main() {
  const orders = await prisma.order.findMany({
    select: { id: true, status: true, items: true },
    orderBy: { createdAt: "desc" },
  });

  console.log(`Found ${orders.length} order(s).`);

  for (const order of orders) {
    if (STOCK_HELD_STATUSES.has(order.status)) {
      const items = Array.isArray(order.items) ? order.items : [];
      await restoreStockForOrderItems(items);
      console.log(`Restored stock for ${order.id} (${order.status})`);
    }
  }

  const result = await prisma.order.deleteMany({});
  console.log(`Deleted ${result.count} order(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
