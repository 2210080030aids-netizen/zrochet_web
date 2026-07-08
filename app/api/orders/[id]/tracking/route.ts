import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS } from "@/lib/order-status";
import type { CartItem } from "@/lib/cart";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const email = new URL(request.url).searchParams.get("email")?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.email.trim().toLowerCase() !== email) {
    return NextResponse.json({ error: "Order not found. Check your order ID and email." }, { status: 404 });
  }

  if (order.status !== ORDER_STATUS.APPROVED) {
    return NextResponse.json(
      {
        error:
          order.status === ORDER_STATUS.REJECTED
            ? "This order was not approved. Please contact Zrochet support."
            : "Tracking is available after your payment has been approved.",
      },
      { status: 400 }
    );
  }

  const items = (order.items as unknown as CartItem[]).map((item) => ({
    name: item.name,
    quantity: item.quantity,
  }));

  return NextResponse.json({
    tracking: {
      orderId: order.id,
      status: order.status,
      subtotal: order.subtotal,
      currency: order.currency,
      items,
      reviewedAt: order.reviewedAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      deliveryPartner: order.deliveryPartner,
      trackingId: order.trackingId,
    },
  });
}
