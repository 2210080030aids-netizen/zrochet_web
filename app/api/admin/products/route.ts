import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { syncProductColorVariants } from "@/lib/color-variants";
import { normalizeProductHighlights } from "@/lib/product-highlights";
import { allocateNextProductId } from "@/lib/product-id";
import { validatePersistableMedia } from "@/lib/product-media-storage";
import { productStockFields } from "@/lib/product-stock";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const categorySlug = new URL(request.url).searchParams.get("categorySlug");
  if (!categorySlug) {
    return NextResponse.json({ error: "categorySlug is required" }, { status: 400 });
  }

  const products = await prisma.product.findMany({
    where: { categorySlug },
    orderBy: { productId: "asc" },
    select: {
      productId: true,
      name: true,
      colors: true,
    },
  });

  const nextProductId = await allocateNextProductId(categorySlug);

  return NextResponse.json({ products, nextProductId });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const collection = await prisma.collection.findUnique({
    where: { slug: body.categorySlug },
  });

  if (!collection) {
    return NextResponse.json({ error: "Collection not found" }, { status: 400 });
  }

  if (!body.colorName?.trim()) {
    return NextResponse.json({ error: "Color name is required" }, { status: 400 });
  }

  const mediaCheck = validatePersistableMedia(body.media);
  if (!mediaCheck.ok) {
    return NextResponse.json({ error: mediaCheck.message }, { status: 400 });
  }
  const media = mediaCheck.media;

  try {
    const created = await prisma.$transaction(async (tx) => {
      const productId = await allocateNextProductId(body.categorySlug, tx);

      return tx.product.create({
        data: {
          productId,
          categorySlug: body.categorySlug,
          name: body.name,
          price: body.price,
          description: body.description,
          ...productStockFields(body.quantity),
          media: body.media ?? [],
          currency: "INR",
          colors: [body.colorName.trim()],
          colorVariants: [],
          sizes: (Array.isArray(body.sizes) && body.sizes.length
            ? body.sizes.map(String)
            : ["One Size"]) as unknown as import("@prisma/client").Prisma.InputJsonValue,
          highlights: normalizeProductHighlights(
            body.highlights
          ) as unknown as import("@prisma/client").Prisma.InputJsonValue,
        },
      });
    });

    await syncProductColorVariants({
      categorySlug: body.categorySlug,
      productId: created.productId,
      colorName: body.colorName,
      colorSwatch: body.colorSwatch,
      linkToProductId: body.standalone ? null : body.linkToProductId || null,
      standalone: Boolean(body.standalone),
    });

    const product = await prisma.product.findUnique({
      where: {
        categorySlug_productId: {
          categorySlug: body.categorySlug,
          productId: created.productId,
        },
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Product already exists or invalid data" }, { status: 400 });
  }
}
