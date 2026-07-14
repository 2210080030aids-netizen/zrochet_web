import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { labelFromCollectionName, slugifyCollectionName } from "@/lib/collection";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const collections = await prisma.collection.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return NextResponse.json({ collections });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const name = String(body.name || "").trim();
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const slug = slugifyCollectionName(name);
  if (!slug) {
    return NextResponse.json({ error: "Enter a valid collection name" }, { status: 400 });
  }

  try {
    const maxSort = await prisma.collection.aggregate({ _max: { sortOrder: true } });
    const collection = await prisma.collection.create({
      data: {
        slug,
        name,
        label: labelFromCollectionName(name),
        pattern: null,
        defaultPrice: 500,
        sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      },
    });
    return NextResponse.json({ collection }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "A collection with this name already exists" },
      { status: 400 }
    );
  }
}
