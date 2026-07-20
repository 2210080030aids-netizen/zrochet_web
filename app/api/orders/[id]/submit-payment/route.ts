import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS } from "@/lib/order-status";
import {
  allocateNextOrderId,
  isPlacedOrderId,
  isUniqueConstraintError,
} from "@/lib/order-id";
import { orderPaymentProofPath } from "@/lib/payment-proof";
import { sendPaymentReceivedEmail, sendNewOrderAdminEmail } from "@/lib/email";
import { deductStockForOrder } from "@/lib/product-stock";
import type { CartItem } from "@/lib/cart";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_ID_ALLOCATION_ATTEMPTS = 8;

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;

  try {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status === ORDER_STATUS.APPROVED) {
      return NextResponse.json({ error: "Order already approved" }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Payment screenshot is required" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Upload a JPEG, PNG, or WebP screenshot of your payment" },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Image must be under 10 MB" }, { status: 400 });
    }

    const ext =
      file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const buffer = Buffer.from(await file.arrayBuffer());
    const paidAt = new Date();

    let placed = order;

    // ODZ number is assigned only when the order is placed (payment screenshot uploaded).
    if (!isPlacedOrderId(order.id)) {
      let lastError: unknown;
      let created = null;

      for (let attempt = 0; attempt < MAX_ID_ALLOCATION_ATTEMPTS; attempt++) {
        try {
          created = await prisma.$transaction(
            async (tx) => {
              const placedId = await allocateNextOrderId(tx);
              const next = await tx.order.create({
                data: {
                  id: placedId,
                  name: order.name,
                  email: order.email,
                  phone: order.phone,
                  address: order.address,
                  items: order.items as Prisma.InputJsonValue,
                  subtotal: order.subtotal,
                  currency: order.currency,
                  paymentMethod: order.paymentMethod || "upi",
                  paymentProofUrl: orderPaymentProofPath(placedId),
                  paymentProofMime: file.type,
                  paymentProofData: buffer,
                  status: ORDER_STATUS.PAYMENT_SUBMITTED,
                  paidAt,
                  createdAt: order.createdAt,
                },
              });
              await tx.order.delete({ where: { id: order.id } });
              return next;
            },
            // Railway's public DB proxy adds latency, so allow more time than
            // Prisma's 5s default before the interactive transaction closes.
            { maxWait: 15000, timeout: 30000 }
          );
          break;
        } catch (error) {
          lastError = error;
          if (!isUniqueConstraintError(error)) {
            throw error;
          }
        }
      }

      if (!created) {
        console.error("Order ID allocation failed after retries:", lastError);
        return NextResponse.json({ error: "Failed to place order" }, { status: 500 });
      }

      placed = created;
    } else {
      placed = await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentProofUrl: orderPaymentProofPath(order.id),
          paymentProofMime: file.type,
          paymentProofData: buffer,
          status: ORDER_STATUS.PAYMENT_SUBMITTED,
          paidAt,
          paymentMethod: order.paymentMethod || "upi",
        },
      });
    }

    // Reserve stock the moment payment proof is submitted so the item can't be
    // bought by anyone else while the order is under review. Skip if the order
    // was already awaiting review (a re-upload) to avoid deducting twice.
    if (order.status !== ORDER_STATUS.PAYMENT_SUBMITTED) {
      await deductStockForOrder(placed.items as unknown as CartItem[]);
    }

    const filename = `${placed.id}.${ext}`;
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "payments");
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(path.join(uploadsDir, filename), buffer);

    const paymentProofUrl = orderPaymentProofPath(placed.id);

    const emailResult = await sendPaymentReceivedEmail({
      to: placed.email,
      customerName: placed.name,
      orderId: placed.id,
    });

    if (!emailResult.sent) {
      console.warn("Payment received email failed:", emailResult.error);
    }

    // Admin alert uses the final ODZ order ID (assigned above when payment is submitted).
    // Skip on payment re-upload so the inbox isn't spammed.
    if (order.status !== ORDER_STATUS.PAYMENT_SUBMITTED) {
      try {
        const adminEmailResult = await sendNewOrderAdminEmail({
          orderId: placed.id,
          customerName: placed.name,
          customerEmail: placed.email,
          customerPhone: placed.phone,
          address: placed.address,
          items: placed.items as unknown as CartItem[],
          subtotal: placed.subtotal,
          currency: placed.currency,
        });
        if (!adminEmailResult.sent) {
          console.warn("New-order admin email not sent:", adminEmailResult.error);
        }
      } catch (adminEmailError) {
        console.error("New-order admin email failed:", adminEmailError);
      }
    }

    return NextResponse.json({
      order: {
        id: placed.id,
        status: placed.status,
        paidAt: placed.paidAt,
        paymentProofUrl,
      },
      orderId: placed.id,
      paymentProofUrl,
      emailSent: emailResult.sent,
      emailError: emailResult.error,
    });
  } catch (error) {
    console.error("Payment proof upload failed:", error);
    return NextResponse.json({ error: "Failed to submit payment proof" }, { status: 500 });
  }
}
