import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

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
      },
    });
    return NextResponse.json({ product }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Product already exists or invalid data" }, { status: 400 });
  }
}
