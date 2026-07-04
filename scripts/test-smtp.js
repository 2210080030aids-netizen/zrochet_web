/**
 * Quick SMTP connectivity test (uses .env.local).
 * Usage: node scripts/test-smtp.js [recipient@email.com]
 */

const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

const ENV_PATH = path.join(__dirname, "..", ".env.local");

function loadEnv() {
  if (!fs.existsSync(ENV_PATH)) {
    console.error(".env.local not found");
    process.exit(1);
  }
  for (const line of fs.readFileSync(ENV_PATH, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

async function tryPort(port, secure) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 30_000,
    ...(secure
      ? {}
      : { requireTLS: true, tls: { minVersion: "TLSv1.2", servername: process.env.SMTP_HOST } }),
  });

  console.log(`Testing port ${port} (secure=${secure})…`);
  await transporter.verify();
  const to = process.argv[2] || process.env.SMTP_USER;
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: "Zrochet SMTP test",
    text: "If you received this, SMTP is working.",
  });
  transporter.close();
  console.log(`SUCCESS on port ${port} — test email sent to ${to}`);
}

async function main() {
  loadEnv();
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error("SMTP_HOST, SMTP_USER, SMTP_PASS required in .env.local");
    process.exit(1);
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  try {
    await tryPort(port, secure);
  } catch (err) {
    console.error(`Port ${port} failed:`, err.message);
    if (port !== 465) {
      try {
        await tryPort(465, true);
      } catch (err2) {
        console.error("Port 465 also failed:", err2.message);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }
}

main();
