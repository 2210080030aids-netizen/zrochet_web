"use client";

import Image from "next/image";
import Link from "next/link";
import { formatCartPrice, type CartItem } from "@/lib/cart";
import { useCart } from "@/lib/cart-context";

interface CartLineItemProps {
  item: CartItem;
}

export default function CartLineItem({ item }: CartLineItemProps) {
  const { updateQuantity, removeItem } = useCart();
  const lineTotal = item.price * item.quantity;

  return (
    <article className="flex gap-4 border-b border-sand py-6 last:border-b-0 sm:gap-6">
      <Link
        href={`/${item.category}/${item.id}`}
        className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-beige sm:h-32 sm:w-28"
      >
        <Image
          src={item.image}
          alt={item.name}
          fill
          className="object-cover"
          sizes="112px"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Link
              href={`/${item.category}/${item.id}`}
              className="font-display text-lg font-semibold text-brown-dark transition hover:text-brown"
            >
              {item.name}
            </Link>
            <p className="mt-1 text-sm font-medium text-brown">
              {formatCartPrice(item.price, item.currency)}
            </p>
            <p className="mt-1 text-xs text-text-muted">In stock · Handmade</p>
          </div>
          <p className="font-display text-xl font-semibold text-brown-dark sm:text-right">
            {formatCartPrice(lineTotal, item.currency)}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <label className="text-xs font-medium uppercase tracking-wide text-text-muted">
            Qty
            <div className="mt-1.5 flex items-center rounded-xl border border-sand bg-white">
              <button
                type="button"
                className="px-3 py-2 text-lg transition hover:bg-beige disabled:opacity-40"
                disabled={item.quantity <= 1}
                onClick={() =>
                  updateQuantity(item.category, item.id, item.quantity - 1)
                }
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="min-w-[2.5rem] text-center text-sm font-medium">
                {item.quantity}
              </span>
              <button
                type="button"
                className="px-3 py-2 text-lg transition hover:bg-beige disabled:opacity-40"
                disabled={item.quantity >= 10}
                onClick={() =>
                  updateQuantity(item.category, item.id, item.quantity + 1)
                }
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </label>

          <button
            type="button"
            onClick={() => removeItem(item.category, item.id)}
            className="text-sm font-medium text-text-muted transition hover:text-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}
