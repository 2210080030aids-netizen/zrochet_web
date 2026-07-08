import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { syncProductColorVariants } from "@/lib/color-variants";
import { allocateNextProductId } from "@/lib/product-id";
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

  const media = Array.isArray(body.media) ? body.media : [];
  if (!media.length) {
    return NextResponse.json({ error: "Add at least one product image" }, { status: 400 });
  }
  if (media.some((item: { src?: string }) => !item?.src || item.src.startsWith("blob:"))) {
    return NextResponse.json(
      { error: "Wait for image uploads to finish before saving the product" },
      { status: 400 }
    );
  }

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
