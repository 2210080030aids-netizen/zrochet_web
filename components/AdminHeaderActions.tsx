"use client";

import { ADMIN_SESSION_FLAG, goToStore } from "@/components/AdminSessionGuard";

export default function AdminHeaderActions() {
  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => goToStore()}
        className="text-sm text-text-muted transition hover:text-brown-dark"
      >
        View Store
      </button>
      <form action="/api/admin/logout" method="POST">
        <button
          type="submit"
          onClick={() => {
            try {
              sessionStorage.removeItem(ADMIN_SESSION_FLAG);
            } catch {
              // ignore
            }
          }}
          className="text-sm font-medium text-brown transition hover:text-brown-dark"
        >
          Logout
        </button>
      </form>
    </div>
  );
}
