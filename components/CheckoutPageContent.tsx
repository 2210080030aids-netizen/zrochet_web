"use client";



import Link from "next/link";

import { useRouter } from "next/navigation";

import { useState } from "react";

import { formatCartPrice } from "@/lib/cart";
import { useCart } from "@/lib/cart-context";
import {
  INDIAN_STATES,
  SHIPPING_COUNTRIES,
  composeAddress,
  isValidIndianState,
} from "@/lib/india-locations";

interface CheckoutValues {
  name: string;
  email: string;
  phone: string;
  country: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pinCode: string;
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

  if (!values.country.trim()) {
    errors.country = "Please select your country / region.";
  }

  const addressLine1 = values.addressLine1.trim();
  if (!addressLine1) {
    errors.addressLine1 = "Please enter your house number and street name.";
  } else if (addressLine1.length < 3) {
    errors.addressLine1 = "Please enter a complete street address.";
  }

  const city = values.city.trim();
  if (!city) {
    errors.city = "Please enter your town / city.";
  } else if (!/^[A-Za-z][A-Za-z\s.'-]*$/.test(city)) {
    errors.city = "Enter a valid town / city name.";
  }

  const state = values.state.trim();
  if (!state) {
    errors.state = "Please select your state.";
  } else if (!isValidIndianState(state)) {
    errors.state = "Please select a valid state.";
  }

  const pinCode = values.pinCode.trim();
  if (!pinCode) {
    errors.pinCode = "Please enter your PIN code.";
  } else if (!/^[1-9]\d{5}$/.test(pinCode)) {
    errors.pinCode = "PIN code must be exactly 6 digits.";
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
    country: "India",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pinCode: "",
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
    setTouched({
      name: true,
      email: true,
      phone: true,
      country: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      state: true,
      pinCode: true,
    });
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setSubmitting(true);

    const address = composeAddress({
      addressLine1: values.addressLine1,
      addressLine2: values.addressLine2,
      city: values.city,
      state: values.state,
      pinCode: values.pinCode,
      country: values.country,
    });

    let orderId = "";
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          email: values.email.trim(),
          phone: toLocalPhone(values.phone),
          address,
          country: values.country.trim(),
          addressLine1: values.addressLine1.trim(),
          addressLine2: values.addressLine2.trim(),
          city: values.city.trim(),
          state: values.state.trim(),
          pinCode: values.pinCode.trim(),
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

          Country / Region

          <select
            required
            name="country"
            autoComplete="country-name"
            value={values.country}
            onChange={(e) => setField("country", e.target.value)}
            onBlur={() => handleBlur("country")}
            aria-invalid={Boolean(errors.country)}
            className={`mt-2 w-full rounded-xl border bg-cream px-4 py-3 text-sm outline-none focus:border-gold ${
              errors.country ? "border-red-400" : "border-sand"
            }`}
          >
            {SHIPPING_COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
          {errors.country && <span className="mt-1 block text-xs font-normal text-red-600">{errors.country}</span>}

        </label>

        <label className="block text-sm font-medium text-brown-dark">

          Street address

          <input
            required
            type="text"
            name="addressLine1"
            autoComplete="address-line1"
            value={values.addressLine1}
            onChange={(e) => setField("addressLine1", e.target.value)}
            onBlur={() => handleBlur("addressLine1")}
            aria-invalid={Boolean(errors.addressLine1)}
            className={`mt-2 w-full rounded-xl border bg-cream px-4 py-3 text-sm outline-none focus:border-gold ${
              errors.addressLine1 ? "border-red-400" : "border-sand"
            }`}
            placeholder="House number and street name"
          />
          {errors.addressLine1 && (
            <span className="mt-1 block text-xs font-normal text-red-600">{errors.addressLine1}</span>
          )}
          <input
            type="text"
            name="addressLine2"
            autoComplete="address-line2"
            value={values.addressLine2}
            onChange={(e) => setField("addressLine2", e.target.value)}
            className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm outline-none focus:border-gold"
            placeholder="Apartment, suite, unit, etc. (optional)"
          />

        </label>

        <label className="block text-sm font-medium text-brown-dark">

          Town / City

          <input
            required
            type="text"
            name="city"
            autoComplete="address-level2"
            value={values.city}
            onChange={(e) => setField("city", e.target.value)}
            onBlur={() => handleBlur("city")}
            aria-invalid={Boolean(errors.city)}
            className={`mt-2 w-full rounded-xl border bg-cream px-4 py-3 text-sm outline-none focus:border-gold ${
              errors.city ? "border-red-400" : "border-sand"
            }`}
            placeholder="Town / City"
          />
          {errors.city && <span className="mt-1 block text-xs font-normal text-red-600">{errors.city}</span>}

        </label>

        <label className="block text-sm font-medium text-brown-dark">

          State

          <select
            required
            name="state"
            autoComplete="address-level1"
            value={values.state}
            onChange={(e) => setField("state", e.target.value)}
            onBlur={() => handleBlur("state")}
            aria-invalid={Boolean(errors.state)}
            className={`mt-2 w-full rounded-xl border bg-cream px-4 py-3 text-sm outline-none focus:border-gold ${
              errors.state ? "border-red-400" : "border-sand"
            }`}
          >
            <option value="">Select a state</option>
            {INDIAN_STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
          {errors.state && <span className="mt-1 block text-xs font-normal text-red-600">{errors.state}</span>}

        </label>

        <label className="block text-sm font-medium text-brown-dark">

          PIN Code

          <input
            required
            type="text"
            name="pinCode"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={6}
            value={values.pinCode}
            onChange={(e) => setField("pinCode", e.target.value.replace(/\D/g, ""))}
            onBlur={() => handleBlur("pinCode")}
            aria-invalid={Boolean(errors.pinCode)}
            className={`mt-2 w-full rounded-xl border bg-cream px-4 py-3 text-sm outline-none focus:border-gold ${
              errors.pinCode ? "border-red-400" : "border-sand"
            }`}
            placeholder="6-digit PIN code"
          />
          {errors.pinCode && <span className="mt-1 block text-xs font-normal text-red-600">{errors.pinCode}</span>}

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


