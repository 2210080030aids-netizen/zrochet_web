import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { getCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "All Bags — Zrochet",
  description: "Browse every handcrafted crochet bag from Zrochet.",
};

export default async function ShopPage() {
  const catalog = await getCatalog();
  const products = catalog.products;

  return (
    <div className="pt-24 pb-16">
      <div className="mx-auto max-w-6xl px-5">
        <nav className="mb-6 flex items-center gap-2 text-sm text-text-muted">
          <Link href="/" className="transition hover:text-brown-dark">
            Home
          </Link>
          <span>/</span>
          <span className="text-brown-dark">All Bags</span>
        </nav>

        <div className="mb-10 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-brown">
            Curated for You
          </p>
          <h1 className="font-display mt-2 text-4xl font-semibold text-brown-dark md:text-5xl">
            All Bags
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-text-muted">
            Explore our full collection of handcrafted crochet bags — each piece lovingly made by
            hand.
          </p>
        </div>

        {products.length === 0 ? (
          <div className="rounded-2xl border border-sand bg-white py-16 text-center">
            <p className="text-text-muted">No products available yet.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={`${product.category}:${product.id}`} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
