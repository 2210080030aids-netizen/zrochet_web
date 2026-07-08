"use client";



import Link from "next/link";

import { useRouter } from "next/navigation";

import { formatCartPrice } from "@/lib/cart";
import { useCart } from "@/lib/cart-context";

export default function CheckoutPageContent() {
  const router = useRouter();

  const { items, subtotal, totalItems, isReady } = useCart();

  const currency = items[0]?.currency ?? "INR";



  if (!isReady) {

    return (

      <div className="mx-auto max-w-3xl px-5 pt-28 pb-16">

        <p className="text-text-muted">Loading checkout…</p>

      </div>

    );

  }



  if (items.length === 0) {

    return (

      <div className="mx-auto max-w-3xl px-5 pt-28 pb-16 text-center">

        <h1 className="font-display text-3xl font-semibold text-brown-dark">

          Nothing to checkout

        </h1>

        <p className="mt-3 text-text-muted">Your cart is empty.</p>

        <Link

          href="/mini-bags/TEST"

          className="mt-8 inline-flex rounded-full bg-brown-dark px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-brown"

        >

          Try Test Bag (₹1)

        </Link>

      </div>

    );

  }



  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = new FormData(e.currentTarget);

    let orderId = "";
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(form.get("name")),
          email: String(form.get("email")),
          phone: String(form.get("phone")),
          address: String(form.get("address")),
          items,
          subtotal,
          currency,
          paymentMethod: "upi",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        orderId = data.orderId;
      }
    } catch {
      // handled below
    }

    if (!orderId) {
      alert("Could not create order. Please try again.");
      return;
    }

    const params = new URLSearchParams({
      amount: subtotal.toFixed(2),
      orderId,
      method: "upi",
    });

    router.push(`/pay?${params.toString()}`);

  }



  return (

    <div className="mx-auto max-w-3xl px-5 pt-28 pb-16">

      <h1 className="font-display text-3xl font-semibold text-brown-dark md:text-4xl">

        Checkout

      </h1>

      <p className="mt-2 text-text-muted">

        Complete your details and pay via GPay / UPI to confirm your order.

      </p>



      <div className="mt-8 rounded-2xl border border-sand bg-white p-6 luxury-shadow">

        <h2 className="font-display text-lg font-semibold text-brown-dark">

          Order ({totalItems} {totalItems === 1 ? "item" : "items"})

        </h2>

        <ul className="mt-4 space-y-2 text-sm text-text-muted">

          {items.map((item) => (

            <li key={`${item.category}:${item.id}`} className="flex justify-between gap-4">

              <span>

                {item.name} × {item.quantity}

              </span>

              <span className="font-medium text-brown-dark">

                {formatCartPrice(item.price * item.quantity, item.currency)}

              </span>

            </li>

          ))}

        </ul>

        <div className="mt-4 flex justify-between border-t border-sand pt-4">

          <span className="font-display text-lg font-semibold text-brown-dark">Total</span>

          <span className="font-display text-xl font-semibold text-brown-dark">

            {formatCartPrice(subtotal, currency)}

          </span>

        </div>

      </div>



      <form

        onSubmit={handleSubmit}

        className="mt-8 space-y-5 rounded-2xl border border-sand bg-white p-6 luxury-shadow"

      >

        <h2 className="font-display text-lg font-semibold text-brown-dark">

          Delivery Details

        </h2>

        <label className="block text-sm font-medium text-brown-dark">

          Full Name

          <input

            required

            type="text"

            name="name"

            className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm outline-none focus:border-gold"

            placeholder="Your name"

          />

        </label>

        <label className="block text-sm font-medium text-brown-dark">

          Email

          <input

            required

            type="email"

            name="email"

            className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm outline-none focus:border-gold"

            placeholder="you@example.com"

          />

        </label>

        <label className="block text-sm font-medium text-brown-dark">

          Phone

          <input

            required

            type="tel"

            name="phone"

            className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm outline-none focus:border-gold"

            placeholder="+91 98765 43210"

          />

        </label>

        <label className="block text-sm font-medium text-brown-dark">

          Delivery Address

          <textarea

            required

            name="address"

            rows={3}

            className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm outline-none focus:border-gold"

            placeholder="Street, city, state, PIN"

          />

        </label>



        <div>
          <h2 className="font-display text-lg font-semibold text-brown-dark">Payment method</h2>
          <div className="mt-4 rounded-xl border border-brown-dark bg-beige/40 p-4">
            <p className="font-medium text-brown-dark">GPay / UPI</p>
            <p className="mt-1 text-xs text-text-muted">
              Scan a dynamic QR — amount matches your order total
            </p>
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-full bg-brown-dark py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-brown"
        >
          Proceed to Pay
        </button>

      </form>



      <Link

        href="/cart"

        className="mt-4 inline-block text-sm font-medium text-brown transition hover:text-brown-dark"

      >

        ← Back to cart

      </Link>

    </div>

  );

}


