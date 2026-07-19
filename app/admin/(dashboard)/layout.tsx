import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getAdminSession, getAdminLoginKey } from "@/lib/admin-auth";
import AdminSessionGuard from "@/components/AdminSessionGuard";
import AdminHeaderActions from "@/components/AdminHeaderActions";
import { AdminKeyProvider } from "@/components/AdminKeyProvider";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/collections", label: "Collections" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Only allowlisted admins can see this area; everyone else gets a 404.
  const session = await getAdminSession();
  if (!session) {
    notFound();
  }

  const adminKey = getAdminLoginKey();

  // The secret key must be present and exactly correct in the URL on every admin
  // route. If even one letter is missing or wrong, show our styled "page not found".
  const headerStore = await headers();
  const urlKey = headerStore.get("x-admin-url-key") ?? "";
  if (urlKey !== adminKey) {
    notFound();
  }

  // Carry the secret key in the URL as the admin navigates.
  const keyQuery = `?key=${encodeURIComponent(adminKey)}`;

  return (
    <AdminSessionGuard>
      <AdminKeyProvider adminKey={adminKey}>
      <div className="admin-area min-h-screen bg-cream">
        <header className="border-b border-sand bg-white">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
            <Link
              href={`/admin${keyQuery}`}
              className="font-display text-xl font-bold text-brown-dark"
            >
              Zrochet Admin
            </Link>
            <AdminHeaderActions />
          </div>
        </header>

        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-8 lg:grid-cols-[200px_1fr]">
          <nav className="flex flex-row gap-2 overflow-x-auto lg:flex-col lg:gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={`${item.href}${keyQuery}`}
                className="whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium text-text-muted transition hover:bg-beige hover:text-brown-dark"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div>{children}</div>
        </div>
      </div>
      </AdminKeyProvider>
    </AdminSessionGuard>
  );
}
