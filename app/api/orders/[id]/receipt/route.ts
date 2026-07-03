import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateReceiptPdf } from "@/lib/receipt-pdf";
import type { CartItem } from "@/lib/cart";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const pdf = generateReceiptPdf({
    ...order,
    items: order.items as CartItem[],
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="zrochet-receipt-${order.id}.pdf"`,
    },
  });
}
