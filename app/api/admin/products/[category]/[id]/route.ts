import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  removeProductFromColorGroups,
  syncProductColorVariants,
} from "@/lib/color-variants";
import { normalizeProductHighlights } from "@/lib/product-highlights";
import { renumberProductsAfterDelete, resolveStoredProductId } from "@/lib/product-id";
import { validatePersistableMedia } from "@/lib/product-media-storage";
import { productStockFields } from "@/lib/product-stock";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ category: string; id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { category, id } = await params;
  const productId = await resolveStoredProductId(category, id);
  if (!productId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const product = await prisma.product.findUnique({
    where: {
      categorySlug_productId: { categorySlug: category, productId },
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ product });
}

export async function PUT(request: Request, { params }: RouteParams) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { category, id } = await params;
  const productId = await resolveStoredProductId(category, id);
  if (!productId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const body = await request.json();

  if (!body.colorName?.trim()) {
    return NextResponse.json({ error: "Color name is required" }, { status: 400 });
  }

  const mediaCheck = validatePersistableMedia(body.media);
  if (!mediaCheck.ok) {
    return NextResponse.json({ error: mediaCheck.message }, { status: 400 });
  }

  const product = await prisma.product.update({
    where: {
      categorySlug_productId: { categorySlug: category, productId },
    },
    data: {
      name: body.name,
      price: body.price,
      originalPrice: body.originalPrice,
      discountPercent: body.discountPercent ?? 0,
      description: body.description,
      material: body.material,
      dimensions: body.dimensions,
      ...productStockFields(body.quantity),
      media: mediaCheck.media as unknown as import("@prisma/client").Prisma.InputJsonValue,
      colors: [body.colorName.trim()],
      sizes: (Array.isArray(body.sizes) && body.sizes.length
        ? body.sizes.map(String)
        : ["One Size"]) as unknown as import("@prisma/client").Prisma.InputJsonValue,
      highlights: normalizeProductHighlights(
        body.highlights
      ) as unknown as import("@prisma/client").Prisma.InputJsonValue,
    },
  });

  await syncProductColorVariants({
    categorySlug: category,
    productId: product.productId,
    colorName: body.colorName,
    colorSwatch: body.colorSwatch,
    linkToProductId: body.standalone ? null : body.linkToProductId || null,
    standalone: Boolean(body.standalone),
  });

  const updated = await prisma.product.findUnique({
    where: {
      categorySlug_productId: { categorySlug: category, productId },
    },
  });

  return NextResponse.json({ product: updated });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { category, id } = await params;
  const productId = await resolveStoredProductId(category, id);
  if (!productId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await removeProductFromColorGroups(category, productId);
  await prisma.product.delete({
    where: {
      categorySlug_productId: { categorySlug: category, productId },
    },
  });
  await renumberProductsAfterDelete(category);

  return NextResponse.json({ ok: true });
}
