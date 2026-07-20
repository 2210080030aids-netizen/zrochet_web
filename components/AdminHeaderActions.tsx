"use client";

import { ADMIN_SESSION_FLAG, goToStore } from "@/components/AdminSessionGuard";
import { useAdminKey } from "@/components/AdminKeyProvider";

export default function AdminHeaderActions() {
  const adminKey = useAdminKey();

  async function handleLogout() {
    try {
      sessionStorage.removeItem(ADMIN_SESSION_FLAG);
    } catch {
      // ignore
    }

    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        headers: { Accept: "application/json" },
        redirect: "manual",
      });
    } catch {
      // Cookie clear may still have succeeded server-side; continue to login.
    }

    const loginUrl = adminKey
      ? `/admin/login?key=${encodeURIComponent(adminKey)}`
      : "/admin/login";
    window.location.replace(loginUrl);
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => goToStore()}
        className="text-sm text-text-muted transition hover:text-brown-dark"
      >
        View Store
      </button>
      <button
        type="button"
        onClick={() => void handleLogout()}
        className="text-sm font-medium text-brown transition hover:text-brown-dark"
      >
        Logout
      </button>
    </div>
  );
}
