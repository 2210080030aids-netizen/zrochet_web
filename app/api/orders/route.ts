import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const order = await prisma.order.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        address: body.address,
        items: body.items,
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
