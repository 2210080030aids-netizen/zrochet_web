import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS } from "@/lib/order-status";
import type { CartItem } from "@/lib/cart";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  try {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status === ORDER_STATUS.APPROVED) {
      return NextResponse.json({ order, message: "Already approved" });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: ORDER_STATUS.PAYMENT_SUBMITTED,
        paidAt: new Date(),
        paymentMethod: order.paymentMethod || "upi",
      },
    });

    return NextResponse.json({ order: updated });
  } catch (error) {
    console.error("Payment complete failed:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({
    order: {
      ...order,
      items: order.items as CartItem[],
    },
  });
}
