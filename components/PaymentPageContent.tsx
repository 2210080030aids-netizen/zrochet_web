"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { formatCartPrice } from "@/lib/cart";
import { useCart } from "@/lib/cart-context";
import { buildUpiPaymentUrl } from "@/lib/upi";

type Step = "pay" | "proof";

interface PaymentSettings {
  upiId: string;
  upiPayeeName: string;
}

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart, isReady } = useCart();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const amountParam = searchParams.get("amount");
  const orderId = searchParams.get("orderId") ?? "";
  const method = searchParams.get("method") ?? "upi";

  const amount = amountParam ? parseFloat(amountParam) : NaN;
  const [step, setStep] = useState<Step>("pay");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);

  useEffect(() => {
    fetch("/api/settings/payment")
      .then((r) => r.json())
      .then((data) =>
        setPaymentSettings({
          upiId: data.upiId,
          upiPayeeName: data.upiPayeeName,
        })
      )
      .catch(() =>
        setPaymentSettings({
          upiId: "sarathbhushan04@oksbi",
          upiPayeeName: "Zrochet",
        })
      );
  }, []);

  useEffect(() => {
    if (
      method !== "upi" ||
      !orderId ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !paymentSettings
    ) {
      return;
    }

    const upiUrl = buildUpiPaymentUrl(
      amount,
      orderId,
      paymentSettings.upiId,
      paymentSettings.upiPayeeName
    );
    QRCode.toDataURL(upiUrl, {
      width: 280,
      margin: 2,
      color: { dark: "#3D2B1F", light: "#FFFFFF" },
    })
      .then(setQrDataUrl)
      .catch(() => setError("Could not generate QR code. Please use the UPI ID below."));
  }, [amount, orderId, method, paymentSettings]);

  useEffect(() => {
    return () => {
      if (proofPreview) URL.revokeObjectURL(proofPreview);
    };
  }, [proofPreview]);

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

  function handleProofSelect(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError(null);
    setProofFile(file);
    if (proofPreview) URL.revokeObjectURL(proofPreview);
    setProofPreview(URL.createObjectURL(file));
  }

  async function handleSubmitProof() {
    if (!proofFile) {
      setError("Please choose a screenshot of your payment.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const form = new FormData();
      form.append("file", proofFile);

      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/submit-payment`, {
        method: "POST",
        body: form,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit payment proof");
      }

      clearCart();
      router.push(
        `/payment/success?orderId=${encodeURIComponent(orderId)}&amount=${amount.toFixed(2)}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  const upiUrl =
    paymentSettings && Number.isFinite(amount)
      ? buildUpiPaymentUrl(amount, orderId, paymentSettings.upiId, paymentSettings.upiPayeeName)
      : null;

  if (step === "proof") {
    return (
      <div className="mx-auto max-w-md">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-gold">Step 2 of 2</p>
          <h1 className="font-display mt-2 text-3xl font-semibold text-brown-dark">
            Upload payment proof
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            Upload a screenshot from GPay, PhonePe, or your UPI app so we can verify your payment.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-sand bg-white p-6 luxury-shadow">
          <p className="text-sm text-text-muted">
            Order <span className="font-medium text-brown-dark">{orderId}</span>
          </p>
          <p className="mt-1 font-display text-2xl font-semibold text-brown-dark">
            {formatCartPrice(amount, "INR")}
          </p>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-6 w-full rounded-full border border-sand bg-cream py-3 text-sm font-semibold uppercase tracking-wider text-brown-dark transition hover:border-gold"
          >
            Choose file
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleProofSelect(e.target.files)}
          />

          {proofPreview && (
            <div className="relative mt-4 aspect-[3/4] w-full overflow-hidden rounded-xl border border-sand bg-cream">
              <Image
                src={proofPreview}
                alt="Payment screenshot preview"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          )}

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          <button
            type="button"
            disabled={submitting || !proofFile}
            onClick={handleSubmitProof}
            className="mt-6 w-full rounded-full bg-brown-dark py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-brown disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit payment proof"}
          </button>

          <button
            type="button"
            onClick={() => setStep("pay")}
            className="mt-3 w-full text-sm font-medium text-brown transition hover:text-brown-dark"
          >
            ← Back to QR payment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="text-center">
        <p className="text-xs font-medium uppercase tracking-[0.15em] text-gold">Step 1 of 2 · Pay with GPay / UPI</p>
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
          <p className="mt-1 font-mono text-sm font-medium text-brown-dark">
            {paymentSettings?.upiId ?? "Loading…"}
          </p>
        </div>

        {upiUrl && (
          <a
            href={upiUrl}
            className="mt-4 inline-block text-sm font-medium text-brown transition hover:text-brown-dark"
          >
            Open in UPI app →
          </a>
        )}
      </div>

      <div className="mt-6 space-y-3">
        <button
          type="button"
          onClick={() => setStep("proof")}
          className="w-full rounded-full bg-brown-dark py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-brown"
        >
          I&apos;ve completed payment
        </button>
        <p className="text-center text-xs text-text-muted">
          Next: upload your payment screenshot for verification.
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
