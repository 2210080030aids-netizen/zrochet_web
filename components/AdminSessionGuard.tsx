"use client";

import { useEffect, useState } from "react";

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
 * Enforces one-time admin sessions:
 * - Reload / refresh → logout
 * - Leaving admin (View Store) → logout
 * Soft in-admin navigation stays signed in until reload or leave.
 */
export default function AdminSessionGuard({ children }: { children: React.ReactNode }) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = false;
    try {
      active = sessionStorage.getItem(ADMIN_SESSION_FLAG) === "1";
    } catch {
      active = false;
    }

    const nav = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;
    const isReload = nav?.type === "reload";

    if (isReload || !active) {
      void (async () => {
        await clearAdminSession();
        window.location.replace("/admin/login");
      })();
      return;
    }

    setAllowed(true);

    function markInactive() {
      try {
        sessionStorage.removeItem(ADMIN_SESSION_FLAG);
      } catch {
        // ignore
      }
    }

    // Clear the live-session flag when the document unloads (refresh / close / leave site).
    window.addEventListener("pagehide", markInactive);
    window.addEventListener("beforeunload", markInactive);
    return () => {
      window.removeEventListener("pagehide", markInactive);
      window.removeEventListener("beforeunload", markInactive);
    };
  }, []);

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream text-sm text-text-muted">
        Checking admin session…
      </div>
    );
  }

  return <>{children}</>;
}

export async function logoutAdminAndGoToStore() {
  await clearAdminSession();
  window.location.href = "/";
}

/**
 * Call when an admin API responds 401. The UI session (sessionStorage flag)
 * has drifted from the server cookie, so clear it and send the admin to login.
 */
export async function handleAdminUnauthorized() {
  await clearAdminSession();
  window.location.replace("/admin/login");
}
