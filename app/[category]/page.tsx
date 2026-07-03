import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { getCategory, getProductsByCategory } from "@/lib/catalog";

export const dynamic = "force-dynamic";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { category: slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: "Collection — Zrochet" };
  return {
    title: category.name + " — Zrochet",
    description: "Shop handcrafted " + category.name.toLowerCase() + " from Zrochet.",
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category: slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();

  const products = await getProductsByCategory(slug);

  return (
    <div className="pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-5">
        <nav className="mb-6 flex items-center gap-2 text-sm text-text-muted">
          <Link href="/" className="transition hover:text-brown-dark">Home</Link>
          <span>/</span>
          <span className="text-brown-dark">{category.name}</span>
        </nav>

        <div className="mb-10 text-center md:text-left">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-brown">
            {category.label}
          </p>
          <h1 className="font-display mt-2 text-4xl font-semibold text-brown-dark md:text-5xl">
            {category.name}
          </h1>
          <p className="mt-3 max-w-2xl text-text-muted">
            Handcrafted with care — each bag is grouped from our studio photography.
            Select a style to explore every angle.
          </p>
        </div>

        {products.length === 0 ? (
          <div className="rounded-2xl border border-sand bg-white py-16 text-center">
            <p className="text-text-muted">No products found in this collection yet.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
