/** Cache-busted invoice download URL — always regenerates the current invoice template. */
export const INVOICE_TEMPLATE_VERSION = "4";

export function orderInvoiceDownloadPath(orderId: string): string {
  return `/api/orders/${encodeURIComponent(orderId)}/receipt?format=invoice&v=${INVOICE_TEMPLATE_VERSION}`;
}
