import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateReceiptPdf } from "@/lib/receipt-pdf";
import { fetchSiteSettings } from "@/lib/catalog-db";
import type { CartItem } from "@/lib/cart";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      items: true,
      subtotal: true,
      currency: true,
      status: true,
      paymentMethod: true,
      paidAt: true,
      approvedAt: true,
      createdAt: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Always rebuild from current template — no stored/legacy PDF files exist.
  const settings = await fetchSiteSettings();
  const pdf = generateReceiptPdf(
    {
      ...order,
      items: order.items as unknown as CartItem[],
    },
    {
      name: "Zrochet",
      email: settings.email,
      phone: settings.phone,
      address: settings.address,
    }
  );

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="zrochet-invoice-${order.id}.pdf"`,
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
