import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS } from "@/lib/order-status";
import { orderPaymentProofPath } from "@/lib/payment-proof";
import { sendPaymentReceivedEmail } from "@/lib/email";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const MAX_BYTES = 10 * 1024 * 1024;

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
    const filename = `${id}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    // Keep a local copy for dev; production serves from the database
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "payments");
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(path.join(uploadsDir, filename), buffer);

    const paymentProofUrl = orderPaymentProofPath(id);

    const updated = await prisma.order.update({
      where: { id },
      data: {
        paymentProofUrl,
        paymentProofMime: file.type,
        paymentProofData: buffer,
        status: ORDER_STATUS.PAYMENT_SUBMITTED,
        paidAt: new Date(),
        paymentMethod: order.paymentMethod || "upi",
      },
    });

    const emailResult = await sendPaymentReceivedEmail({
      to: updated.email,
      customerName: updated.name,
      orderId: updated.id,
    });

    if (!emailResult.sent) {
      console.warn("Payment received email failed:", emailResult.error);
    }

    return NextResponse.json({
      order: updated,
      paymentProofUrl,
      emailSent: emailResult.sent,
      emailError: emailResult.error,
    });
  } catch (error) {
    console.error("Payment proof upload failed:", error);
    return NextResponse.json({ error: "Failed to submit payment proof" }, { status: 500 });
  }
}
