"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import AdminEmailTestPanel from "@/components/AdminEmailTestPanel";

interface Settings {
  email: string;
  phone: string;
  address: string;
  footerText: string;
  heroImage: string;
  upiId: string;
  upiPayeeName: string;
  instagramUrl: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => setSettings(data.settings));
  }, []);

  async function handleHeroUpload(file: File) {
    setUploadingHero(true);
    setError("");
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/admin/settings/hero-image", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setUploadingHero(false);

    if (!res.ok) {
      setError(data.error || "Failed to upload hero image");
      return;
    }

    setSettings((prev) => (prev ? { ...prev, heroImage: data.heroImage } : prev));
    setMessage("Hero image updated.");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const form = new FormData(e.currentTarget);
    const body = {
      email: String(form.get("email")),
      phone: String(form.get("phone")),
      address: String(form.get("address")),
      footerText: String(form.get("footerText")),
      heroImage: settings?.heroImage ?? String(form.get("heroImage")),
      upiId: String(form.get("upiId")),
      upiPayeeName: String(form.get("upiPayeeName")),
      instagramUrl: String(form.get("instagramUrl")),
    };

    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      setSettings(data.settings);
      setMessage("Settings saved successfully.");
    } else {
      setError("Failed to save settings.");
    }
  }

  if (!settings) {
    return <p className="text-text-muted">Loading settings…</p>;
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-brown-dark">Site Settings</h1>
      <p className="mt-2 text-text-muted">Update contact details, homepage content, and payment settings.</p>

      <form onSubmit={handleSubmit} className="mt-8 max-w-2xl space-y-5 rounded-2xl border border-sand bg-white p-6">
        <label className="block text-sm font-medium text-brown-dark">
          Email
          <input name="email" defaultValue={settings.email} required className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm" />
        </label>
        <label className="block text-sm font-medium text-brown-dark">
          Phone
          <input name="phone" defaultValue={settings.phone} required className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm" />
        </label>
        <label className="block text-sm font-medium text-brown-dark">
          Address
          <textarea name="address" rows={3} defaultValue={settings.address} required className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm" />
        </label>
        <label className="block text-sm font-medium text-brown-dark">
          Footer text
          <textarea name="footerText" rows={3} defaultValue={settings.footerText} required className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm" />
        </label>

        <div>
          <p className="text-sm font-medium text-brown-dark">Hero image</p>
          <p className="mt-1 text-xs text-text-muted">
            Choose an image from your computer for the homepage hero section.
          </p>
          <div className="relative mt-3 aspect-[4/3] max-w-sm overflow-hidden rounded-xl border border-sand bg-cream">
            <Image
              src={settings.heroImage}
              alt="Current hero image"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleHeroUpload(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={uploadingHero}
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 rounded-full border border-sand px-5 py-2.5 text-sm font-medium text-brown-dark transition hover:bg-cream disabled:opacity-50"
          >
            {uploadingHero ? "Uploading…" : "Choose from computer"}
          </button>
        </div>

        <label className="block text-sm font-medium text-brown-dark">
          UPI ID
          <input
            name="upiId"
            defaultValue={settings.upiId}
            required
            placeholder="yourname@upi"
            className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 font-mono text-sm"
          />
        </label>
        <label className="block text-sm font-medium text-brown-dark">
          UPI payee name
          <input
            name="upiPayeeName"
            defaultValue={settings.upiPayeeName}
            required
            placeholder="Zrochet"
            className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm"
          />
          <span className="mt-1 block text-xs text-text-muted">
            Shown on the GPay / UPI QR code during checkout.
          </span>
        </label>

        <label className="block text-sm font-medium text-brown-dark">
          Instagram account
          <input
            name="instagramUrl"
            defaultValue={settings.instagramUrl}
            required
            placeholder="https://www.instagram.com/zrochet_12 or @zrochet_12"
            className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm"
          />
          <span className="mt-1 block text-xs text-text-muted">
            Shown in the footer Contact section. Paste the full profile URL or @handle.
          </span>
        </label>

        {message && <p className="text-sm text-emerald-700">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving || uploadingHero}
          className="rounded-full bg-brown-dark px-8 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-brown disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </form>

      <AdminEmailTestPanel />
    </div>
  );
}
