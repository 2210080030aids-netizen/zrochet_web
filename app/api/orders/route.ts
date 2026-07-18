import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CartItem } from "@/lib/cart";
import { createDraftOrderId } from "@/lib/order-id";
import { validateOrderStock } from "@/lib/product-stock";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const items = (Array.isArray(body.items) ? body.items : []) as CartItem[];

    if (!items.length) {
      return NextResponse.json({ error: "Your cart is empty" }, { status: 400 });
    }

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const address = String(body.address ?? "").trim();
    const localPhone = phone.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "").replace(/^0(?=\d{10}$)/, "");

    if (name.length < 2) {
      return NextResponse.json({ error: "Please enter a valid full name." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (!/^[6-9]\d{9}$/.test(localPhone)) {
      return NextResponse.json({ error: "Please enter a valid 10-digit phone number." }, { status: 400 });
    }
    if (address.length < 10) {
      return NextResponse.json({ error: "Please enter a complete delivery address." }, { status: 400 });
    }

    const stockCheck = await validateOrderStock(items);
    if (!stockCheck.ok) {
      return NextResponse.json({ error: stockCheck.message }, { status: 400 });
    }

    // Draft checkout only — ODZ order number is assigned when payment proof is uploaded.
    const order = await prisma.order.create({
      data: {
        id: createDraftOrderId(),
        name,
        email,
        phone: localPhone,
        address,
        items: items as unknown as Prisma.InputJsonValue,
        subtotal: body.subtotal,
        currency: body.currency ?? "INR",
        paymentMethod: body.paymentMethod ?? "upi",
      },
    });

    return NextResponse.json({ orderId: order.id }, { status: 201 });
  } catch (error) {
    console.error("Order create failed:", error);
    return NextResponse.json({ error: "Failed to save order" }, { status: 500 });
  }
}
