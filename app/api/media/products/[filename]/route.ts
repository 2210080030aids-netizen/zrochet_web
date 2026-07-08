import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { readProductMediaFile } from "@/lib/product-media-db";
import {
  legacyProductUploadFilePath,
  mimeForProductUpload,
  resolveProductUploadFilePath,
} from "@/lib/product-media-storage";

interface RouteParams {
  params: Promise<{ filename: string }>;
}

function safeFilename(filename: string): string {
  return decodeURIComponent(filename).split(/[/\\]/).pop() || filename;
}

async function readProductMediaFromDisk(filename: string): Promise<Buffer> {
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
  const safeName = safeFilename(filename);

  try {
    const stored = await readProductMediaFile(safeName);
    if (stored) {
      return new NextResponse(new Uint8Array(stored.data), {
        headers: {
          "Content-Type": stored.mime,
          "Cache-Control": "public, max-age=86400, immutable",
        },
      });
    }

    const buffer = await readProductMediaFromDisk(safeName);
    const mime = mimeForProductUpload(safeName);

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
