import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CartItem } from "@/lib/cart";
import { createDraftOrderId } from "@/lib/order-id";
import { validateOrderStock } from "@/lib/product-stock";
import { composeAddress, isValidIndianState } from "@/lib/india-locations";

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
    const localPhone = phone.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "").replace(/^0(?=\d{10}$)/, "");

    const country = String(body.country ?? "India").trim() || "India";
    const addressLine1 = String(body.addressLine1 ?? "").trim();
    const addressLine2 = String(body.addressLine2 ?? "").trim();
    const city = String(body.city ?? "").trim();
    const state = String(body.state ?? "").trim();
    const pinCode = String(body.pinCode ?? "").trim();

    if (name.length < 2) {
      return NextResponse.json({ error: "Please enter a valid full name." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (!/^[6-9]\d{9}$/.test(localPhone)) {
      return NextResponse.json({ error: "Please enter a valid 10-digit phone number." }, { status: 400 });
    }
    if (addressLine1.length < 3) {
      return NextResponse.json({ error: "Please enter a complete street address." }, { status: 400 });
    }
    if (city.length < 2) {
      return NextResponse.json({ error: "Please enter a valid town / city." }, { status: 400 });
    }
    if (!isValidIndianState(state)) {
      return NextResponse.json({ error: "Please select a valid state." }, { status: 400 });
    }
    if (!/^[1-9]\d{5}$/.test(pinCode)) {
      return NextResponse.json({ error: "Please enter a valid 6-digit PIN code." }, { status: 400 });
    }

    const address = composeAddress({
      addressLine1,
      addressLine2,
      city,
      state,
      pinCode,
      country,
    });

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
        country,
        addressLine1,
        addressLine2,
        city,
        state,
        pinCode,
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
