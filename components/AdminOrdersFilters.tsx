"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  ORDER_STATUS_FILTER_OPTIONS,
  buildOrderFilterQuery,
  hasActiveOrderFilters,
  parseOrderFilters,
} from "@/lib/order-filters";

export default function AdminOrdersFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = parseOrderFilters({
    status: searchParams.get("status") ?? undefined,
    q: searchParams.get("q") ?? undefined,
  });

  const [search, setSearch] = useState(current.q);

  function applyFilters(next: { status?: string; q?: string }) {
    const filters = parseOrderFilters({
      status: next.status ?? current.status,
      q: next.q ?? current.q,
    });
    router.push(`/admin/orders${buildOrderFilterQuery(filters)}`);
  }

  function clearFilters() {
    setSearch("");
    router.push("/admin/orders");
  }

  return (
    <div className="mt-6 flex flex-wrap items-end gap-4 rounded-2xl border border-sand bg-white p-4">
      <div>
        <label htmlFor="order-status-filter" className="block text-xs font-medium text-text-muted">
          Status
        </label>
        <select
          id="order-status-filter"
          value={current.status}
          onChange={(e) => applyFilters({ status: e.target.value })}
          className="mt-1 min-w-[180px] rounded-xl border border-sand bg-cream/30 px-3 py-2 text-sm text-brown-dark focus:border-brown focus:outline-none"
        >
          {ORDER_STATUS_FILTER_OPTIONS.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <form
        className="flex flex-1 flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          applyFilters({ q: search });
        }}
      >
        <div className="min-w-[220px] flex-1">
          <label htmlFor="order-search-filter" className="block text-xs font-medium text-text-muted">
            Search
          </label>
          <input
            id="order-search-filter"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, email, phone, or order ID"
            className="mt-1 w-full rounded-xl border border-sand bg-cream/30 px-3 py-2 text-sm text-brown-dark placeholder:text-text-muted focus:border-brown focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded-full border border-sand px-5 py-2 text-sm font-medium text-brown-dark transition hover:bg-cream"
        >
          Search
        </button>
      </form>

      {hasActiveOrderFilters(current) && (
        <button
          type="button"
          onClick={clearFilters}
          className="rounded-full px-3 py-2 text-sm font-medium text-brown transition hover:text-brown-dark"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
