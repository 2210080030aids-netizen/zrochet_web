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
      name: String(form.get("name")),
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
      <p className="mt-2 text-sm text-text-muted">
        Enter a name only. The store URL and product IDs are created automatically.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 max-w-2xl space-y-5 rounded-2xl border border-sand bg-white p-6"
      >
        <label className="block text-sm font-medium text-brown-dark">
          Name
          <input
            name="name"
            required
            placeholder="e.g. Mini Bags"
            className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm"
          />
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
