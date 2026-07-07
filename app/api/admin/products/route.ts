import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { syncProductColorVariants } from "@/lib/color-variants";
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

  return NextResponse.json({ products });
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

  try {
    const product = await prisma.product.create({
      data: {
        productId: body.productId.toUpperCase(),
        categorySlug: body.categorySlug,
        name: body.name,
        price: body.price,
        description: body.description,
        inStock: body.inStock ?? true,
        media: body.media ?? [],
        currency: "INR",
        colors: [body.colorName.trim()],
        colorVariants: [],
      },
    });

    await syncProductColorVariants({
      categorySlug: body.categorySlug,
      productId: product.productId,
      colorName: body.colorName,
      colorSwatch: body.colorSwatch,
      linkToProductId: body.standalone ? null : body.linkToProductId || null,
      standalone: Boolean(body.standalone),
    });

    const updated = await prisma.product.findUnique({
      where: {
        categorySlug_productId: {
          categorySlug: body.categorySlug,
          productId: product.productId,
        },
      },
    });

    return NextResponse.json({ product: updated }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Product already exists or invalid data" }, { status: 400 });
  }
}
