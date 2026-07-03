"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import QRCode from "qrcode";
import { formatCartPrice } from "@/lib/cart";
import { useCart } from "@/lib/cart-context";
import { buildUpiPaymentUrl, UPI_ID } from "@/lib/upi";

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart, isReady } = useCart();

  const amountParam = searchParams.get("amount");
  const orderId = searchParams.get("orderId") ?? "";
  const method = searchParams.get("method") ?? "upi";

  const amount = amountParam ? parseFloat(amountParam) : NaN;
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (method !== "upi" || !orderId || !Number.isFinite(amount) || amount <= 0) return;

    const upiUrl = buildUpiPaymentUrl(amount, orderId);
    QRCode.toDataURL(upiUrl, {
      width: 280,
      margin: 2,
      color: { dark: "#3D2B1F", light: "#FFFFFF" },
    })
      .then(setQrDataUrl)
      .catch(() => setError("Could not generate QR code. Please use the UPI ID below."));
  }, [amount, orderId, method]);

  if (!isReady) {
    return <p className="text-text-muted">Loading payment…</p>;
  }

  if (method !== "upi") {
    return (
      <div className="text-center">
        <h1 className="font-display text-2xl font-semibold text-brown-dark">Card payments</h1>
        <p className="mt-3 text-text-muted">Card checkout is not available yet. Please use GPay / UPI.</p>
        <Link href="/checkout" className="mt-6 inline-block text-sm font-medium text-brown">
          ← Back to checkout
        </Link>
      </div>
    );
  }

  if (!orderId || !Number.isFinite(amount) || amount <= 0) {
    return (
      <div className="text-center">
        <h1 className="font-display text-2xl font-semibold text-brown-dark">Invalid payment link</h1>
        <p className="mt-3 text-text-muted">Start checkout again to generate a new payment QR.</p>
        <Link href="/checkout" className="mt-6 inline-block text-sm font-medium text-brown">
          ← Back to checkout
        </Link>
      </div>
    );
  }

  async function handlePaymentComplete() {
    try {
      await fetch(`/api/orders/${encodeURIComponent(orderId)}/complete`, {
        method: "POST",
      });
    } catch {
      // still redirect — admin can verify manually
    }
    clearCart();
    router.push(
      `/payment/success?orderId=${encodeURIComponent(orderId)}&amount=${amount.toFixed(2)}`
    );
  }

  const upiUrl = buildUpiPaymentUrl(amount, orderId);

  return (
    <div className="mx-auto max-w-md">
      <div className="text-center">
        <p className="text-xs font-medium uppercase tracking-[0.15em] text-gold">Pay with GPay / UPI</p>
        <h1 className="font-display mt-2 text-3xl font-semibold text-brown-dark">Scan to pay</h1>
        <p className="mt-2 text-sm text-text-muted">
          Order <span className="font-medium text-brown-dark">{orderId}</span>
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-sand bg-white p-6 text-center luxury-shadow">
        <p className="font-display text-4xl font-semibold text-brown-dark">
          {formatCartPrice(amount, "INR")}
        </p>
        <p className="mt-1 text-xs text-text-muted">Amount is pre-filled when you scan</p>

        <div className="mx-auto mt-6 flex h-[280px] w-[280px] items-center justify-center rounded-xl border border-sand bg-cream">
          {error ? (
            <p className="px-4 text-sm text-text-muted">{error}</p>
          ) : qrDataUrl ? (
            <Image
              src={qrDataUrl}
              alt="UPI payment QR code"
              width={280}
              height={280}
              className="rounded-lg"
              unoptimized
            />
          ) : (
            <p className="text-sm text-text-muted">Generating QR…</p>
          )}
        </div>

        <div className="mt-6 rounded-xl bg-beige/60 px-4 py-3 text-left">
          <p className="text-xs font-medium uppercase tracking-wider text-brown">UPI ID</p>
          <p className="mt-1 font-mono text-sm font-medium text-brown-dark">{UPI_ID}</p>
        </div>

        <a
          href={upiUrl}
          className="mt-4 inline-block text-sm font-medium text-brown transition hover:text-brown-dark"
        >
          Open in UPI app →
        </a>
      </div>

      <div className="mt-6 space-y-3">
        <button
          type="button"
          onClick={handlePaymentComplete}
          className="w-full rounded-full bg-brown-dark py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-brown"
        >
          I&apos;ve completed payment
        </button>
        <p className="text-center text-xs text-text-muted">
          Tap after paying in GPay, PhonePe, or any UPI app. We&apos;ll confirm shortly.
        </p>
        <Link
          href="/checkout"
          className="block text-center text-sm font-medium text-brown transition hover:text-brown-dark"
        >
          ← Back to checkout
        </Link>
      </div>
    </div>
  );
}

export default function PaymentPageContent() {
  return (
    <Suspense fallback={<p className="text-text-muted">Loading payment…</p>}>
      <PaymentContent />
    </Suspense>
  );
}
