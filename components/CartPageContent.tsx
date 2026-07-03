"use client";

import Link from "next/link";
import CartLineItem from "@/components/CartLineItem";
import CartSummary from "@/components/CartSummary";
import { useCart } from "@/lib/cart-context";

export default function CartPageContent() {
  const { items, totalItems, isReady } = useCart();

  if (!isReady) {
    return (
      <div className="mx-auto max-w-6xl px-5 pt-28 pb-16">
        <p className="text-text-muted">Loading your cart…</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-5 pt-28 pb-16 text-center">
        <div className="mx-auto max-w-md rounded-2xl border border-sand bg-white px-8 py-14 luxury-shadow">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-beige text-brown-dark">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          <h1 className="font-display text-3xl font-semibold text-brown-dark">
            Your cart is empty
          </h1>
          <p className="mt-3 text-text-muted">
            Discover our handcrafted crochet bags and add your favourites to the cart.
          </p>
          <Link
            href="/#shop"
            className="mt-8 inline-flex rounded-full bg-brown-dark px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-brown"
          >
            Shop Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pt-28 pb-16">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-brown-dark md:text-4xl">
          Shopping Cart
        </h1>
        <p className="mt-2 text-text-muted">
          {totalItems} {totalItems === 1 ? "item" : "items"} in your cart
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10">
        <div className="rounded-2xl border border-sand bg-white px-5 sm:px-6 luxury-shadow">
          {items.map((item) => (
            <CartLineItem key={`${item.category}:${item.id}`} item={item} />
          ))}
        </div>

        <CartSummary />
      </div>
    </div>
  );
}
