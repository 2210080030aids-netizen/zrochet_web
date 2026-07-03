"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewCollectionPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const body = {
      slug: String(form.get("slug")),
      name: String(form.get("name")),
      label: String(form.get("label")),
      pattern: String(form.get("pattern") || ""),
      defaultPrice: Number(form.get("defaultPrice")),
      sortOrder: Number(form.get("sortOrder") || 0),
    };

    const res = await fetch("/api/admin/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to create collection");
      setSaving(false);
      return;
    }

    router.push("/admin/collections");
    router.refresh();
  }

  return (
    <div>
      <Link href="/admin/collections" className="text-sm text-brown hover:text-brown-dark">
        ← Back to collections
      </Link>
      <h1 className="font-display mt-4 text-3xl font-semibold text-brown-dark">Add Collection</h1>

      <form onSubmit={handleSubmit} className="mt-8 max-w-2xl space-y-5 rounded-2xl border border-sand bg-white p-6">
        <label className="block text-sm font-medium text-brown-dark">
          Slug (URL, e.g. mini-bags)
          <input name="slug" required placeholder="mini-bags" className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm" />
        </label>
        <label className="block text-sm font-medium text-brown-dark">
          Display Name
          <input name="name" required placeholder="Mini Bag" className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm" />
        </label>
        <label className="block text-sm font-medium text-brown-dark">
          Label (short tag)
          <input name="label" required placeholder="Mini Bag Collection" className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm" />
        </label>
        <label className="block text-sm font-medium text-brown-dark">
          Image pattern (optional, e.g. minibag)
          <input name="pattern" placeholder="minibag" className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm" />
        </label>
        <label className="block text-sm font-medium text-brown-dark">
          Default Price (INR)
          <input name="defaultPrice" type="number" min="1" defaultValue={500} required className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm" />
        </label>
        <label className="block text-sm font-medium text-brown-dark">
          Sort Order
          <input name="sortOrder" type="number" defaultValue={0} className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm" />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-brown-dark px-8 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-brown disabled:opacity-50"
        >
          {saving ? "Saving…" : "Create Collection"}
        </button>
      </form>
    </div>
  );
}
