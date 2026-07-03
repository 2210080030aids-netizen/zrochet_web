import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  return NextResponse.json({ settings });
}

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const settings = await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {
      email: body.email,
      phone: body.phone,
      address: body.address,
      footerText: body.footerText,
      heroImage: body.heroImage,
    },
    create: {
      id: 1,
      email: body.email,
      phone: body.phone,
      address: body.address,
      footerText: body.footerText,
      heroImage: body.heroImage,
    },
  });

  return NextResponse.json({ settings });
}
