import { prisma } from "@/lib/prisma";

export async function saveProductMediaFile(
  filename: string,
  mime: string,
  data: Buffer
): Promise<void> {
  await prisma.productMediaFile.upsert({
    where: { filename },
    create: { filename, mime, data: new Uint8Array(data) },
    update: { mime, data: new Uint8Array(data) },
  });
}

export async function readProductMediaFile(
  filename: string
): Promise<{ mime: string; data: Buffer } | null> {
  const row = await prisma.productMediaFile.findUnique({
    where: { filename },
    select: { mime: true, data: true },
  });

  if (!row) return null;
  return { mime: row.mime, data: Buffer.from(row.data) };
}
