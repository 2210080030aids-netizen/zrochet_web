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

async function sendOrderThankYouEmail(order: {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  items: unknown;
  subtotal: number;
  currency: string;
  status: string;
  paymentMethod?: string | null;
  paidAt?: Date | null;
  approvedAt?: Date | null;
  createdAt: Date;
}) {
  const items = order.items as unknown as CartItem[];
  const receiptPdf = generateReceiptPdf({ ...order, items });

  const emailResult = await sendThankYouEmail({
    to: order.email,
    customerName: order.name,
    orderId: order.id,
    subtotal: order.subtotal,
    currency: order.currency,
    phone: order.phone,
    address: order.address,
    items,
    receiptPdf,
  });

  await prisma.order.update({
    where: { id: order.id },
    data: {
      thankYouEmailSent: emailResult.sent,
      thankYouEmailError: emailResult.sent ? null : emailResult.error || "Unknown error",
    },
  });

  return emailResult;
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
  const action = body.action as "approve" | "reject" | "resend_email";

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (action === "resend_email") {
    if (order.status !== ORDER_STATUS.APPROVED) {
      return NextResponse.json({ error: "Order must be approved first" }, { status: 400 });
    }

    const emailResult = await sendOrderThankYouEmail(order);
    const updated = await prisma.order.findUnique({ where: { id } });

    return NextResponse.json({
      order: updated,
      emailSent: emailResult.sent,
      emailError: emailResult.error,
      provider: emailResult.provider,
    });
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

  const emailResult = await sendOrderThankYouEmail(updated);
  const orderWithEmail = await prisma.order.findUnique({ where: { id } });

  return NextResponse.json({
    order: orderWithEmail,
    emailSent: emailResult.sent,
    emailError: emailResult.error,
    provider: emailResult.provider,
  });
}
