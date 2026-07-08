import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image file is required" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Upload a JPEG, PNG, or WebP image" },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Image must be under 10 MB" }, { status: 400 });
    }

    const ext =
      file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const filename = `hero-${Date.now()}.${ext}`;
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "hero");
    await mkdir(uploadsDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadsDir, filename), buffer);

    const heroImage = `/uploads/hero/${filename}`;
    const settings = await prisma.siteSettings.upsert({
      where: { id: 1 },
      update: { heroImage },
      create: {
        id: 1,
        heroImage,
      },
    });

    return NextResponse.json({ settings, heroImage });
  } catch (error) {
    console.error("Hero image upload failed:", error);
    return NextResponse.json({ error: "Failed to upload hero image" }, { status: 500 });
  }
}
