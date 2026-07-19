import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CartProvider } from "@/lib/cart-context";
import { getSiteSettings } from "@/lib/catalog";

// Admin routes hide the storefront chrome via LayoutShell, so the shared
// app/not-found.tsx would render bare here. This mirrors the storefront 404
// (navbar + footer) so /admin and /admin/login look like a normal 404 page.
export default async function AdminNotFound() {
  const footerSettings = await getSiteSettings();

  return (
    <CartProvider>
      <Navbar />
      <main className="flex-1">
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-5 text-center">
          <h1 className="font-display text-4xl font-semibold text-brown-dark">Page not found</h1>
          <p className="mt-3 text-text-muted">The page you are looking for does not exist.</p>
          <Link
            href="/"
            className="mt-6 rounded-full bg-brown-dark px-6 py-3 text-sm font-medium text-white transition hover:bg-brown"
          >
            Back to Home
          </Link>
        </div>
      </main>
      <Footer settings={footerSettings} />
    </CartProvider>
  );
}
