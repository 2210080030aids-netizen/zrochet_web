import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { isAdminAuthenticated } from "@/lib/admin-auth";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
]);

const MAX_BYTES = 20 * 1024 * 1024;

function extForMime(type: string): string {
  switch (type) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "video/mp4":
      return "mp4";
    default:
      return "jpeg";
  }
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, WebP images and MP4 videos are allowed" },
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File must be under 20 MB" }, { status: 400 });
  }

  const productId = String(formData.get("productId") || "PRODUCT")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  const index = Math.max(1, Number(formData.get("index") || 1));
  const label = String(formData.get("label") || `View ${index}`).trim() || `View ${index}`;
  const ext = extForMime(file.type);
  const filename = `${productId}_upload (${index}).${ext}`;

  const uploadsDir = path.join(process.cwd(), "public", "images");
  await mkdir(uploadsDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadsDir, filename), buffer);

  const src = "/images/" + encodeURIComponent(filename);
  const type = file.type.startsWith("video/") ? "video" : "image";

  return NextResponse.json({
    media: { type, src, label },
    filename,
  });
}
