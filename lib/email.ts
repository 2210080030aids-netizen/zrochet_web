import nodemailer from "nodemailer";
import { getSiteUrl } from "@/lib/env";

function isEmailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
  );
}

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendThankYouEmail(options: {
  to: string;
  customerName: string;
  orderId: string;
  subtotal: number;
  currency: string;
  receiptPdf?: Buffer;
}): Promise<{ sent: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    console.warn("SMTP not configured — skipping thank-you email.");
    return { sent: false, error: "SMTP not configured" };
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "hello@zrochet.com";
  const siteUrl = getSiteUrl();
  const amount =
    options.currency === "INR"
      ? "₹" + options.subtotal.toLocaleString("en-IN")
      : `${options.currency} ${options.subtotal}`;

  const html = `
    <div style="font-family: Georgia, serif; color: #3D2B1F; max-width: 560px;">
      <h1 style="font-size: 24px; margin-bottom: 8px;">Thank you for choosing Zrochet!</h1>
      <p>Dear ${options.customerName},</p>
      <p>Your payment has been verified and your order is confirmed.</p>
      <p><strong>Order ID:</strong> ${options.orderId}<br/>
      <strong>Amount:</strong> ${amount}</p>
      <p>We've attached your payment receipt for your records. We'll reach out soon with delivery updates.</p>
      <p>With warmth,<br/>The Zrochet Team</p>
      <p style="font-size: 12px; color: #8B7355;"><a href="${siteUrl}">${siteUrl}</a></p>
    </div>
  `;

  try {
    await getTransporter().sendMail({
      from,
      to: options.to,
      subject: `Thank you for your order — Zrochet (${options.orderId.slice(0, 8)})`,
      html,
      attachments: options.receiptPdf
        ? [
            {
              filename: `zrochet-receipt-${options.orderId}.pdf`,
              content: options.receiptPdf,
              contentType: "application/pdf",
            },
          ]
        : [],
    });
    return { sent: true };
  } catch (error) {
    console.error("Thank-you email failed:", error);
    return { sent: false, error: String(error) };
  }
}
