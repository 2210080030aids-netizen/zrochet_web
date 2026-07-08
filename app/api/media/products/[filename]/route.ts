import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import {
  legacyProductUploadFilePath,
  mimeForProductUpload,
  resolveProductUploadFilePath,
} from "@/lib/product-media-storage";

interface RouteParams {
  params: Promise<{ filename: string }>;
}

async function readProductMedia(filename: string): Promise<Buffer> {
  const candidates = [
    resolveProductUploadFilePath(filename),
    legacyProductUploadFilePath(filename),
  ];

  for (const filePath of candidates) {
    try {
      return await readFile(filePath);
    } catch {
      // try next location
    }
  }

  throw new Error("Media not found");
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { filename } = await params;

  try {
    const buffer = await readProductMedia(filename);
    const mime = mimeForProductUpload(filename);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Media not found" }, { status: 404 });
  }
}
