import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

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
  const slug = body.slug ? slugify(body.slug) : slugify(body.name);

  if (!slug || !body.name || !body.label) {
    return NextResponse.json({ error: "Name and label are required" }, { status: 400 });
  }

  try {
    const maxSort = await prisma.collection.aggregate({ _max: { sortOrder: true } });
    const collection = await prisma.collection.create({
      data: {
        slug,
        name: body.name,
        label: body.label,
        pattern: body.pattern || null,
        defaultPrice: body.defaultPrice ?? 500,
        sortOrder: body.sortOrder ?? (maxSort._max.sortOrder ?? 0) + 1,
      },
    });
    return NextResponse.json({ collection }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Collection already exists or invalid data" }, { status: 400 });
  }
}
