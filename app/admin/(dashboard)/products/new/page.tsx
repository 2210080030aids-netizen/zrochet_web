"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Collection {
  slug: string;
  name: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/collections")
      .then((r) => r.json())
      .then((data) => setCollections(data.collections ?? []));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const mediaRaw = String(form.get("media") || "[]");

    let media = [];
    try {
      media = JSON.parse(mediaRaw);
    } catch {
      setError("Media must be valid JSON array");
      setSaving(false);
      return;
    }

    const body = {
      productId: String(form.get("productId")),
      categorySlug: String(form.get("categorySlug")),
      name: String(form.get("name")),
      price: Number(form.get("price")),
      description: String(form.get("description")),
      inStock: form.get("inStock") === "on",
      media,
    };

    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to create product");
      setSaving(false);
      return;
    }

    router.push("/admin/products");
    router.refresh();
  }

  return (
    <div>
      <Link href="/admin/products" className="text-sm text-brown hover:text-brown-dark">
        ← Back to products
      </Link>
      <h1 className="font-display mt-4 text-3xl font-semibold text-brown-dark">Add Product</h1>

      <form onSubmit={handleSubmit} className="mt-8 max-w-2xl space-y-5 rounded-2xl border border-sand bg-white p-6">
        <label className="block text-sm font-medium text-brown-dark">
          Product ID (e.g. B10)
          <input name="productId" required className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm" />
        </label>
        <label className="block text-sm font-medium text-brown-dark">
          Collection
          <select name="categorySlug" required className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm">
            {collections.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-brown-dark">
          Name
          <input name="name" required className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm" />
        </label>
        <label className="block text-sm font-medium text-brown-dark">
          Price (INR)
          <input name="price" type="number" min="1" required className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm" />
        </label>
        <label className="block text-sm font-medium text-brown-dark">
          Description
          <textarea name="description" rows={4} required className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm" />
        </label>
        <label className="block text-sm font-medium text-brown-dark">
          Media JSON
          <textarea
            name="media"
            rows={4}
            defaultValue={'[{"type":"image","src":"/images/welcome.png","label":"Front View"}]'}
            className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 font-mono text-xs"
          />
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-brown-dark">
          <input type="checkbox" name="inStock" defaultChecked />
          In stock
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-brown-dark px-8 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-brown disabled:opacity-50"
        >
          {saving ? "Saving…" : "Create Product"}
        </button>
      </form>
    </div>
  );
}
