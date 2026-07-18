"use client";



import Link from "next/link";

import { useRouter } from "next/navigation";

import { useState } from "react";

import { formatCartPrice } from "@/lib/cart";
import { useCart } from "@/lib/cart-context";

interface CheckoutValues {
  name: string;
  email: string;
  phone: string;
  address: string;
}

type CheckoutErrors = Partial<Record<keyof CheckoutValues, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Reduce a phone string to its local 10-digit number, dropping +91/91/0 prefixes. */
function toLocalPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

function validateCheckout(values: CheckoutValues): CheckoutErrors {
  const errors: CheckoutErrors = {};

  const name = values.name.trim();
  if (!name) {
    errors.name = "Please enter your full name.";
  } else if (name.length < 2) {
    errors.name = "Name must be at least 2 characters.";
  } else if (!/^[A-Za-z][A-Za-z\s.'-]*$/.test(name)) {
    errors.name = "Name can only contain letters, spaces, and . ' -";
  }

  const email = values.email.trim();
  if (!email) {
    errors.email = "Please enter your email.";
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = "Enter a valid email address (e.g. you@example.com).";
  }

  const phone = values.phone.trim();
  const localPhone = toLocalPhone(phone);
  if (!phone) {
    errors.phone = "Please enter your phone number.";
  } else if (localPhone.length !== 10) {
    errors.phone = "Phone number must be exactly 10 digits.";
  } else if (!/^[6-9]\d{9}$/.test(localPhone)) {
    errors.phone = "Enter a valid 10-digit mobile number.";
  }

  const address = values.address.trim();
  if (!address) {
    errors.address = "Please enter your delivery address.";
  } else if (address.length < 10) {
    errors.address = "Please enter a complete address (street, city, PIN).";
  }

  return errors;
}

export default function CheckoutPageContent() {
  const router = useRouter();

  const { items, subtotal, totalItems, isReady } = useCart();

  const currency = items[0]?.currency ?? "INR";

  const [values, setValues] = useState<CheckoutValues>({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof CheckoutValues, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);

  function setField(field: keyof CheckoutValues, value: string) {
    setValues((prev) => {
      const next = { ...prev, [field]: value };
      if (touched[field]) {
        setErrors(validateCheckout(next));
      }
      return next;
    });
  }

  function handleBlur(field: keyof CheckoutValues) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validateCheckout(values));
  }



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
          href="/#shop"
          className="mt-8 inline-flex rounded-full bg-brown-dark px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-brown"
        >
          Continue Shopping
        </Link>

      </div>

    );

  }



  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const validationErrors = validateCheckout(values);
    setTouched({ name: true, email: true, phone: true, address: true });
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setSubmitting(true);

    let orderId = "";
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          email: values.email.trim(),
          phone: toLocalPhone(values.phone),
          address: values.address.trim(),
          items,
          subtotal,
          currency,
          paymentMethod: "upi",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        orderId = data.orderId;
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Could not create order. Please try again.");
        setSubmitting(false);
        return;
      }
    } catch {
      // handled below
    }

    if (!orderId) {
      alert("Could not create order. Please try again.");
      setSubmitting(false);
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

        Complete your details and pay via GPay / UPI. Your order is placed after you upload the
        payment screenshot.

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
            autoComplete="name"
            value={values.name}
            onChange={(e) => setField("name", e.target.value)}
            onBlur={() => handleBlur("name")}
            aria-invalid={Boolean(errors.name)}
            className={`mt-2 w-full rounded-xl border bg-cream px-4 py-3 text-sm outline-none focus:border-gold ${
              errors.name ? "border-red-400" : "border-sand"
            }`}
            placeholder="Your name"
          />
          {errors.name && <span className="mt-1 block text-xs font-normal text-red-600">{errors.name}</span>}

        </label>

        <label className="block text-sm font-medium text-brown-dark">

          Email

          <input
            required
            type="email"
            name="email"
            inputMode="email"
            autoComplete="email"
            value={values.email}
            onChange={(e) => setField("email", e.target.value)}
            onBlur={() => handleBlur("email")}
            aria-invalid={Boolean(errors.email)}
            className={`mt-2 w-full rounded-xl border bg-cream px-4 py-3 text-sm outline-none focus:border-gold ${
              errors.email ? "border-red-400" : "border-sand"
            }`}
            placeholder="you@example.com"
          />
          {errors.email && <span className="mt-1 block text-xs font-normal text-red-600">{errors.email}</span>}

        </label>

        <label className="block text-sm font-medium text-brown-dark">

          Phone

          <input
            required
            type="tel"
            name="phone"
            inputMode="numeric"
            autoComplete="tel"
            maxLength={15}
            value={values.phone}
            onChange={(e) => setField("phone", e.target.value)}
            onBlur={() => handleBlur("phone")}
            aria-invalid={Boolean(errors.phone)}
            className={`mt-2 w-full rounded-xl border bg-cream px-4 py-3 text-sm outline-none focus:border-gold ${
              errors.phone ? "border-red-400" : "border-sand"
            }`}
            placeholder="98765 43210"
          />
          {errors.phone && <span className="mt-1 block text-xs font-normal text-red-600">{errors.phone}</span>}

        </label>

        <label className="block text-sm font-medium text-brown-dark">

          Delivery Address

          <textarea
            required
            name="address"
            rows={3}
            autoComplete="street-address"
            value={values.address}
            onChange={(e) => setField("address", e.target.value)}
            onBlur={() => handleBlur("address")}
            aria-invalid={Boolean(errors.address)}
            className={`mt-2 w-full rounded-xl border bg-cream px-4 py-3 text-sm outline-none focus:border-gold ${
              errors.address ? "border-red-400" : "border-sand"
            }`}
            placeholder="Street, city, state, PIN"
          />
          {errors.address && <span className="mt-1 block text-xs font-normal text-red-600">{errors.address}</span>}

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
          disabled={submitting}
          className="w-full rounded-full bg-brown-dark py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-brown disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Processing…" : "Proceed to Pay"}
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


