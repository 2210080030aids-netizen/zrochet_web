export const ORDER_STATUS = {
  PENDING: "pending",
  PAYMENT_SUBMITTED: "payment_submitted",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export function formatOrderStatus(status: string): string {
  return status.replace(/_/g, " ");
}

export function orderStatusBadgeClass(status: string): string {
  switch (status) {
    case ORDER_STATUS.APPROVED:
      return "bg-emerald-50 text-emerald-800";
    case ORDER_STATUS.PAYMENT_SUBMITTED:
      return "bg-amber-50 text-amber-800";
    case ORDER_STATUS.REJECTED:
      return "bg-red-50 text-red-700";
    default:
      return "bg-sand/80 text-brown-dark";
  }
}
