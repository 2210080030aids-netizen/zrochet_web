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

function formatMoney(amount: number, currency: string): string {
  if (currency === "INR") return "₹" + amount.toLocaleString("en-IN");
  return currency + " " + amount.toFixed(2);
}

export function generateReceiptPdf(order: ReceiptOrder): Buffer {
  const doc = new jsPDF();
  const margin = 20;
  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Zrochet", margin, y);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Handcrafted Crochet Creations", margin, y + 7);

  y += 22;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Payment Receipt", margin, y);

  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Order ID: ${order.id}`, margin, y);
  y += 6;
  doc.text(`Date: ${order.createdAt.toLocaleString("en-IN")}`, margin, y);
  y += 6;
  doc.text(`Status: ${order.status.replace(/_/g, " ")}`, margin, y);
  if (order.paidAt) {
    y += 6;
    doc.text(`Paid at: ${order.paidAt.toLocaleString("en-IN")}`, margin, y);
  }
  if (order.approvedAt) {
    y += 6;
    doc.text(`Approved at: ${order.approvedAt.toLocaleString("en-IN")}`, margin, y);
  }

  y += 12;
  doc.setFont("helvetica", "bold");
  doc.text("Customer", margin, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.text(order.name, margin, y);
  y += 5;
  doc.text(order.email, margin, y);
  y += 5;
  doc.text(order.phone, margin, y);
  y += 5;
  const addressLines = doc.splitTextToSize(order.address, 170);
  doc.text(addressLines, margin, y);
  y += addressLines.length * 5 + 8;

  doc.setFont("helvetica", "bold");
  doc.text("Items", margin, y);
  y += 7;
  doc.setFont("helvetica", "normal");

  for (const item of order.items) {
    const line = `${item.name} × ${item.quantity}`;
    const price = formatMoney(item.price * item.quantity, item.currency);
    doc.text(line, margin, y);
    doc.text(price, 170, y, { align: "right" });
    y += 6;
    if (y > 270) {
      doc.addPage();
      y = margin;
    }
  }

  y += 4;
  doc.line(margin, y, 190, y);
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.text("Total", margin, y);
  doc.text(formatMoney(order.subtotal, order.currency), 170, y, { align: "right" });

  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Thank you for choosing Zrochet!", margin, y);
  y += 5;
  doc.text("Each piece is lovingly handcrafted with care.", margin, y);

  return Buffer.from(doc.output("arraybuffer"));
}
