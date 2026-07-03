import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS } from "@/lib/order-status";
import { sendThankYouEmail } from "@/lib/email";
import { generateReceiptPdf } from "@/lib/receipt-pdf";
import type { CartItem } from "@/lib/cart";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({
    order: { ...order, items: order.items as unknown as CartItem[] },
  });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const action = body.action as "approve" | "reject";

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (action === "reject") {
    const updated = await prisma.order.update({
      where: { id },
      data: { status: ORDER_STATUS.REJECTED },
    });
    return NextResponse.json({ order: updated });
  }

  if (action !== "approve") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status: ORDER_STATUS.APPROVED,
      approvedAt: new Date(),
    },
  });

  const receiptPdf = generateReceiptPdf({
    ...updated,
    items: updated.items as unknown as CartItem[],
  });

  const emailResult = await sendThankYouEmail({
    to: updated.email,
    customerName: updated.name,
    orderId: updated.id,
    subtotal: updated.subtotal,
    currency: updated.currency,
    receiptPdf,
  });

  return NextResponse.json({
    order: updated,
    emailSent: emailResult.sent,
    emailError: emailResult.error,
  });
}
