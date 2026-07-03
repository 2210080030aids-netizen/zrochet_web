"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Collection {
  slug: string;
  name: string;
  label: string;
  pattern: string | null;
  defaultPrice: number;
  sortOrder: number;
  _count?: { products: number };
}

export default function EditCollectionPage() {
  const router = useRouter();
  const params = useParams();
  const slug = String(params.slug);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/collections/${slug}`)
      .then((r) => r.json())
      .then((data) => setCollection(data.collection ?? null));
  }, [slug]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!collection) return;
    setSaving(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const body = {
      name: String(form.get("name")),
      label: String(form.get("label")),
      pattern: String(form.get("pattern") || ""),
      defaultPrice: Number(form.get("defaultPrice")),
      sortOrder: Number(form.get("sortOrder")),
    };

    const res = await fetch(`/api/admin/collections/${collection.slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to update");
      setSaving(false);
      return;
    }

    router.push("/admin/collections");
    router.refresh();
  }

  async function handleDelete() {
    if (!collection) return;
    if (!confirm("Delete this collection? Only works if it has no products.")) return;

    const res = await fetch(`/api/admin/collections/${collection.slug}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to delete");
      return;
    }

    router.push("/admin/collections");
    router.refresh();
  }

  if (!collection) {
    return <p className="text-text-muted">Loading collection…</p>;
  }

  return (
    <div>
      <Link href="/admin/collections" className="text-sm text-brown hover:text-brown-dark">
        ← Back to collections
      </Link>
      <h1 className="font-display mt-4 text-3xl font-semibold text-brown-dark">Edit Collection</h1>
      <p className="mt-2 font-mono text-sm text-text-muted">{collection.slug}</p>

      <form onSubmit={handleSubmit} className="mt-8 max-w-2xl space-y-5 rounded-2xl border border-sand bg-white p-6">
        <label className="block text-sm font-medium text-brown-dark">
          Display Name
          <input name="name" required defaultValue={collection.name} className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm" />
        </label>
        <label className="block text-sm font-medium text-brown-dark">
          Label
          <input name="label" required defaultValue={collection.label} className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm" />
        </label>
        <label className="block text-sm font-medium text-brown-dark">
          Image pattern
          <input name="pattern" defaultValue={collection.pattern ?? ""} className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm" />
        </label>
        <label className="block text-sm font-medium text-brown-dark">
          Default Price (INR)
          <input name="defaultPrice" type="number" min="1" required defaultValue={collection.defaultPrice} className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm" />
        </label>
        <label className="block text-sm font-medium text-brown-dark">
          Sort Order
          <input name="sortOrder" type="number" defaultValue={collection.sortOrder} className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm" />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-brown-dark px-8 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-brown disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-full border border-red-200 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-red-700 transition hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </form>
    </div>
  );
}
