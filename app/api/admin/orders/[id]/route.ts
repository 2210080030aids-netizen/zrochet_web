import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS } from "@/lib/order-status";
import { sendThankYouEmail, sendRejectionEmail, sendShippedEmail, sendDeliveredEmail } from "@/lib/email";
import { generateReceiptPdf } from "@/lib/receipt-pdf";
import { buildTrackingUpdateData, type FulfillmentStage } from "@/lib/order-tracking";
import { restoreStockForOrder } from "@/lib/product-stock";
import { fetchSiteSettings } from "@/lib/catalog-db";
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
  const settings = await fetchSiteSettings();
  const receiptPdf = generateReceiptPdf(
    { ...order, items },
    {
      name: "Zrochet",
      email: settings.email,
      phone: settings.phone,
      address: settings.address,
    }
  );

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

async function sendOrderRejectionEmail(
  order: {
    id: string;
    name: string;
    email: string;
    subtotal: number;
    currency: string;
  },
  reason: string
) {
  const emailResult = await sendRejectionEmail({
    to: order.email,
    customerName: order.name,
    orderId: order.id,
    subtotal: order.subtotal,
    currency: order.currency,
    reason,
  });

  await prisma.order.update({
    where: { id: order.id },
    data: {
      rejectionEmailSent: emailResult.sent,
      rejectionEmailError: emailResult.sent ? null : emailResult.error || "Unknown error",
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
  if (!order || !order.paymentProofUrl) {
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
  const action = body.action as "approve" | "reject" | "resend_email" | "update_tracking";

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || !order.paymentProofUrl) {
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
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    if (!reason) {
      return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
    }

    // Give the reserved stock back so the product is purchasable again.
    if (order.status === ORDER_STATUS.PAYMENT_SUBMITTED) {
      await restoreStockForOrder(order.items as unknown as CartItem[]);
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: ORDER_STATUS.REJECTED,
        rejectionReason: reason,
        rejectedAt: new Date(),
        rejectionEmailSent: false,
        rejectionEmailError: null,
      },
    });

    const emailResult = await sendOrderRejectionEmail(updated, reason);
    const orderWithEmail = await prisma.order.findUnique({ where: { id } });

    return NextResponse.json({
      order: orderWithEmail,
      emailSent: emailResult.sent,
      emailError: emailResult.error,
      provider: emailResult.provider,
    });
  }

  if (action === "update_tracking") {
    if (order.status !== ORDER_STATUS.APPROVED) {
      return NextResponse.json({ error: "Order must be approved first" }, { status: 400 });
    }

    const stage = body.stage as FulfillmentStage;
    if (!["reviewed", "shipped", "delivered"].includes(stage)) {
      return NextResponse.json({ error: "Invalid tracking stage" }, { status: 400 });
    }

    const completed = Boolean(body.completed);

    try {
      const data = buildTrackingUpdateData(
        {
          reviewedAt: order.reviewedAt,
          shippedAt: order.shippedAt,
          deliveredAt: order.deliveredAt,
          deliveryPartner: order.deliveryPartner,
          trackingId: order.trackingId,
        },
        stage,
        completed,
        {
          deliveryPartner:
            typeof body.deliveryPartner === "string" ? body.deliveryPartner : undefined,
          trackingId: typeof body.trackingId === "string" ? body.trackingId : undefined,
        }
      );

      const updated = await prisma.order.update({
        where: { id },
        data,
      });

      let emailSent = false;
      let emailError: string | undefined;

      if (completed && stage === "shipped") {
        const emailResult = await sendShippedEmail({
          to: updated.email,
          customerName: updated.name,
          orderId: updated.id,
          deliveryPartner: updated.deliveryPartner,
          trackingId: updated.trackingId,
        });
        emailSent = emailResult.sent;
        emailError = emailResult.error;
        if (!emailResult.sent) {
          console.warn("Shipped email failed:", emailResult.error);
        }
      }

      if (completed && stage === "delivered") {
        const emailResult = await sendDeliveredEmail({
          to: updated.email,
          customerName: updated.name,
          orderId: updated.id,
        });
        emailSent = emailResult.sent;
        emailError = emailResult.error;
        if (!emailResult.sent) {
          console.warn("Delivered email failed:", emailResult.error);
        }
      }

      return NextResponse.json({ order: updated, emailSent, emailError });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to update tracking" },
        { status: 400 }
      );
    }
  }

  if (action !== "approve") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  if (order.status === ORDER_STATUS.APPROVED) {
    return NextResponse.json({ error: "Order is already approved" }, { status: 400 });
  }

  // Stock was already reserved when the customer submitted payment proof,
  // so approval only finalizes the order without deducting again.
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
