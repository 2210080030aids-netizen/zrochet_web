import { jsPDF } from "jspdf";
import type { CartItem } from "@/lib/cart";

export interface ReceiptOrder {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  items: CartItem[];
  subtotal: number;
  currency: string;
  status: string;
  paymentMethod?: string | null;
  paidAt?: Date | null;
  approvedAt?: Date | null;
  createdAt: Date;
}

export interface InvoiceShopInfo {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

const COLORS = {
  black: [17, 17, 17] as const,
  dark: [40, 40, 40] as const,
  muted: [120, 120, 120] as const,
  line: [210, 210, 210] as const,
  header: [45, 45, 45] as const,
  white: [255, 255, 255] as const,
};

const DEFAULT_SHOP: Required<InvoiceShopInfo> = {
  name: "Zrochet",
  email: "hello@zrochet.com",
  phone: "+91 98765 43210",
  address: "Hyderabad, Telangana",
};

function formatMoney(amount: number, currency: string): string {
  if (currency === "INR") return "Rs. " + amount.toLocaleString("en-IN");
  return currency + " " + amount.toFixed(2);
}

function formatDate(value: Date | string | null | undefined): string {
  const date = value instanceof Date ? value : value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return formatDate(new Date());
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function normalizeInvoiceItems(items: CartItem[], fallbackCurrency: string): CartItem[] {
  if (!Array.isArray(items)) return [];
  return items.map((item, index) => ({
    id: String(item?.id || `item-${index + 1}`),
    category: String(item?.category || "bags"),
    name: String(item?.name || "Crochet bag"),
    price: Number(item?.price) || 0,
    currency: String(item?.currency || fallbackCurrency || "INR"),
    image: String(item?.image || ""),
    quantity: Math.max(1, Number(item?.quantity) || 1),
  }));
}

function setFill(doc: jsPDF, rgb: readonly [number, number, number]) {
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
}

function setDraw(doc: jsPDF, rgb: readonly [number, number, number]) {
  doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
}

function setText(doc: jsPDF, rgb: readonly [number, number, number]) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
}

/**
 * Clean Zrochet invoice template — used for email attachments and admin/customer downloads.
 * Payment Status is always shown as "Done" once the invoice is issued.
 */
export function generateReceiptPdf(
  order: ReceiptOrder,
  shopInfo?: InvoiceShopInfo
): Buffer {
  const shop = { ...DEFAULT_SHOP, ...shopInfo };
  const items = normalizeInvoiceItems(order.items, order.currency);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentW = pageW - margin * 2;
  const right = pageW - margin;

  // Header
  let y = 24;
  setText(doc, COLORS.black);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text(shop.name, margin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  setText(doc, COLORS.muted);
  doc.text("Handcrafted Crochet Bags", margin, y + 7);

  setText(doc, COLORS.black);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text("INVOICE", right, y, { align: "right" });

  y += 14;
  setDraw(doc, COLORS.black);
  doc.setLineWidth(0.7);
  doc.line(margin, y, right, y);

  // Meta row: Invoice Number | Invoice Date | Payment Status
  y += 10;
  const invoiceDate = formatDate(order.paidAt || order.approvedAt || order.createdAt);
  const colW = contentW / 3;
  const meta = [
    { label: "Invoice Number", value: order.id },
    { label: "Invoice Date", value: invoiceDate },
    { label: "Payment Status", value: "Done" },
  ];

  meta.forEach((item, index) => {
    const x = margin + index * colW;
    setText(doc, COLORS.muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(item.label, x, y);
    setText(doc, COLORS.black);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(item.value, x, y + 6);
  });

  // Bill To
  y += 18;
  setText(doc, COLORS.muted);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("BILL TO", margin, y);

  y += 7;
  setText(doc, COLORS.black);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(order.name, margin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setText(doc, COLORS.dark);
  y += 5;
  doc.text(order.email, margin, y);
  if (order.phone) {
    y += 4.5;
    doc.text(order.phone, margin, y);
  }
  const addressLines = doc.splitTextToSize(order.address || "", contentW * 0.55);
  y += 4.5;
  doc.text(addressLines, margin, y);
  y += Math.max(addressLines.length, 1) * 4.5 + 8;

  // Items table header
  const col = {
    item: margin + 2,
    qty: margin + contentW - 70,
    rate: margin + contentW - 42,
    amount: right - 2,
  };

  setFill(doc, COLORS.header);
  doc.rect(margin, y, contentW, 9, "F");
  setText(doc, COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("ITEM DESCRIPTION", col.item, y + 6);
  doc.text("QTY", col.qty, y + 6, { align: "right" });
  doc.text("RATE", col.rate, y + 6, { align: "right" });
  doc.text("AMOUNT", col.amount, y + 6, { align: "right" });

  y += 9;
  doc.setFont("helvetica", "normal");

  items.forEach((item) => {
    const nameLines = doc.splitTextToSize(item.name, 90);
    const rowH = Math.max(14, nameLines.length * 4.5 + 8);

    if (y + rowH > pageH - 50) {
      doc.addPage();
      y = 24;
    }

    setText(doc, COLORS.black);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(nameLines, col.item, y + 5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setText(doc, COLORS.muted);
    doc.text("Handcrafted crochet bag", col.item, y + 5 + nameLines.length * 4.5);

    setText(doc, COLORS.black);
    doc.setFontSize(10);
    doc.text(String(item.quantity), col.qty, y + 5, { align: "right" });
    doc.text(formatMoney(item.price, item.currency || order.currency), col.rate, y + 5, {
      align: "right",
    });
    doc.text(
      formatMoney(item.price * item.quantity, item.currency || order.currency),
      col.amount,
      y + 5,
      { align: "right" }
    );

    y += rowH;
    setDraw(doc, COLORS.line);
    doc.setLineWidth(0.3);
    doc.line(margin, y, right, y);
  });

  // Totals
  y += 10;
  const totalsX = right - 70;
  setText(doc, COLORS.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Subtotal", totalsX, y);
  setText(doc, COLORS.black);
  doc.text(formatMoney(order.subtotal, order.currency), right, y, { align: "right" });

  y += 4;
  setDraw(doc, COLORS.line);
  doc.setLineWidth(0.4);
  doc.line(totalsX, y, right, y);

  y += 8;
  setText(doc, COLORS.black);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("TOTAL", totalsX, y);
  doc.text(formatMoney(order.subtotal, order.currency), right, y, { align: "right" });

  // Footer
  const footerY = pageH - 28;
  setDraw(doc, COLORS.line);
  doc.setLineWidth(0.4);
  doc.line(margin, footerY - 8, right, footerY - 8);

  setText(doc, COLORS.black);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Thank you for shopping with Zrochet!", margin, footerY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setText(doc, COLORS.muted);
  doc.text("Each bag is handmade with care.", margin, footerY + 5);

  const contactLine = `${shop.address} | ${shop.email}`;
  doc.setFontSize(8);
  doc.text(contactLine, margin, footerY + 12);

  return Buffer.from(doc.output("arraybuffer"));
}
