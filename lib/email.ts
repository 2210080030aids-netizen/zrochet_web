import nodemailer from "nodemailer";
import sgMail from "@sendgrid/mail";
import { Resend } from "resend";
import { getSiteUrl } from "@/lib/env";
import type { CartItem } from "@/lib/cart";

export interface ThankYouEmailOptions {
  to: string;
  customerName: string;
  orderId: string;
  subtotal: number;
  currency: string;
  phone: string;
  address: string;
  items: CartItem[];
  receiptPdf?: Buffer;
}

export interface RejectionEmailOptions {
  to: string;
  customerName: string;
  orderId: string;
  subtotal: number;
  currency: string;
  reason: string;
}

interface DispatchEmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer; contentType: string }[];
}

export type EmailProvider = "sendgrid" | "resend" | "smtp";

const RAILWAY_SMTP_BLOCKED_HINT =
  "Railway blocks Gmail SMTP (ports 587/465). Add SENDGRID_API_KEY on Railway for production email. Gmail SMTP still works on localhost.";

/** Read env vars trimmed; strip quotes Railway/dashboard sometimes adds. */
export function readEnv(key: string): string | undefined {
  let value = process.env[key]?.trim();
  if (!value) return undefined;
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim();
  }
  return value || undefined;
}

export function isRailwayRuntime(): boolean {
  return Boolean(process.env.RAILWAY_ENVIRONMENT);
}

function formatMoney(amount: number, currency: string): string {
  if (currency === "INR") return "₹" + amount.toLocaleString("en-IN");
  return `${currency} ${amount}`;
}

function buildThankYouHtml(options: ThankYouEmailOptions): string {
  const siteUrl = getSiteUrl();
  const total = formatMoney(options.subtotal, options.currency);

  const itemRows = options.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #E8DFD4;">${item.name}</td>
        <td style="padding:8px 8px;border-bottom:1px solid #E8DFD4;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #E8DFD4;text-align:right;">${formatMoney(item.price * item.quantity, item.currency)}</td>
      </tr>`
    )
    .join("");

  return `
    <div style="font-family: Georgia, serif; color: #3D2B1F; max-width: 560px; line-height: 1.6;">
      <h1 style="font-size: 24px; margin-bottom: 8px;">Thank you for shopping with Zrochet!</h1>
      <p>Dear ${options.customerName},</p>
      <p>Your payment has been verified and your order is confirmed. Here are your product details:</p>

      <p style="margin-top: 20px;"><strong>Order ID:</strong> ${options.orderId}</p>

      <table style="width:100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
        <thead>
          <tr style="text-align:left; color: #8B7355;">
            <th style="padding-bottom:8px;">Product</th>
            <th style="padding-bottom:8px;text-align:center;">Qty</th>
            <th style="padding-bottom:8px;text-align:right;">Amount</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding-top:12px;font-weight:bold;">Total</td>
            <td style="padding-top:12px;text-align:right;font-weight:bold;">${total}</td>
          </tr>
        </tfoot>
      </table>

      <p><strong>Delivery address:</strong><br/>${options.address.replace(/\n/g, "<br/>")}</p>
      <p><strong>Phone:</strong> ${options.phone}</p>

      <p style="margin-top: 20px;">We've attached your invoice PDF. We'll reach out soon with delivery updates.</p>
      <p>With warmth,<br/>The Zrochet Team</p>
      <p style="font-size: 12px; color: #8B7355;"><a href="${siteUrl}">${siteUrl}</a></p>
    </div>
  `;
}

function getSupportEmail(): string {
  return readEnv("SUPPORT_EMAIL") || readEnv("SMTP_FROM") || readEnv("SMTP_USER") || "hello@zrochet.com";
}

function buildRejectionHtml(options: RejectionEmailOptions): string {
  const siteUrl = getSiteUrl();
  const supportEmail = getSupportEmail();
  const total = formatMoney(options.subtotal, options.currency);

  return `
    <div style="font-family: Georgia, serif; color: #3D2B1F; max-width: 560px; line-height: 1.6;">
      <h1 style="font-size: 24px; margin-bottom: 8px;">Payment verification update</h1>
      <p>Dear ${options.customerName},</p>
      <p>Thank you for your order with Zrochet. We reviewed the payment proof you submitted, but we were unable to verify your payment at this time.</p>

      <p style="margin-top: 20px;"><strong>Order ID:</strong> ${options.orderId}</p>
      <p><strong>Order total:</strong> ${total}</p>

      <p style="margin-top: 20px; padding: 16px; background: #FBF7F2; border-left: 3px solid #8B7355; border-radius: 4px;">
        <strong>Reason:</strong> ${options.reason}
      </p>

      <p style="margin-top: 20px;">To proceed with your order, please resubmit a clear payment proof that shows the transaction details, amount, and reference ID.</p>
      <p>You can <strong>reply directly to this email</strong> with an updated screenshot, or send it to our support team at <a href="mailto:${supportEmail}" style="color: #3D2B1F;">${supportEmail}</a>. Once we can verify your payment, we will confirm your order and begin processing it.</p>

      <p>If you have any questions, we are happy to help.</p>
      <p>With warmth,<br/>The Zrochet Team</p>
      <p style="font-size: 12px; color: #8B7355;"><a href="${siteUrl}">${siteUrl}</a></p>
    </div>
  `;
}

function getThankYouSubject(orderId: string): string {
  return `Thank you for shopping — Zrochet order ${orderId}`;
}

function getRejectionSubject(orderId: string): string {
  return `Action needed — payment verification for Zrochet order ${orderId}`;
}

interface OrderUpdateEmailOptions {
  to: string;
  customerName: string;
  orderId: string;
  subject: string;
  headline: string;
  paragraphs: string[];
  ctaLabel?: string;
  ctaHref?: string;
  details?: { label: string; value: string }[];
}

function buildOrderUpdateHtml(options: OrderUpdateEmailOptions): string {
  const siteUrl = getSiteUrl();
  const paragraphHtml = options.paragraphs.map((p) => `<p>${p}</p>`).join("");
  const detailsHtml = options.details?.length
    ? `<div style="margin-top: 20px; padding: 16px; background: #FBF7F2; border-left: 3px solid #8B7355; border-radius: 4px;">
        ${options.details
          .map(
            (detail) =>
              `<p style="margin: 0 0 8px;"><strong>${detail.label}:</strong> ${detail.value}</p>`
          )
          .join("")}
      </div>`
    : "";
  const ctaHtml =
    options.ctaLabel && options.ctaHref
      ? `<p style="margin-top: 24px;">
          <a href="${options.ctaHref}" style="display: inline-block; background: #3D2B1F; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 999px; font-size: 14px;">
            ${options.ctaLabel}
          </a>
        </p>`
      : "";

  return `
    <div style="font-family: Georgia, serif; color: #3D2B1F; max-width: 560px; line-height: 1.6;">
      <h1 style="font-size: 24px; margin-bottom: 8px;">${options.headline}</h1>
      <p>Dear ${options.customerName},</p>
      ${paragraphHtml}
      <p style="margin-top: 20px;"><strong>Order ID:</strong> ${options.orderId}</p>
      ${detailsHtml}
      ${ctaHtml}
      <p style="margin-top: 24px;">With warmth,<br/>The Zrochet Team</p>
      <p style="font-size: 12px; color: #8B7355;"><a href="${siteUrl}">${siteUrl}</a></p>
    </div>
  `;
}

async function sendOrderUpdateEmail(
  options: OrderUpdateEmailOptions
): Promise<{ sent: boolean; error?: string; provider?: string }> {
  const provider = getEmailProvider();
  if (!provider) {
    return {
      sent: false,
      error: getEmailConfigStatus().hint,
      provider: "none",
    };
  }

  const result = await dispatchEmail({
    to: options.to,
    subject: options.subject,
    html: buildOrderUpdateHtml(options),
    replyTo: getSupportEmail(),
  });

  return { ...result, provider };
}

function getPaymentReceivedSubject(orderId: string): string {
  return `Payment received — Zrochet order ${orderId}`;
}

function getShippedSubject(orderId: string): string {
  return `Your order has shipped — Zrochet order ${orderId}`;
}

function getDeliveredSubject(orderId: string): string {
  return `Your order has been delivered — Zrochet order ${orderId}`;
}

function getFromRaw(): string {
  return (
    readEnv("SENDGRID_FROM") ||
    readEnv("RESEND_FROM") ||
    readEnv("SMTP_FROM") ||
    readEnv("SMTP_USER") ||
    "hello@zrochet.com"
  );
}

function getReceiptAttachment(orderId: string, receiptPdf?: Buffer) {
  if (!receiptPdf) return undefined;
  return {
    filename: `zrochet-invoice-${orderId}.pdf`,
    content: receiptPdf,
    contentType: "application/pdf" as const,
  };
}

function parseFromAddress(raw: string): { email: string; name?: string } {
  const match = raw.match(/^(.+?)\s*<([^>]+)>$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  return { email: raw.trim() };
}

function isSendGridConfigured(): boolean {
  return Boolean(readEnv("SENDGRID_API_KEY"));
}

function isResendConfigured(): boolean {
  return Boolean(readEnv("RESEND_API_KEY"));
}

function isSmtpConfigured(): boolean {
  return Boolean(readEnv("SMTP_HOST") && readEnv("SMTP_USER") && readEnv("SMTP_PASS"));
}

/** Railway blocks SMTP — use HTTP APIs (SendGrid/Resend) in production. */
export function getEmailProvider(): EmailProvider | null {
  if (isSendGridConfigured()) return "sendgrid";
  if (isResendConfigured()) return "resend";
  if (isSmtpConfigured() && !isRailwayRuntime()) return "smtp";
  return null;
}

function formatSmtpError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code?: string }).code)
      : "";

  if (code === "EAUTH" || /535|authentication failed|invalid credentials/i.test(message)) {
    return "Gmail login failed. Use an App Password (not your normal password).";
  }
  if (code === "ETIMEDOUT" || code === "ECONNECTION" || /timeout|connect/i.test(message)) {
    if (isRailwayRuntime()) return RAILWAY_SMTP_BLOCKED_HINT;
    return "Could not connect to Gmail SMTP. Check SMTP settings.";
  }
  return message;
}

async function dispatchEmail(
  options: DispatchEmailOptions & { replyTo?: string }
): Promise<{ sent: boolean; error?: string }> {
  const provider = getEmailProvider();
  if (!provider) {
    return { sent: false, error: getEmailConfigStatus().hint };
  }

  if (provider === "sendgrid") {
    const apiKey = readEnv("SENDGRID_API_KEY")!;
    sgMail.setApiKey(apiKey);
    const from = parseFromAddress(getFromRaw());
    const attachment = options.attachments?.[0];

    try {
      await sgMail.send({
        to: options.to,
        from: from.name ? { email: from.email, name: from.name } : from.email,
        replyTo: options.replyTo,
        subject: options.subject,
        html: options.html,
        attachments: attachment
          ? [
              {
                content: attachment.content.toString("base64"),
                filename: attachment.filename,
                type: attachment.contentType,
                disposition: "attachment",
              },
            ]
          : undefined,
      });
      return { sent: true };
    } catch (error) {
      console.error("SendGrid email failed:", error);
      const body =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { body?: { errors?: { message: string }[] } } }).response?.body
          : undefined;
      const msg = body?.errors?.[0]?.message;
      return {
        sent: false,
        error:
          msg ||
          (error instanceof Error ? error.message : String(error)) +
            " — verify sender at SendGrid → Settings → Sender Authentication.",
      };
    }
  }

  if (provider === "resend") {
    const resend = new Resend(readEnv("RESEND_API_KEY"));
    const from = readEnv("RESEND_FROM") || "Zrochet <onboarding@resend.dev>";
    const attachment = options.attachments?.[0];

    const { error } = await resend.emails.send({
      from,
      to: [options.to],
      replyTo: options.replyTo,
      subject: options.subject,
      html: options.html,
      attachments: attachment
        ? [{ filename: attachment.filename, content: attachment.content }]
        : undefined,
    });

    if (error) return { sent: false, error: error.message };
    return { sent: true };
  }

  if (isRailwayRuntime()) {
    return { sent: false, error: RAILWAY_SMTP_BLOCKED_HINT };
  }

  const host = readEnv("SMTP_HOST")!;
  const user = readEnv("SMTP_USER")!;
  const pass = readEnv("SMTP_PASS")!;
  const configuredPort = Number(readEnv("SMTP_PORT") || 587);
  const configuredSecure = readEnv("SMTP_SECURE") === "true" || configuredPort === 465;

  const attempts: { port: number; secure: boolean; label: string }[] = [
    { port: configuredPort, secure: configuredSecure, label: "configured" },
  ];
  if (configuredPort !== 465) {
    attempts.push({ port: 465, secure: true, label: "465/ssl" });
  }
  if (configuredPort !== 587) {
    attempts.push({ port: 587, secure: false, label: "587/tls" });
  }

  const errors: string[] = [];
  const from = readEnv("SMTP_FROM") || readEnv("SMTP_USER") || "hello@zrochet.com";
  const attachment = options.attachments?.[0];

  for (const attempt of attempts) {
    const transporter = nodemailer.createTransport({
      host,
      port: attempt.port,
      secure: attempt.secure,
      auth: { user, pass },
      connectionTimeout: 30_000,
      greetingTimeout: 30_000,
      socketTimeout: 30_000,
      ...(attempt.secure
        ? {}
        : {
            requireTLS: true,
            tls: { minVersion: "TLSv1.2", servername: host },
          }),
    });

    try {
      await transporter.verify();
      await transporter.sendMail({
        from,
        to: options.to,
        replyTo: options.replyTo,
        subject: options.subject,
        html: options.html,
        attachments: attachment ? [attachment] : [],
      });
      return { sent: true };
    } catch (error) {
      const msg = formatSmtpError(error);
      console.error(`SMTP attempt (${attempt.label}, port ${attempt.port}) failed:`, error);
      errors.push(`port ${attempt.port}: ${msg}`);
    } finally {
      transporter.close();
    }
  }

  return { sent: false, error: errors.join(" | ") };
}

async function sendViaSendGrid(
  options: ThankYouEmailOptions
): Promise<{ sent: boolean; error?: string }> {
  const attachment = getReceiptAttachment(options.orderId, options.receiptPdf);
  return dispatchEmail({
    to: options.to,
    subject: getThankYouSubject(options.orderId),
    html: buildThankYouHtml(options),
    attachments: attachment ? [attachment] : undefined,
  });
}

async function sendViaResend(
  options: ThankYouEmailOptions
): Promise<{ sent: boolean; error?: string }> {
  const attachment = getReceiptAttachment(options.orderId, options.receiptPdf);
  return dispatchEmail({
    to: options.to,
    subject: getThankYouSubject(options.orderId),
    html: buildThankYouHtml(options),
    attachments: attachment ? [attachment] : undefined,
  });
}

async function sendViaSmtp(
  options: ThankYouEmailOptions
): Promise<{ sent: boolean; error?: string }> {
  const attachment = getReceiptAttachment(options.orderId, options.receiptPdf);
  return dispatchEmail({
    to: options.to,
    subject: getThankYouSubject(options.orderId),
    html: buildThankYouHtml(options),
    attachments: attachment ? [attachment] : undefined,
  });
}

export function getEmailConfigStatus(): {
  configured: boolean;
  provider: EmailProvider | null;
  hint: string;
  smtpHost?: string;
  smtpUser?: string;
  smtpPort?: string;
  railwaySmtpBlocked?: boolean;
} {
  const provider = getEmailProvider();
  const onRailway = isRailwayRuntime();
  const smtpOnlyOnRailway = onRailway && isSmtpConfigured() && !isSendGridConfigured() && !isResendConfigured();

  if (provider === "sendgrid") {
    return {
      configured: true,
      provider,
      hint: "Using SendGrid API (works on Railway).",
    };
  }
  if (provider === "resend") {
    return {
      configured: true,
      provider,
      hint: "Using Resend API (works on Railway).",
    };
  }
  if (provider === "smtp") {
    return {
      configured: true,
      provider,
      hint: `Using Gmail SMTP (${readEnv("SMTP_HOST")}) — localhost only.`,
      smtpHost: readEnv("SMTP_HOST"),
      smtpUser: readEnv("SMTP_USER"),
      smtpPort: readEnv("SMTP_PORT") || "587",
    };
  }
  if (smtpOnlyOnRailway) {
    return {
      configured: false,
      provider: null,
      hint: RAILWAY_SMTP_BLOCKED_HINT,
      railwaySmtpBlocked: true,
      smtpHost: readEnv("SMTP_HOST"),
      smtpUser: readEnv("SMTP_USER"),
    };
  }
  return {
    configured: false,
    provider: null,
    hint: "Add SENDGRID_API_KEY (Railway) or SMTP settings (localhost).",
  };
}

export async function sendThankYouEmail(
  options: ThankYouEmailOptions
): Promise<{ sent: boolean; error?: string; provider?: string }> {
  const provider = getEmailProvider();
  if (!provider) {
    console.warn("Email not configured — skipping thank-you email.");
    return {
      sent: false,
      error: getEmailConfigStatus().hint,
      provider: "none",
    };
  }

  let result: { sent: boolean; error?: string };
  if (provider === "sendgrid") result = await sendViaSendGrid(options);
  else if (provider === "resend") result = await sendViaResend(options);
  else result = await sendViaSmtp(options);

  return { ...result, provider };
}

export async function sendRejectionEmail(
  options: RejectionEmailOptions
): Promise<{ sent: boolean; error?: string; provider?: string }> {
  const provider = getEmailProvider();
  if (!provider) {
    console.warn("Email not configured — skipping rejection email.");
    return {
      sent: false,
      error: getEmailConfigStatus().hint,
      provider: "none",
    };
  }

  const supportEmail = getSupportEmail();
  const result = await dispatchEmail({
    to: options.to,
    subject: getRejectionSubject(options.orderId),
    html: buildRejectionHtml(options),
    replyTo: supportEmail,
  });

  return { ...result, provider };
}

export async function sendPaymentReceivedEmail(options: {
  to: string;
  customerName: string;
  orderId: string;
}): Promise<{ sent: boolean; error?: string; provider?: string }> {
  return sendOrderUpdateEmail({
    to: options.to,
    customerName: options.customerName,
    orderId: options.orderId,
    subject: getPaymentReceivedSubject(options.orderId),
    headline: "Thank you for your payment",
    paragraphs: [
      "Thank you for your payment. We have received your payment screenshot, and your order is now under review.",
      "Our team will verify your payment shortly and update you on the next stage of your order.",
      "Thank you for choosing Zrochet.",
    ],
    ctaLabel: "Track My Order",
    ctaHref: `${getSiteUrl()}/track?orderId=${encodeURIComponent(options.orderId)}`,
  });
}

export async function sendShippedEmail(options: {
  to: string;
  customerName: string;
  orderId: string;
  deliveryPartner?: string | null;
  trackingId?: string | null;
}): Promise<{ sent: boolean; error?: string; provider?: string }> {
  const details: { label: string; value: string }[] = [];
  if (options.deliveryPartner) {
    details.push({ label: "Delivery partner", value: options.deliveryPartner });
  }
  if (options.trackingId) {
    details.push({ label: "Tracking ID / AWB", value: options.trackingId });
  }

  return sendOrderUpdateEmail({
    to: options.to,
    customerName: options.customerName,
    orderId: options.orderId,
    subject: getShippedSubject(options.orderId),
    headline: "Your order has been shipped",
    paragraphs: [
      "Your order has been shipped. Your tracking details are now available.",
      "You can track your order from your Zrochet account.",
    ],
    details: details.length > 0 ? details : undefined,
    ctaLabel: "Track My Order",
    ctaHref: `${getSiteUrl()}/track?orderId=${encodeURIComponent(options.orderId)}`,
  });
}

export async function sendDeliveredEmail(options: {
  to: string;
  customerName: string;
  orderId: string;
}): Promise<{ sent: boolean; error?: string; provider?: string }> {
  return sendOrderUpdateEmail({
    to: options.to,
    customerName: options.customerName,
    orderId: options.orderId,
    subject: getDeliveredSubject(options.orderId),
    headline: "Your order has been delivered",
    paragraphs: [
      "Your order has been delivered. Thank you for choosing Zrochet!",
      "We hope you love your purchase. If you enjoyed the product, please rate and review it.",
    ],
    ctaLabel: "Shop & Review",
    ctaHref: `${getSiteUrl()}/#shop`,
  });
}

export async function sendTestEmail(to: string): Promise<{ sent: boolean; error?: string }> {
  return sendThankYouEmail({
    to,
    customerName: "Test Customer",
    orderId: "test-order-id",
    subtotal: 500,
    currency: "INR",
    phone: "+91 00000 00000",
    address: "Test address\nIndia",
    items: [
      {
        id: "test",
        category: "mini-bags",
        name: "Test Mini Bag",
        price: 500,
        currency: "INR",
        image: "/images/welcome.png",
        quantity: 1,
      },
    ],
  });
}
