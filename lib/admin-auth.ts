import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "zrochet_admin";

// Only these accounts may access the admin area. Everyone else gets 404.
// Can be overridden via the ADMIN_EMAILS env var (comma-separated).
const DEFAULT_ADMIN_EMAILS = [
  "contact.zrochet@gmail.com",
  "sarathbhushan04@gmail.com",
  "manepallividyasagar3003@gmail.com",
];

export function getAllowedAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS;
  if (raw && raw.trim()) {
    return raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
  }
  return DEFAULT_ADMIN_EMAILS;
}

export function isAllowedAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return getAllowedAdminEmails().includes(email.trim().toLowerCase());
}

// Secret key that must be present in the login URL (?key=...) for the login page
// to render at all. Without it, /admin/login returns "page not found".
// Override in production via the ADMIN_LOGIN_KEY env var.
export function getAdminLoginKey(): string {
  return process.env.ADMIN_LOGIN_KEY || "zrochet-portal-L3*nD8^qF1zR";
}

// Appends the secret key to an admin path so it is carried across every admin
// route. Server-side use only (reads the key from the environment).
export function withAdminKey(path: string): string {
  const key = getAdminLoginKey();
  if (!key) return path;
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}key=${encodeURIComponent(key)}`;
}

function signEmail(email: string): string {
  const secret = process.env.ADMIN_PASSWORD || "zrochet-admin-change-me";
  return createHmac("sha256", secret)
    .update(`zrochet-admin-session:${email}`)
    .digest("hex");
}

export function verifyAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD || "zrochet-admin-change-me";
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function createAdminSessionToken(email: string): string {
  const normalized = email.trim().toLowerCase();
  const sig = signEmail(normalized);
  const encodedEmail = Buffer.from(normalized).toString("base64url");
  return `${sig}.${encodedEmail}`;
}

export async function getAdminSession(): Promise<{ email: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return null;

  const separator = token.indexOf(".");
  if (separator === -1) return null;
  const sig = token.slice(0, separator);
  const encodedEmail = token.slice(separator + 1);
  if (!sig || !encodedEmail) return null;

  let email: string;
  try {
    email = Buffer.from(encodedEmail, "base64url").toString("utf8");
  } catch {
    return null;
  }

  if (!isAllowedAdminEmail(email)) return null;

  const expected = signEmail(email);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;

  return { email };
}

export async function isAdminAuthenticated(): Promise<boolean> {
  return (await getAdminSession()) !== null;
}
