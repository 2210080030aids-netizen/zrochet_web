import type { CartItem } from "@/lib/cart";

interface ExportOrder {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  subtotal: number;
  currency: string;
  paymentMethod: string | null;
  paidAt: Date | null;
  approvedAt: Date | null;
  createdAt: Date;
  items: unknown;
}

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatItemsSummary(items: unknown): string {
  if (!Array.isArray(items)) return "";
  return (items as CartItem[])
    .map((item) => `${item.name} x${item.quantity}`)
    .join("; ");
}

export function buildOrdersCsv(orders: ExportOrder[]): string {
  const headers = [
    "Order ID",
    "Date",
    "Customer",
    "Email",
    "Phone",
    "Address",
    "Status",
    "Total",
    "Currency",
    "Payment Method",
    "Payment Submitted",
    "Approved",
    "Items",
  ];

  const rows = orders.map((order) => [
    order.id,
    new Date(order.createdAt).toLocaleString("en-IN"),
    order.name,
    order.email,
    order.phone,
    order.address.replace(/\r?\n/g, ", "),
    order.status.replace(/_/g, " "),
    String(order.subtotal),
    order.currency,
    order.paymentMethod ?? "upi",
    order.paidAt ? new Date(order.paidAt).toLocaleString("en-IN") : "",
    order.approvedAt ? new Date(order.approvedAt).toLocaleString("en-IN") : "",
    formatItemsSummary(order.items),
  ]);

  return [headers, ...rows].map((row) => row.map((cell) => escapeCsv(cell)).join(",")).join("\n");
}
