import type { Prisma } from "@prisma/client";
import { ORDER_STATUS } from "@/lib/order-status";

/** Orders that are visible in admin — payment screenshot must be uploaded. */
export const PLACED_ORDER_WHERE: Prisma.OrderWhereInput = {
  paymentProofUrl: { not: null },
};

/**
 * Fulfillment-based views for the Orders & Payments page.
 * - awaiting: payment submitted, not yet reviewed
 * - reviewed: a decision was made (approved or rejected)
 *   - approved / rejected are the two outcomes under "reviewed"
 * - shipped: dispatched but not yet delivered
 * - delivered: delivered to the customer
 */
export type OrderView =
  | ""
  | "awaiting"
  | "reviewed"
  | "approved"
  | "rejected"
  | "shipped"
  | "delivered";

interface OrderViewOption {
  value: OrderView;
  label: string;
}

export interface OrderViewGroup {
  label: string | null;
  options: OrderViewOption[];
}

export const ORDER_VIEW_FILTER_GROUPS: OrderViewGroup[] = [
  {
    label: null,
    options: [
      { value: "", label: "All orders" },
      { value: "awaiting", label: "Awaiting review" },
    ],
  },
  {
    label: "Reviewed",
    options: [
      { value: "approved", label: "Approved" },
      { value: "rejected", label: "Rejected" },
    ],
  },
  {
    label: null,
    options: [
      { value: "shipped", label: "Shipped" },
      { value: "delivered", label: "Delivered" },
    ],
  },
];

const VALID_VIEWS = new Set<string>(
  ORDER_VIEW_FILTER_GROUPS.flatMap((group) =>
    group.options.map((option) => option.value)
  ).filter(Boolean)
);

export interface OrderFilters {
  view: OrderView;
  q: string;
  /** Calendar month in "YYYY-MM" form, or "" for all months. */
  month: string;
}

/** Accepts only a well-formed "YYYY-MM" value (months 01–12). */
function normalizeMonth(raw: string): string {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(raw) ? raw : "";
}

export function parseOrderFilters(params: {
  view?: string;
  q?: string;
  month?: string;
}): OrderFilters {
  const viewRaw = params.view?.trim() || "";
  const view = VALID_VIEWS.has(viewRaw) ? (viewRaw as OrderView) : "";

  return {
    view,
    q: params.q?.trim() || "",
    month: normalizeMonth(params.month?.trim() || ""),
  };
}

/** Range covering the 1st of the month through the last day of that month. */
function buildMonthWhere(month: string): Prisma.OrderWhereInput {
  if (!month) return {};
  const [year, monthNumber] = month.split("-").map(Number);
  const start = new Date(year, monthNumber - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, monthNumber, 1, 0, 0, 0, 0);
  return { createdAt: { gte: start, lt: end } };
}

function buildViewWhere(view: OrderView): Prisma.OrderWhereInput {
  switch (view) {
    case "awaiting":
      return { status: ORDER_STATUS.PAYMENT_SUBMITTED };
    case "reviewed":
      return { status: { in: [ORDER_STATUS.APPROVED, ORDER_STATUS.REJECTED] } };
    case "approved":
      return { status: ORDER_STATUS.APPROVED, shippedAt: null, deliveredAt: null };
    case "rejected":
      return { status: ORDER_STATUS.REJECTED };
    case "shipped":
      return { shippedAt: { not: null }, deliveredAt: null };
    case "delivered":
      return { deliveredAt: { not: null } };
    default:
      return {};
  }
}

export function buildOrderWhereClause(filters: OrderFilters): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {
    ...PLACED_ORDER_WHERE,
    ...buildViewWhere(filters.view),
    ...buildMonthWhere(filters.month),
  };

  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { email: { contains: filters.q, mode: "insensitive" } },
      { phone: { contains: filters.q, mode: "insensitive" } },
      { id: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  return where;
}

export function buildOrderFilterQuery(filters: OrderFilters): string {
  const params = new URLSearchParams();
  if (filters.view) params.set("view", filters.view);
  if (filters.q) params.set("q", filters.q);
  if (filters.month) params.set("month", filters.month);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function hasActiveOrderFilters(filters: OrderFilters): boolean {
  return Boolean(filters.view || filters.q || filters.month);
}
