import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeProductId } from "@/lib/product-id";
import type { ColorVariant } from "@/lib/types";

export { normalizeProductId };

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function parseColorVariants(value: unknown): ColorVariant[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is ColorVariant =>
      Boolean(item) &&
      typeof item === "object" &&
      "name" in item &&
      "swatch" in item &&
      "productId" in item
  );
}

export function buildColorVariant(
  name: string,
  swatch: string,
  productId: string
): ColorVariant {
  return {
    name: name.trim(),
    swatch: swatch.trim(),
    productId: normalizeProductId(productId),
  };
}

function dedupeVariants(variants: ColorVariant[]): ColorVariant[] {
  const byId = new Map<string, ColorVariant>();
  for (const variant of variants) {
    byId.set(normalizeProductId(variant.productId), {
      name: variant.name,
      swatch: variant.swatch,
      productId: normalizeProductId(variant.productId),
    });
  }
  return Array.from(byId.values());
}

function parseColorName(colors: unknown): string | null {
  if (!Array.isArray(colors)) return null;
  const first = colors.find((value) => typeof value === "string");
  return typeof first === "string" ? first : null;
}

/** Collect every bag in the same colour-switch group within a collection. */
export async function collectLinkedVariantGroup(
  categorySlug: string,
  seedProductId: string
): Promise<ColorVariant[]> {
  const allProducts = await prisma.product.findMany({
    where: { categorySlug },
    select: { productId: true, colors: true, colorVariants: true },
  });

  const seedId = normalizeProductId(seedProductId);
  const memberIds = new Set<string>([seedId]);

  let expanded = true;
  while (expanded) {
    expanded = false;

    for (const product of allProducts) {
      const productId = normalizeProductId(product.productId);
      const variants = parseColorVariants(product.colorVariants);
      const touchesGroup =
        memberIds.has(productId) ||
        variants.some((variant) => memberIds.has(normalizeProductId(variant.productId)));

      if (!touchesGroup) continue;

      if (!memberIds.has(productId)) {
        memberIds.add(productId);
        expanded = true;
      }

      for (const variant of variants) {
        const variantId = normalizeProductId(variant.productId);
        if (!memberIds.has(variantId)) {
          memberIds.add(variantId);
          expanded = true;
        }
      }
    }
  }

  const variantById = new Map<string, ColorVariant>();

  for (const product of allProducts) {
    const productId = normalizeProductId(product.productId);
    if (!memberIds.has(productId)) continue;

    for (const variant of parseColorVariants(product.colorVariants)) {
      const variantId = normalizeProductId(variant.productId);
      if (!memberIds.has(variantId)) continue;
      variantById.set(variantId, {
        name: variant.name,
        swatch: variant.swatch,
        productId: variantId,
      });
    }
  }

  for (const product of allProducts) {
    const productId = normalizeProductId(product.productId);
    if (!memberIds.has(productId) || variantById.has(productId)) continue;

    const colorName = parseColorName(product.colors) ?? productId;
    variantById.set(productId, buildColorVariant(colorName, "#C4A484", productId));
  }

  return dedupeVariants(Array.from(variantById.values()));
}

export async function applyColorVariantGroup(
  categorySlug: string,
  variants: ColorVariant[]
): Promise<void> {
  const group = dedupeVariants(variants);
  if (!group.length) return;

  await Promise.all(
    group.map((variant) =>
      prisma.product.update({
        where: {
          categorySlug_productId: {
            categorySlug,
            productId: variant.productId,
          },
        },
        data: {
          colors: toJsonValue([variant.name]),
          colorVariants: toJsonValue(group),
        },
      })
    )
  );
}

async function findVariantSeedInCollection(
  categorySlug: string,
  excludeProductId: string
): Promise<string | null> {
  const products = await prisma.product.findMany({
    where: { categorySlug },
    select: { productId: true, colorVariants: true },
  });

  const candidates = products
    .filter((product) => normalizeProductId(product.productId) !== excludeProductId)
    .map((product) => ({
      productId: normalizeProductId(product.productId),
      count: parseColorVariants(product.colorVariants).length,
    }))
    .sort((a, b) => b.count - a.count);

  return candidates[0]?.productId ?? null;
}

export async function syncProductColorVariants(options: {
  categorySlug: string;
  productId: string;
  colorName: string;
  colorSwatch: string;
  linkToProductId?: string | null;
  standalone?: boolean;
}): Promise<ColorVariant[]> {
  const productId = normalizeProductId(options.productId);
  const colorName = options.colorName.trim();
  const colorSwatch = options.colorSwatch.trim() || "#C4A484";
  const self = buildColorVariant(colorName, colorSwatch, productId);

  if (options.standalone) {
    await applyColorVariantGroup(options.categorySlug, [self]);
    return [self];
  }

  const seedProductId =
    options.linkToProductId ||
    (await findVariantSeedInCollection(options.categorySlug, productId));

  if (!seedProductId) {
    await applyColorVariantGroup(options.categorySlug, [self]);
    return [self];
  }

  const existing = await collectLinkedVariantGroup(options.categorySlug, seedProductId);
  const merged = dedupeVariants([
    ...existing.filter((variant) => variant.productId !== productId),
    self,
  ]);

  await applyColorVariantGroup(options.categorySlug, merged);
  return merged;
}

export async function removeProductFromColorGroups(
  categorySlug: string,
  productId: string
): Promise<void> {
  const id = normalizeProductId(productId);
  const product = await prisma.product.findUnique({
    where: { categorySlug_productId: { categorySlug, productId: id } },
  });

  if (!product) return;

  const remaining = parseColorVariants(product.colorVariants).filter(
    (variant) => variant.productId !== id
  );

  await applyColorVariantGroup(categorySlug, remaining);
}

export function getProductColorFields(product: {
  colors: unknown;
  colorVariants: unknown;
  productId: string;
}): { colorName: string; colorSwatch: string; linkToProductId: string } {
  const variants = parseColorVariants(product.colorVariants);
  const self =
    variants.find((variant) => variant.productId === normalizeProductId(product.productId)) ??
    variants[0];

  const colors = Array.isArray(product.colors)
    ? product.colors.filter((value): value is string => typeof value === "string")
    : [];

  const linkToProductId =
    variants.find((variant) => variant.productId !== normalizeProductId(product.productId))
      ?.productId ?? "";

  return {
    colorName: self?.name ?? colors[0] ?? "",
    colorSwatch: self?.swatch ?? "#C4A484",
    linkToProductId,
  };
}
