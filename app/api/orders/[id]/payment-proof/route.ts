import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      paymentProofData: true,
      paymentProofMime: true,
      paymentProofUrl: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.paymentProofData && order.paymentProofMime) {
    return new NextResponse(order.paymentProofData, {
      headers: {
        "Content-Type": order.paymentProofMime,
        "Cache-Control": "private, max-age=3600",
      },
    });
  }

  if (order.paymentProofUrl?.startsWith("/uploads/payments/")) {
    const filename = decodeURIComponent(
      order.paymentProofUrl.replace("/uploads/payments/", "")
    );
    const filePath = path.join(process.cwd(), "public", "uploads", "payments", filename);

    try {
      const buffer = await readFile(filePath);
      const ext = path.extname(filename).toLowerCase();
      const mime =
        ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": mime,
          "Cache-Control": "private, max-age=3600",
        },
      });
    } catch {
      return NextResponse.json(
        { error: "Payment screenshot not found — ask customer to re-upload" },
        { status: 404 }
      );
    }
  }

  return NextResponse.json({ error: "No payment screenshot for this order" }, { status: 404 });
}
