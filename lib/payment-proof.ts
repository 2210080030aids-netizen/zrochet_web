export function orderPaymentProofPath(orderId: string): string {
  return `/api/orders/${encodeURIComponent(orderId)}/payment-proof`;
}
