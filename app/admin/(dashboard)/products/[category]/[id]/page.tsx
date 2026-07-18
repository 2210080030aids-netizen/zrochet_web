"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdminProductMediaUpload from "@/components/AdminProductMediaUpload";
import AdminSizeSelector, { ONE_SIZE } from "@/components/AdminSizeSelector";
import AdminHighlightsSelector from "@/components/AdminHighlightsSelector";
import { handleAdminUnauthorized } from "@/components/AdminSessionGuard";
import { getProductColorFields } from "@/lib/color-variants";
import { isEphemeralMediaSrc } from "@/lib/product-media-storage";
import {
  DEFAULT_HIGHLIGHT_KEYS,
  normalizeProductHighlights,
  type ProductHighlightKey,
} from "@/lib/product-highlights";
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
  quantity: number;
  inStock: boolean;
  colors: unknown;
  colorVariants: unknown;
  sizes: unknown;
  highlights: unknown;
  media: unknown;
}

interface SiblingProduct {
  productId: string;
  name: string;
}

const STANDALONE_VALUE = "__standalone__";

function parseProductSizes(value: unknown): string[] {
  if (Array.isArray(value) && value.length > 0) {
    return value.map(String);
  }
  return [ONE_SIZE];
}

/** Discount % from original (MRP) and selling price. */
function calcDiscountPercent(price: number, originalPrice: number | null): number {
  if (!originalPrice || originalPrice <= 0 || price <= 0 || originalPrice <= price) {
    return 0;
  }
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

export default function EditProductPage({
  params,
}: {
  params: Promise<{ category: string; id: string }>;
}) {
  const router = useRouter();
  const [resolved, setResolved] = useState<{ category: string; id: string } | null>(null);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [siblingProducts, setSiblingProducts] = useState<SiblingProduct[]>([]);
  const [media, setMedia] = useState<ProductMedia[]>([]);
  const [colorName, setColorName] = useState("");
  const [colorSwatch, setColorSwatch] = useState("#C4A484");
  const [linkToProductId, setLinkToProductId] = useState("");
  const [sizes, setSizes] = useState<string[]>([ONE_SIZE]);
  const [highlights, setHighlights] = useState<ProductHighlightKey[]>([
    ...DEFAULT_HIGHLIGHT_KEYS,
  ]);
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
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
        const loaded = data.product as ProductData | undefined;
        if (!loaded) return;

        setProduct(loaded);
        const loadedMedia = (loaded.media as ProductMedia[]) ?? [];
        const persistableMedia = loadedMedia.filter((item) => !isEphemeralMediaSrc(item.src));
        setMedia(persistableMedia);
        if (persistableMedia.length !== loadedMedia.length) {
          setError(
            "Some images were temporary browser previews and were removed. Re-upload images and save again."
          );
        }

        const nextPrice = String(loaded.price ?? "");
        const nextOriginal =
          loaded.originalPrice != null && loaded.originalPrice > 0
            ? String(loaded.originalPrice)
            : "";
        setPrice(nextPrice);
        setOriginalPrice(nextOriginal);
        setDiscountPercent(
          calcDiscountPercent(
            Number(nextPrice) || 0,
            nextOriginal ? Number(nextOriginal) : null
          )
        );

        const colorFields = getProductColorFields(loaded);
        setColorName(colorFields.colorName);
        setColorSwatch(colorFields.colorSwatch);
        setLinkToProductId(colorFields.linkToProductId || STANDALONE_VALUE);
        setSizes(parseProductSizes(loaded.sizes));
        setHighlights(normalizeProductHighlights(loaded.highlights));
      });
  }, [resolved]);

  function updatePriceFields(nextPrice: string, nextOriginal: string) {
    setPrice(nextPrice);
    setOriginalPrice(nextOriginal);
    setDiscountPercent(
      calcDiscountPercent(
        Number(nextPrice) || 0,
        nextOriginal ? Number(nextOriginal) : null
      )
    );
  }

  useEffect(() => {
    if (!product) return;

    fetch(`/api/admin/products?categorySlug=${encodeURIComponent(product.categorySlug)}`)
      .then((r) => r.json())
      .then((data) => {
        const siblings = (data.products ?? []).filter(
          (item: SiblingProduct) => item.productId !== product.productId
        );
        setSiblingProducts(siblings);
      });
  }, [product]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!resolved) return;
    setSaving(true);
    setError("");

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

    if (!media.length || media.some((item) => isEphemeralMediaSrc(item.src))) {
      setError("Wait for all image uploads to finish before saving.");
      setSaving(false);
      return;
    }

    const form = new FormData(e.currentTarget);
    const sellingPrice = Number(price);
    const mrp = originalPrice ? Number(originalPrice) : null;
    const discount = calcDiscountPercent(sellingPrice, mrp);

    const body = {
      name: String(form.get("name")),
      price: sellingPrice,
      originalPrice: mrp && mrp > sellingPrice ? mrp : null,
      discountPercent: discount,
      description: String(form.get("description")),
      material: String(form.get("material")),
      dimensions: String(form.get("dimensions")),
      quantity: Number(form.get("quantity")),
      colorName: colorName.trim(),
      colorSwatch,
      sizes,
      highlights,
      linkToProductId:
        linkToProductId === STANDALONE_VALUE ? null : linkToProductId || null,
      standalone: linkToProductId === STANDALONE_VALUE,
      media,
    };

    const res = await fetch(`/api/admin/products/${resolved.category}/${resolved.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.status === 401) {
      await handleAdminUnauthorized();
      return;
    }

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to save");
      setSaving(false);
      return;
    }

    router.push("/admin/products");
    router.refresh();
  }

  async function handleDelete() {
    if (!resolved || !confirm("Delete this product?")) return;
    const res = await fetch(`/api/admin/products/${resolved.category}/${resolved.id}`, {
      method: "DELETE",
    });
    if (res.status === 401) {
      await handleAdminUnauthorized();
      return;
    }
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
            {siblingProducts.map((sibling) => (
              <option key={sibling.productId} value={sibling.productId}>
                Link to {sibling.productId} — {sibling.name}
              </option>
            ))}
          </select>
          <span className="mt-2 block text-xs text-text-muted">
            Linked bags share the same colour switcher. Updating one updates blue, pink, red on all
            bags in the group.
          </span>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-brown-dark">
            Price (INR)
            <input
              name="price"
              type="number"
              min="1"
              value={price}
              onChange={(e) => updatePriceFields(e.target.value, originalPrice)}
              required
              className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm"
            />
          </label>
          <label className="block text-sm font-medium text-brown-dark">
            Original Price
            <input
              name="originalPrice"
              type="number"
              min="0"
              value={originalPrice}
              onChange={(e) => updatePriceFields(price, e.target.value)}
              placeholder="MRP before discount"
              className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm"
            />
          </label>
        </div>
        <label className="block text-sm font-medium text-brown-dark">
          Discount %
          <input
            name="discountPercent"
            type="number"
            value={discountPercent}
            readOnly
            className="mt-2 w-full rounded-xl border border-sand bg-sand/40 px-4 py-3 text-sm text-text-muted"
          />
          <span className="mt-2 block text-xs text-text-muted">
            Calculated automatically from Original Price and selling Price.
          </span>
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
        <label className="block text-sm font-medium text-brown-dark">
          Quantity in stock
          <input
            name="quantity"
            type="number"
            min="0"
            step="1"
            defaultValue={product.quantity}
            required
            className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm"
          />
          <span className="mt-2 block text-xs text-text-muted">
            Status updates automatically: {product.quantity > 0 ? "In stock" : "Out of stock"}.
          </span>
        </label>

        <AdminHighlightsSelector value={highlights} onChange={setHighlights} />

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
