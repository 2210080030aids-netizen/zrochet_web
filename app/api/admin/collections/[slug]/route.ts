import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const collection = await prisma.collection.findUnique({
    where: { slug },
    include: { _count: { select: { products: true } } },
  });

  if (!collection) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ collection });
}

export async function PUT(request: Request, { params }: RouteParams) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const body = await request.json();

  try {
    const collection = await prisma.collection.update({
      where: { slug },
      data: {
        name: body.name,
        label: body.label,
        pattern: body.pattern ?? null,
        defaultPrice: body.defaultPrice,
        sortOrder: body.sortOrder,
      },
    });
    return NextResponse.json({ collection });
  } catch {
    return NextResponse.json({ error: "Failed to update collection" }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  const productCount = await prisma.product.count({ where: { categorySlug: slug } });
  if (productCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete — ${productCount} product(s) still in this collection` },
      { status: 400 }
    );
  }

  await prisma.collection.delete({ where: { slug } });
  return NextResponse.json({ ok: true });
}
