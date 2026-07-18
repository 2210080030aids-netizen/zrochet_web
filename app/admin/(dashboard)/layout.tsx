"use client";

import Link from "next/link";
import AdminSessionGuard, {
  ADMIN_SESSION_FLAG,
  logoutAdminAndGoToStore,
} from "@/components/AdminSessionGuard";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/collections", label: "Collections" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/settings", label: "Settings" },
];

function ViewStoreLink() {
  return (
    <button
      type="button"
      onClick={() => void logoutAdminAndGoToStore()}
      className="text-sm text-text-muted transition hover:text-brown-dark"
    >
      View Store
    </button>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminSessionGuard>
      <div className="admin-area min-h-screen bg-cream">
        <header className="border-b border-sand bg-white">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
            <Link href="/admin" className="font-display text-xl font-bold text-brown-dark">
              Zrochet Admin
            </Link>
            <div className="flex items-center gap-4">
              <ViewStoreLink />
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
          </div>
        </header>

        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-8 lg:grid-cols-[200px_1fr]">
          <nav className="flex flex-row gap-2 overflow-x-auto lg:flex-col lg:gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium text-text-muted transition hover:bg-beige hover:text-brown-dark"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div>{children}</div>
        </div>
      </div>
    </AdminSessionGuard>
  );
}
