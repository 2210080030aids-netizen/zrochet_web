"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Collection {
  slug: string;
  name: string;
  _count?: { products: number };
}

export default function EditCollectionPage() {
  const router = useRouter();
  const params = useParams();
  const slug = String(params.slug);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/collections/${encodeURIComponent(slug)}`)
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

    const productCount = collection._count?.products ?? 0;
    const confirmed = confirm(
      productCount > 0
        ? `Delete "${collection.name}" and all ${productCount} product(s) in it? This cannot be undone.`
        : `Delete "${collection.name}"? This cannot be undone.`
    );
    if (!confirmed) return;

    if (productCount > 0) {
      const forceConfirmed = confirm(
        `Last chance: ${productCount} product(s) will be permanently removed from your store. Continue?`
      );
      if (!forceConfirmed) return;
    }

    setDeleting(true);
    setError("");

    const url =
      productCount > 0
        ? `/api/admin/collections/${encodeURIComponent(collection.slug)}?force=true`
        : `/api/admin/collections/${encodeURIComponent(collection.slug)}`;

    const res = await fetch(url, { method: "DELETE" });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to delete");
      setDeleting(false);
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
      {(collection._count?.products ?? 0) > 0 && (
        <p className="mt-2 text-sm text-amber-800">
          This collection has {collection._count?.products} product(s). Deleting it will remove those
          products from your store.
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-8 max-w-2xl space-y-5 rounded-2xl border border-sand bg-white p-6"
      >
        <label className="block text-sm font-medium text-brown-dark">
          Name
          <input
            name="name"
            required
            defaultValue={collection.name}
            className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm"
          />
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
            disabled={deleting}
            className="rounded-full border border-red-200 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-red-700 transition hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete Collection"}
          </button>
        </div>
      </form>
    </div>
  );
}
