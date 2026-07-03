import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ category: string; id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { category, id } = await params;
  const product = await prisma.product.findUnique({
    where: {
      categorySlug_productId: { categorySlug: category, productId: id.toUpperCase() },
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
  const body = await request.json();

  const product = await prisma.product.update({
    where: {
      categorySlug_productId: { categorySlug: category, productId: id.toUpperCase() },
    },
    data: {
      name: body.name,
      price: body.price,
      originalPrice: body.originalPrice,
      discountPercent: body.discountPercent ?? 0,
      description: body.description,
      material: body.material,
      dimensions: body.dimensions,
      inStock: body.inStock,
      media: body.media ?? [],
    },
  });

  return NextResponse.json({ product });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { category, id } = await params;
  await prisma.product.delete({
    where: {
      categorySlug_productId: { categorySlug: category, productId: id.toUpperCase() },
    },
  });

  return NextResponse.json({ ok: true });
}
