import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeProductId } from "@/lib/product-id";
import type { CartItem } from "@/lib/cart";

type Tx = Prisma.TransactionClient;

export function inStockFromQuantity(quantity: number): boolean {
  return quantity > 0;
}

export function normalizeQuantity(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.floor(parsed));
}

export function productStockFields(quantity: number) {
  const normalized = normalizeQuantity(quantity);
  return {
    quantity: normalized,
    inStock: inStockFromQuantity(normalized),
  };
}

async function findProductStock(
  tx: Tx,
  categorySlug: string,
  productId: string
) {
  const target = normalizeProductId(productId);
  const products = await tx.product.findMany({
    where: { categorySlug },
    select: { productId: true, name: true, quantity: true, inStock: true },
  });
  return products.find((product) => normalizeProductId(product.productId) === target) ?? null;
}

export async function validateOrderStock(
  items: CartItem[]
): Promise<{ ok: true } | { ok: false; message: string }> {
  for (const item of items) {
    const product = await findProductStock(prisma, item.category, item.id);
    if (!product) {
      return { ok: false, message: `${item.name} is no longer available.` };
    }
    if (!product.inStock || product.quantity <= 0) {
      return { ok: false, message: `${product.name} is out of stock.` };
    }
    if (item.quantity > product.quantity) {
      return {
        ok: false,
        message: `Only ${product.quantity} of ${product.name} left in stock.`,
      };
    }
  }

  return { ok: true };
}

export async function deductStockForOrder(items: CartItem[]): Promise<void> {
  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      const product = await findProductStock(tx, item.category, item.id);
      if (!product) continue;

      const nextQuantity = Math.max(0, product.quantity - item.quantity);
      await tx.product.update({
        where: {
          categorySlug_productId: {
            categorySlug: item.category,
            productId: product.productId,
          },
        },
        data: productStockFields(nextQuantity),
      });
    }
  });
}
