"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdminProductMediaUpload from "@/components/AdminProductMediaUpload";
import AdminSizeSelector, { ONE_SIZE } from "@/components/AdminSizeSelector";
import AdminHighlightsSelector from "@/components/AdminHighlightsSelector";
import { handleAdminUnauthorized } from "@/components/AdminSessionGuard";
import { useAdminHref } from "@/components/AdminKeyProvider";
import { isEphemeralMediaSrc } from "@/lib/product-media-storage";
import {
  DEFAULT_HIGHLIGHT_KEYS,
  type ProductHighlightKey,
} from "@/lib/product-highlights";
import type { ProductMedia } from "@/lib/types";

interface Collection {
  slug: string;
  name: string;
}

interface SiblingProduct {
  productId: string;
  name: string;
  colors: unknown;
}

const STANDALONE_VALUE = "__standalone__";

export default function NewProductPage() {
  const router = useRouter();
  const adminHref = useAdminHref();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [categorySlug, setCategorySlug] = useState("");
  const [siblingProducts, setSiblingProducts] = useState<SiblingProduct[]>([]);
  const [productId, setProductId] = useState("");
  const [colorName, setColorName] = useState("");
  const [colorSwatch, setColorSwatch] = useState("#C4A484");
  const [linkToProductId, setLinkToProductId] = useState("");
  const [sizes, setSizes] = useState<string[]>([ONE_SIZE]);
  const [highlights, setHighlights] = useState<ProductHighlightKey[]>([
    ...DEFAULT_HIGHLIGHT_KEYS,
  ]);
  const [media, setMedia] = useState<ProductMedia[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/collections")
      .then((r) => r.json())
      .then((data) => {
        const items = data.collections ?? [];
        setCollections(items);
        if (items[0]?.slug) setCategorySlug(items[0].slug);
      });
  }, []);

  useEffect(() => {
    if (!categorySlug) return;

    fetch(`/api/admin/products?categorySlug=${encodeURIComponent(categorySlug)}`)
      .then((r) => r.json())
      .then((data) => {
        const siblings = data.products ?? [];
        setSiblingProducts(siblings);
        setProductId(data.nextProductId ?? "");
        if (siblings.length > 0) {
          setLinkToProductId(siblings[0].productId);
        } else {
          setLinkToProductId("");
        }
      });
  }, [categorySlug]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    if (media.length === 0) {
      setError("Add at least one product image.");
      setSaving(false);
      return;
    }

    if (media.some((item) => isEphemeralMediaSrc(item.src))) {
      setError("Wait for all image uploads to finish before saving.");
      setSaving(false);
      return;
    }

    if (!colorName.trim()) {
      setError("Color name is required.");
      setSaving(false);
      return;
    }

    if (!sizes.length) {
      setError("Add at least one size, or choose One Size.");
      setSaving(false);
      return;
    }

    const form = new FormData(e.currentTarget);
    const body = {
      categorySlug: String(form.get("categorySlug")),
      name: String(form.get("name")),
      price: Number(form.get("price")),
      description: String(form.get("description")),
      quantity: Number(form.get("quantity")),
      colorName: colorName.trim(),
      colorSwatch,
      sizes,
      highlights,
      linkToProductId: linkToProductId === STANDALONE_VALUE ? null : linkToProductId || null,
      standalone: linkToProductId === STANDALONE_VALUE,
      media,
    };

    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.status === 401) {
      await handleAdminUnauthorized();
      return;
    }

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to create product");
      setSaving(false);
      return;
    }

    router.push(adminHref("/admin/products"));
    router.refresh();
  }

  return (
    <div>
      <Link href={adminHref("/admin/products")} className="text-sm text-brown hover:text-brown-dark">
        ← Back to products
      </Link>
      <h1 className="font-display mt-4 text-3xl font-semibold text-brown-dark">Add Product</h1>

      <form onSubmit={handleSubmit} className="mt-8 max-w-2xl space-y-5 rounded-2xl border border-sand bg-white p-6">
        <label className="block text-sm font-medium text-brown-dark">
          Product ID (auto-assigned)
          <input
            name="productId"
            readOnly
            value={productId}
            className="mt-2 w-full rounded-xl border border-sand bg-sand/40 px-4 py-3 text-sm text-text-muted"
          />
          <span className="mt-2 block text-xs text-text-muted">
            The next ID is assigned automatically when you save (e.g. mb1, mb2 for Mini Bags).
          </span>
        </label>
        <label className="block text-sm font-medium text-brown-dark">
          Collection
          <select
            name="categorySlug"
            required
            value={categorySlug}
            onChange={(e) => {
              setCategorySlug(e.target.value);
            }}
            className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm"
          >
            {collections.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-brown-dark">
          Name
          <input name="name" required className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-brown-dark">
            Color name
            <input
              value={colorName}
              onChange={(e) => setColorName(e.target.value)}
              placeholder="e.g. Blush Pink"
              required
              className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm"
            />
          </label>
          <label className="block text-sm font-medium text-brown-dark">
            Color swatch
            <div className="mt-2 flex items-center gap-3">
              <input
                type="color"
                value={colorSwatch}
                onChange={(e) => setColorSwatch(e.target.value)}
                className="h-12 w-12 cursor-pointer rounded-lg border border-sand bg-white"
              />
              <input
                value={colorSwatch}
                onChange={(e) => setColorSwatch(e.target.value)}
                className="w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm font-mono"
              />
            </div>
          </label>
        </div>
        <div>
          <AdminSizeSelector sizes={sizes} onChange={setSizes} />
        </div>
        <label className="block text-sm font-medium text-brown-dark">
          Same bag, different colour
          <select
            value={linkToProductId}
            onChange={(e) => setLinkToProductId(e.target.value)}
            className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm"
          >
            <option value={STANDALONE_VALUE}>Standalone colour (new bag style)</option>
            {siblingProducts.map((product) => (
              <option key={product.productId} value={product.productId}>
                Link to {product.productId} — {product.name}
              </option>
            ))}
          </select>
          <span className="mt-2 block text-xs text-text-muted">
            When this collection already has bags, new colours are added to the same colour switcher
            on every linked bag (e.g. blue, pink → blue, pink, red). Choose standalone only for a
            completely new bag style.
          </span>
        </label>
        <label className="block text-sm font-medium text-brown-dark">
          Price (INR)
          <input name="price" type="number" min="1" required className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm" />
        </label>
        <label className="block text-sm font-medium text-brown-dark">
          Description
          <textarea name="description" rows={4} required className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm" />
        </label>

        <div>
          <p className="text-sm font-medium text-brown-dark">Product images</p>
          <div className="mt-2">
            <AdminProductMediaUpload
              productId={productId}
              value={media}
              onChange={setMedia}
            />
          </div>
        </div>

        <label className="block text-sm font-medium text-brown-dark">
          Quantity in stock
          <input
            name="quantity"
            type="number"
            min="0"
            step="1"
            defaultValue={1}
            required
            className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm"
          />
          <span className="mt-2 block text-xs text-text-muted">
            Set to 0 to mark the product out of stock.
          </span>
        </label>

        <AdminHighlightsSelector value={highlights} onChange={setHighlights} />

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
