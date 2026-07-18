"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  ORDER_VIEW_FILTER_GROUPS,
  buildOrderFilterQuery,
  hasActiveOrderFilters,
  parseOrderFilters,
} from "@/lib/order-filters";

export default function AdminOrdersFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = parseOrderFilters({
    view: searchParams.get("view") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    month: searchParams.get("month") ?? undefined,
  });

  const [search, setSearch] = useState(current.q);
  const [monthFocused, setMonthFocused] = useState(false);
  const showMonthHint = !current.month && !monthFocused;

  function applyFilters(next: { view?: string; q?: string; month?: string }) {
    const filters = parseOrderFilters({
      view: next.view ?? current.view,
      q: next.q ?? current.q,
      month: next.month ?? current.month,
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
        <select
          id="order-view-filter"
          aria-label="Filter by stage"
          value={current.view}
          onChange={(e) => applyFilters({ view: e.target.value })}
          className="min-w-[180px] rounded-xl border border-sand bg-cream/30 px-3 py-2 text-sm text-brown-dark focus:border-brown focus:outline-none"
        >
          {ORDER_VIEW_FILTER_GROUPS.map((group, index) =>
            group.label ? (
              <optgroup key={group.label} label={group.label}>
                {group.options.map((option) => (
                  <option key={option.value || "all"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            ) : (
              group.options.map((option) => (
                <option key={option.value || `all-${index}`} value={option.value}>
                  {option.label}
                </option>
              ))
            )
          )}
        </select>
      </div>

      <div className="relative">
        <input
          id="order-month-filter"
          type="month"
          aria-label="Filter by month and year"
          value={current.month}
          onFocus={() => setMonthFocused(true)}
          onBlur={() => setMonthFocused(false)}
          onChange={(e) => applyFilters({ month: e.target.value })}
          className={`rounded-xl border border-sand bg-cream/30 px-3 py-2 text-sm focus:border-brown focus:outline-none ${
            showMonthHint ? "text-transparent" : "text-brown-dark"
          }`}
        />
        {showMonthHint && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-text-muted">
            Month &amp; Year
          </span>
        )}
      </div>

      <form
        className="flex flex-1 flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          applyFilters({ q: search });
        }}
      >
        <div className="min-w-[220px] flex-1">
          <input
            id="order-search-filter"
            type="search"
            aria-label="Search orders"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, email, phone, or order ID"
            className="w-full rounded-xl border border-sand bg-cream/30 px-3 py-2 text-sm text-brown-dark placeholder:text-text-muted focus:border-brown focus:outline-none"
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
