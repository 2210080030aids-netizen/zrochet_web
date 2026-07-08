"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface CollectionOption {
  slug: string;
  name: string;
}

interface AdminProductsFiltersProps {
  collections: CollectionOption[];
}

export default function AdminProductsFilters({ collections }: AdminProductsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("collection") ?? "";

  function applyCollection(slug: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) {
      params.set("collection", slug);
    } else {
      params.delete("collection");
    }
    const query = params.toString();
    router.push(query ? `/admin/products?${query}` : "/admin/products");
  }

  return (
    <div className="mt-6 flex flex-wrap items-end gap-4 rounded-2xl border border-sand bg-white p-4">
      <div>
        <label htmlFor="product-collection-filter" className="block text-xs font-medium text-text-muted">
          Collection
        </label>
        <select
          id="product-collection-filter"
          value={current}
          onChange={(e) => applyCollection(e.target.value)}
          className="mt-1 min-w-[220px] rounded-xl border border-sand bg-cream/30 px-3 py-2 text-sm text-brown-dark focus:border-brown focus:outline-none"
        >
          <option value="">All collections</option>
          {collections.map((collection) => (
            <option key={collection.slug} value={collection.slug}>
              {collection.name}
            </option>
          ))}
        </select>
      </div>

      {current ? (
        <button
          type="button"
          onClick={() => applyCollection("")}
          className="rounded-full border border-sand px-5 py-2 text-sm font-medium text-brown-dark transition hover:bg-cream"
        >
          Clear filter
        </button>
      ) : null}
    </div>
  );
}
