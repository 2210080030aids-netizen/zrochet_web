"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import AdminEmailTestPanel from "@/components/AdminEmailTestPanel";
import { handleAdminUnauthorized } from "@/components/AdminSessionGuard";

interface Settings {
  email: string;
  phone: string;
  address: string;
  footerText: string;
  heroImage: string;
  upiId: string;
  upiPayeeName: string;
  instagramUrl: string;
  heroEyebrow: string;
  heroTitle: string;
  heroText: string;
  storyImage: string;
  storyTitle: string;
  storyText: string;
  storyPoint1: string;
  storyPoint2: string;
  storyPoint3: string;
}

type SettingsTab = "contact" | "firstpage" | "payment" | "email";

const TABS: { id: SettingsTab; label: string }[] = [
  { id: "firstpage", label: "First Page" },
  { id: "contact", label: "Contact" },
  { id: "payment", label: "Payment" },
  { id: "email", label: "Check email" },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>("firstpage");
  const [saving, setSaving] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingStory, setUploadingStory] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const storyFileInputRef = useRef<HTMLInputElement>(null);

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

    if (res.status === 401) {
      setUploadingHero(false);
      await handleAdminUnauthorized();
      return;
    }

    const data = await res.json();
    setUploadingHero(false);

    if (!res.ok) {
      setError(data.error || "Failed to upload hero image");
      return;
    }

    setSettings((prev) => (prev ? { ...prev, heroImage: data.heroImage } : prev));
    setMessage("Hero image updated.");
  }

  async function handleStoryUpload(file: File) {
    setUploadingStory(true);
    setError("");
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/admin/settings/story-image", {
      method: "POST",
      body: formData,
    });

    if (res.status === 401) {
      setUploadingStory(false);
      await handleAdminUnauthorized();
      return;
    }

    const data = await res.json();
    setUploadingStory(false);

    if (!res.ok) {
      setError(data.error || "Failed to upload story image");
      return;
    }

    setSettings((prev) => (prev ? { ...prev, storyImage: data.storyImage } : prev));
    setMessage("Story image updated.");
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
      heroEyebrow: String(form.get("heroEyebrow")),
      heroTitle: String(form.get("heroTitle")),
      heroText: String(form.get("heroText")),
      storyImage: settings?.storyImage ?? "",
      storyTitle: String(form.get("storyTitle")),
      storyText: String(form.get("storyText")),
      storyPoint1: String(form.get("storyPoint1")),
      storyPoint2: String(form.get("storyPoint2")),
      storyPoint3: String(form.get("storyPoint3")),
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
    } else if (res.status === 401) {
      await handleAdminUnauthorized();
    } else {
      setError("Failed to save settings.");
    }
  }

  if (!settings) {
    return <p className="text-text-muted">Loading settings…</p>;
  }

  const tabButtonClass = (tab: SettingsTab) =>
    `rounded-full px-5 py-2 text-sm font-medium transition ${
      activeTab === tab
        ? "bg-brown-dark text-white"
        : "border border-sand text-brown-dark hover:bg-cream"
    }`;

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-brown-dark">Site Settings</h1>
      <p className="mt-2 text-text-muted">Update contact details, homepage content, and payment settings.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={tabButtonClass(tab.id)}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        className={`mt-6 max-w-2xl space-y-5 rounded-2xl border border-sand bg-white p-6 ${
          activeTab === "email" ? "hidden" : ""
        }`}
      >
        {/* Contact */}
        <div className={activeTab === "contact" ? "space-y-5" : "hidden"}>
          <label className="block text-sm font-medium text-brown-dark">
            Email
            <input name="email" defaultValue={settings.email} className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm" />
          </label>
          <label className="block text-sm font-medium text-brown-dark">
            Phone
            <input name="phone" defaultValue={settings.phone} className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm" />
          </label>
          <label className="block text-sm font-medium text-brown-dark">
            Address
            <textarea name="address" rows={3} defaultValue={settings.address} className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm" />
          </label>
          <label className="block text-sm font-medium text-brown-dark">
            Instagram account
            <input
              name="instagramUrl"
              defaultValue={settings.instagramUrl}
              placeholder="https://www.instagram.com/zrochet_12 or @zrochet_12"
              className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm"
            />
            <span className="mt-1 block text-xs text-text-muted">
              Shown in the footer Contact section. Paste the full profile URL or @handle.
            </span>
          </label>
          <label className="block text-sm font-medium text-brown-dark">
            Footer text
            <textarea name="footerText" rows={3} defaultValue={settings.footerText} className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm" />
          </label>
        </div>

        {/* First Page */}
        <div className={activeTab === "firstpage" ? "space-y-5" : "hidden"}>
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
              {uploadingHero ? "Uploading…" : "Choose from device"}
            </button>
          </div>

          <label className="block text-sm font-medium text-brown-dark">
            Eyebrow text
            <input
              name="heroEyebrow"
              defaultValue={settings.heroEyebrow}
              placeholder="Artisan Made · One of a Kind"
              className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm"
            />
            <span className="mt-1 block text-xs text-text-muted">
              Small uppercase text shown above the hero title.
            </span>
          </label>

          <label className="block text-sm font-medium text-brown-dark">
            Hero title
            <input
              name="heroTitle"
              defaultValue={settings.heroTitle}
              placeholder="Handcrafted Crochet Creations"
              className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm"
            />
          </label>

          <label className="block text-sm font-medium text-brown-dark">
            Hero description
            <textarea
              name="heroText"
              rows={3}
              defaultValue={settings.heroText}
              className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm"
            />
          </label>

          <div className="border-t border-sand pt-5">
            <p className="text-sm font-semibold text-brown-dark">Our Story section</p>
            <p className="mt-1 text-xs text-text-muted">
              Controls the &ldquo;Our Story&rdquo; block further down the homepage.
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-brown-dark">Story image</p>
            <p className="mt-1 text-xs text-text-muted">
              Choose the image shown beside the story text.
            </p>
            <div className="relative mt-3 aspect-[4/3] max-w-sm overflow-hidden rounded-xl border border-sand bg-cream">
              {settings.storyImage ? (
                <Image
                  src={settings.storyImage}
                  alt="Current story image"
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center px-4 text-center text-xs text-text-muted">
                  No custom image yet — a product photo is shown until you upload one.
                </div>
              )}
            </div>
            <input
              ref={storyFileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleStoryUpload(file);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              disabled={uploadingStory}
              onClick={() => storyFileInputRef.current?.click()}
              className="mt-3 rounded-full border border-sand px-5 py-2.5 text-sm font-medium text-brown-dark transition hover:bg-cream disabled:opacity-50"
            >
              {uploadingStory ? "Uploading…" : "Choose from device"}
            </button>
          </div>

          <label className="block text-sm font-medium text-brown-dark">
            Title
            <input
              name="storyTitle"
              defaultValue={settings.storyTitle}
              className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm"
            />
          </label>

          <label className="block text-sm font-medium text-brown-dark">
            Text
            <textarea
              name="storyText"
              rows={6}
              defaultValue={settings.storyText}
              className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm"
            />
            <span className="mt-1 block text-xs text-text-muted">
              Separate paragraphs with a blank line.
            </span>
          </label>

          <div className="space-y-3">
            <p className="text-sm font-medium text-brown-dark">Highlight points</p>
            <input
              name="storyPoint1"
              defaultValue={settings.storyPoint1}
              placeholder="Point 1"
              className="w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm"
            />
            <input
              name="storyPoint2"
              defaultValue={settings.storyPoint2}
              placeholder="Point 2"
              className="w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm"
            />
            <input
              name="storyPoint3"
              defaultValue={settings.storyPoint3}
              placeholder="Point 3"
              className="w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm"
            />
            <span className="block text-xs text-text-muted">
              Leave a point empty to hide it. Each shows with a ✦ marker.
            </span>
          </div>
        </div>

        {/* Payment */}
        <div className={activeTab === "payment" ? "space-y-5" : "hidden"}>
          <label className="block text-sm font-medium text-brown-dark">
            UPI ID
            <input
              name="upiId"
              defaultValue={settings.upiId}
              placeholder="yourname@upi"
              className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 font-mono text-sm"
            />
          </label>
          <label className="block text-sm font-medium text-brown-dark">
            UPI payee name
            <input
              name="upiPayeeName"
              defaultValue={settings.upiPayeeName}
              placeholder="Zrochet"
              className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm"
            />
            <span className="mt-1 block text-xs text-text-muted">
              Shown on the GPay / UPI QR code during checkout.
            </span>
          </label>
        </div>

        {message && <p className="text-sm text-emerald-700">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving || uploadingHero || uploadingStory}
          className="rounded-full bg-brown-dark px-8 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-brown disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </form>

      {activeTab === "email" && <AdminEmailTestPanel />}
    </div>
  );
}
