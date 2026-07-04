"use client";

import { useEffect, useState } from "react";
import AdminEmailTestPanel from "@/components/AdminEmailTestPanel";

interface Settings {
  email: string;
  phone: string;
  address: string;
  footerText: string;
  heroImage: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => setSettings(data.settings));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const form = new FormData(e.currentTarget);
    const body = {
      email: String(form.get("email")),
      phone: String(form.get("phone")),
      address: String(form.get("address")),
      footerText: String(form.get("footerText")),
      heroImage: String(form.get("heroImage")),
    };

    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);
    if (res.ok) {
      setMessage("Settings saved successfully.");
      setSettings(body);
    } else {
      setMessage("Failed to save settings.");
    }
  }

  if (!settings) {
    return <p className="text-text-muted">Loading settings…</p>;
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-brown-dark">Site Settings</h1>
      <p className="mt-2 text-text-muted">Update contact details and homepage content.</p>

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
        <label className="block text-sm font-medium text-brown-dark">
          Hero image path
          <input name="heroImage" defaultValue={settings.heroImage} required className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm" />
        </label>
        {message && <p className="text-sm text-emerald-700">{message}</p>}
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-brown-dark px-8 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-brown disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </form>

      <AdminEmailTestPanel />
    </div>
  );
}
