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

      <p style="margin-top: 20px;">We've attached your payment receipt PDF. We'll reach out soon with delivery updates.</p>
      <p>With warmth,<br/>The Zrochet Team</p>
      <p style="font-size: 12px; color: #8B7355;"><a href="${siteUrl}">${siteUrl}</a></p>
    </div>
  `;
}

function getEmailSubject(orderId: string): string {
  return `Thank you for shopping — Zrochet order ${orderId.slice(0, 8)}`;
}

function getReceiptAttachment(orderId: string, receiptPdf?: Buffer) {
  if (!receiptPdf) return undefined;
  return {
    filename: `zrochet-receipt-${orderId}.pdf`,
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

async function sendViaSendGrid(
  options: ThankYouEmailOptions
): Promise<{ sent: boolean; error?: string }> {
  const apiKey = readEnv("SENDGRID_API_KEY")!;
  sgMail.setApiKey(apiKey);

  const fromRaw =
    readEnv("SENDGRID_FROM") ||
    readEnv("SMTP_FROM") ||
    readEnv("SMTP_USER") ||
    "hello@zrochet.com";
  const from = parseFromAddress(fromRaw);
  const attachment = getReceiptAttachment(options.orderId, options.receiptPdf);

  try {
    await sgMail.send({
      to: options.to,
      from: from.name ? { email: from.email, name: from.name } : from.email,
      subject: getEmailSubject(options.orderId),
      html: buildThankYouHtml(options),
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
    console.error("SendGrid thank-you email failed:", error);
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

async function sendViaResend(
  options: ThankYouEmailOptions
): Promise<{ sent: boolean; error?: string }> {
  const resend = new Resend(readEnv("RESEND_API_KEY"));
  const from = readEnv("RESEND_FROM") || "Zrochet <onboarding@resend.dev>";
  const attachment = getReceiptAttachment(options.orderId, options.receiptPdf);

  const { error } = await resend.emails.send({
    from,
    to: [options.to],
    subject: getEmailSubject(options.orderId),
    html: buildThankYouHtml(options),
    attachments: attachment
      ? [{ filename: attachment.filename, content: attachment.content }]
      : undefined,
  });

  if (error) return { sent: false, error: error.message };
  return { sent: true };
}

async function sendWithTransporter(
  transporter: nodemailer.Transporter,
  options: ThankYouEmailOptions
): Promise<void> {
  const from = readEnv("SMTP_FROM") || readEnv("SMTP_USER") || "hello@zrochet.com";
  const attachment = getReceiptAttachment(options.orderId, options.receiptPdf);

  await transporter.verify();
  await transporter.sendMail({
    from,
    to: options.to,
    subject: getEmailSubject(options.orderId),
    html: buildThankYouHtml(options),
    attachments: attachment ? [attachment] : [],
  });
}

async function sendViaSmtp(
  options: ThankYouEmailOptions
): Promise<{ sent: boolean; error?: string }> {
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
      await sendWithTransporter(transporter, options);
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
