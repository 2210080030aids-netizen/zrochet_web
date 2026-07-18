import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { normalizeInstagramUrl } from "@/lib/instagram";
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
  const instagramUrl = normalizeInstagramUrl(String(body.instagramUrl ?? ""));

  const heroFields = {
    heroEyebrow: String(body.heroEyebrow ?? ""),
    heroTitle: String(body.heroTitle ?? ""),
    heroText: String(body.heroText ?? ""),
  };

  const storyFields = {
    storyImage: String(body.storyImage ?? ""),
    storyTitle: String(body.storyTitle ?? ""),
    storyText: String(body.storyText ?? ""),
    storyPoint1: String(body.storyPoint1 ?? ""),
    storyPoint2: String(body.storyPoint2 ?? ""),
    storyPoint3: String(body.storyPoint3 ?? ""),
  };

  const settings = await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {
      email: body.email,
      phone: body.phone,
      address: body.address,
      footerText: body.footerText,
      heroImage: body.heroImage,
      upiId: body.upiId,
      upiPayeeName: body.upiPayeeName,
      instagramUrl,
      ...heroFields,
      ...storyFields,
    },
    create: {
      id: 1,
      email: body.email,
      phone: body.phone,
      address: body.address,
      footerText: body.footerText,
      heroImage: body.heroImage,
      upiId: body.upiId,
      upiPayeeName: body.upiPayeeName,
      instagramUrl,
      ...heroFields,
      ...storyFields,
    },
  });

  return NextResponse.json({ settings });
}
