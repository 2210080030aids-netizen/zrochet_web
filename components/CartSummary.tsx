"use client";

import Link from "next/link";
import { formatCartPrice } from "@/lib/cart";
import { useCart } from "@/lib/cart-context";

interface CartSummaryProps {
  checkoutHref?: string;
}

export default function CartSummary({ checkoutHref = "/checkout" }: CartSummaryProps) {
  const { items, subtotal, totalItems } = useCart();
  const currency = items[0]?.currency ?? "INR";

  return (
    <aside className="sticky top-24 rounded-2xl border border-sand bg-white p-6 luxury-shadow-lg">
      <h2 className="font-display text-xl font-semibold text-brown-dark">
        Order Summary
      </h2>

      <div className="mt-5 space-y-3 border-b border-sand pb-5 text-sm">
        <div className="flex justify-between text-text-muted">
          <span>
            Subtotal ({totalItems} {totalItems === 1 ? "item" : "items"})
          </span>
          <span className="font-medium text-brown-dark">
            {formatCartPrice(subtotal, currency)}
          </span>
        </div>
        <div className="flex justify-between text-text-muted">
          <span>Delivery</span>
          <span className="font-medium text-emerald-700">FREE</span>
        </div>
      </div>

      <div className="mt-5 flex justify-between">
        <span className="font-display text-lg font-semibold text-brown-dark">
          Total
        </span>
        <span className="font-display text-2xl font-semibold text-brown-dark">
          {formatCartPrice(subtotal, currency)}
        </span>
      </div>

      <Link
        href={checkoutHref}
        className="mt-6 flex w-full items-center justify-center rounded-full bg-brown-dark py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-brown hover:luxury-shadow"
      >
        Proceed to Checkout
      </Link>

      <Link
        href="/#shop"
        className="mt-3 flex w-full items-center justify-center rounded-full border border-sand py-3 text-sm font-medium text-brown-dark transition hover:border-gold hover:bg-beige"
      >
        Continue Shopping
      </Link>

      <p className="mt-4 text-center text-xs text-text-muted">
        Secure checkout · 7-day easy returns
      </p>
    </aside>
  );
}
