"use client";

export const ADMIN_SESSION_FLAG = "zrochet_admin_active";

async function clearAdminSession() {
  try {
    await fetch("/api/admin/logout", {
      method: "POST",
      headers: { Accept: "application/json" },
      redirect: "manual",
    });
  } catch {
    // ignore
  }
  try {
    sessionStorage.removeItem(ADMIN_SESSION_FLAG);
  } catch {
    // ignore
  }
}

/**
 * The admin session is secured server-side: the dashboard layout validates the
 * signed, allowlisted-email cookie and renders "page not found" otherwise. That
 * session cookie persists across page reloads and in-admin navigation, so this
 * wrapper simply renders the admin UI and never forces a logout on refresh.
 */
export default function AdminSessionGuard({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

/**
 * Navigates to the storefront while keeping the admin signed in.
 */
export function goToStore() {
  window.location.href = "/";
}

/**
 * Call when an admin API responds 401. Clear the session and return to the
 * secret login URL (keeping the key from the current address bar when present).
 */
export async function handleAdminUnauthorized() {
  await clearAdminSession();
  let loginUrl = "/admin/login";
  try {
    const key = new URLSearchParams(window.location.search).get("key");
    if (key) {
      loginUrl = `/admin/login?key=${encodeURIComponent(key)}`;
    }
  } catch {
    // ignore
  }
  window.location.replace(loginUrl);
}
