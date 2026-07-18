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

/**
 * Resolves the label + badge style shown in the admin "Status" column so it
 * mirrors the fulfillment stage: Delivered / Shipped take precedence over the
 * raw payment status, then Approved / Rejected / Awaiting review.
 */
export function resolveOrderStageDisplay(order: {
  status: string;
  shippedAt?: Date | string | null;
  deliveredAt?: Date | string | null;
}): { label: string; badgeClass: string } {
  if (order.status === ORDER_STATUS.REJECTED) {
    return { label: "Rejected", badgeClass: "bg-red-50 text-red-700" };
  }
  if (order.deliveredAt) {
    return { label: "Delivered", badgeClass: "bg-purple-50 text-purple-700" };
  }
  if (order.shippedAt) {
    return { label: "Shipped", badgeClass: "bg-blue-50 text-blue-700" };
  }
  if (order.status === ORDER_STATUS.APPROVED) {
    return { label: "Approved", badgeClass: "bg-emerald-50 text-emerald-800" };
  }
  if (order.status === ORDER_STATUS.PAYMENT_SUBMITTED) {
    return { label: "Awaiting review", badgeClass: "bg-amber-50 text-amber-800" };
  }
  return {
    label: formatOrderStatus(order.status),
    badgeClass: orderStatusBadgeClass(order.status),
  };
}
