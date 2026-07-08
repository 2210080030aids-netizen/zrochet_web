import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CartItem } from "@/lib/cart";
import { validateOrderStock } from "@/lib/product-stock";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const items = (Array.isArray(body.items) ? body.items : []) as CartItem[];

    if (!items.length) {
      return NextResponse.json({ error: "Your cart is empty" }, { status: 400 });
    }

    const stockCheck = await validateOrderStock(items);
    if (!stockCheck.ok) {
      return NextResponse.json({ error: stockCheck.message }, { status: 400 });
    }

    const order = await prisma.order.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        address: body.address,
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
