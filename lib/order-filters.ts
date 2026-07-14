import type { Prisma } from "@prisma/client";
import { ORDER_STATUS, type OrderStatus } from "@/lib/order-status";

/** Orders that are visible in admin — payment screenshot must be uploaded. */
export const PLACED_ORDER_WHERE: Prisma.OrderWhereInput = {
  paymentProofUrl: { not: null },
};

export const ORDER_STATUS_FILTER_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: ORDER_STATUS.PAYMENT_SUBMITTED, label: "Payment submitted" },
  { value: ORDER_STATUS.APPROVED, label: "Approved" },
  { value: ORDER_STATUS.REJECTED, label: "Rejected" },
] as const;

export interface OrderFilters {
  status: OrderStatus | "";
  q: string;
}

const VALID_STATUSES = new Set<string>([
  ORDER_STATUS.PAYMENT_SUBMITTED,
  ORDER_STATUS.APPROVED,
  ORDER_STATUS.REJECTED,
]);

export function parseOrderFilters(params: {
  status?: string;
  q?: string;
}): OrderFilters {
  const statusRaw = params.status?.trim() || "";
  const status = VALID_STATUSES.has(statusRaw) ? (statusRaw as OrderStatus) : "";

  return {
    status,
    q: params.q?.trim() || "",
  };
}

export function buildOrderWhereClause(filters: OrderFilters): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {
    ...PLACED_ORDER_WHERE,
  };

  if (filters.status) {
    where.status = filters.status;
  }

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
  if (filters.status) params.set("status", filters.status);
  if (filters.q) params.set("q", filters.q);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function hasActiveOrderFilters(filters: OrderFilters): boolean {
  return Boolean(filters.status || filters.q);
}
