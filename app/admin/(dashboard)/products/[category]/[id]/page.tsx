"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdminProductMediaUpload from "@/components/AdminProductMediaUpload";
import type { ProductMedia } from "@/lib/types";

interface ProductData {
  productId: string;
  categorySlug: string;
  name: string;
  price: number;
  originalPrice: number | null;
  discountPercent: number;
  description: string;
  material: string;
  dimensions: string;
  inStock: boolean;
  media: unknown;
}

export default function EditProductPage({
  params,
}: {
  params: Promise<{ category: string; id: string }>;
}) {
  const router = useRouter();
  const [resolved, setResolved] = useState<{ category: string; id: string } | null>(null);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [media, setMedia] = useState<ProductMedia[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    params.then(setResolved);
  }, [params]);

  useEffect(() => {
    if (!resolved) return;
    fetch(`/api/admin/products/${resolved.category}/${resolved.id}`)
      .then((r) => r.json())
      .then((data) => {
        setProduct(data.product);
        setMedia((data.product?.media as ProductMedia[]) ?? []);
      });
  }, [resolved]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!resolved) return;
    setSaving(true);
    setError("");

    const form = new FormData(e.currentTarget);

    const body = {
      name: String(form.get("name")),
      price: Number(form.get("price")),
      originalPrice: form.get("originalPrice") ? Number(form.get("originalPrice")) : null,
      discountPercent: Number(form.get("discountPercent") || 0),
      description: String(form.get("description")),
      material: String(form.get("material")),
      dimensions: String(form.get("dimensions")),
      inStock: form.get("inStock") === "on",
      media,
    };

    const res = await fetch(`/api/admin/products/${resolved.category}/${resolved.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      setError("Failed to save");
      setSaving(false);
      return;
    }

    router.push("/admin/products");
    router.refresh();
  }

  async function handleDelete() {
    if (!resolved || !confirm("Delete this product?")) return;
    await fetch(`/api/admin/products/${resolved.category}/${resolved.id}`, {
      method: "DELETE",
    });
    router.push("/admin/products");
    router.refresh();
  }

  if (!product) {
    return <p className="text-text-muted">Loading product…</p>;
  }

  return (
    <div>
      <Link href="/admin/products" className="text-sm text-brown hover:text-brown-dark">
        ← Back to products
      </Link>
      <h1 className="font-display mt-4 text-3xl font-semibold text-brown-dark">
        Edit {product.productId}
      </h1>

      <form onSubmit={handleSubmit} className="mt-8 max-w-2xl space-y-5 rounded-2xl border border-sand bg-white p-6">
        <label className="block text-sm font-medium text-brown-dark">
          Name
          <input name="name" defaultValue={product.name} required className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-brown-dark">
            Price (INR)
            <input name="price" type="number" defaultValue={product.price} required className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm" />
          </label>
          <label className="block text-sm font-medium text-brown-dark">
            Original Price
            <input name="originalPrice" type="number" defaultValue={product.originalPrice ?? ""} className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm" />
          </label>
        </div>
        <label className="block text-sm font-medium text-brown-dark">
          Discount %
          <input name="discountPercent" type="number" defaultValue={product.discountPercent} className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm" />
        </label>
        <label className="block text-sm font-medium text-brown-dark">
          Description
          <textarea name="description" rows={4} defaultValue={product.description} required className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm" />
        </label>
        <label className="block text-sm font-medium text-brown-dark">
          Material
          <input name="material" defaultValue={product.material} className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm" />
        </label>
        <label className="block text-sm font-medium text-brown-dark">
          Dimensions
          <input name="dimensions" defaultValue={product.dimensions} className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm" />
        </label>
        <div>
          <p className="text-sm font-medium text-brown-dark">Product images</p>
          <div className="mt-2">
            <AdminProductMediaUpload
              productId={product.productId}
              value={media}
              onChange={setMedia}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-brown-dark">
          <input type="checkbox" name="inStock" defaultChecked={product.inStock} />
          In stock
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
            className="rounded-full border border-red-200 px-8 py-3 text-sm font-medium text-red-700 transition hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </form>
    </div>
  );
}
