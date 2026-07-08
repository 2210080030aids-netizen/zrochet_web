import Link from "next/link";
import { Suspense } from "react";
import AdminProductsFilters from "@/components/AdminProductsFilters";
import { prisma } from "@/lib/prisma";
import { formatCartPrice } from "@/lib/cart";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ collection?: string }>;
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const { collection: collectionSlug } = await searchParams;
  const isFiltered = Boolean(collectionSlug);

  const [collections, products, totalCount] = await Promise.all([
    prisma.collection.findMany({
      orderBy: { sortOrder: "asc" },
      select: { slug: true, name: true },
    }),
    prisma.product.findMany({
      where: collectionSlug ? { categorySlug: collectionSlug } : undefined,
      include: { collection: true },
      orderBy: [{ categorySlug: "asc" }, { productId: "asc" }],
    }),
    prisma.product.count(),
  ]);

  const activeCollection = collections.find((c) => c.slug === collectionSlug);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-brown-dark">Products</h1>
          <p className="mt-2 text-text-muted">
            {isFiltered
              ? `Showing ${products.length} of ${totalCount} products${
                  activeCollection ? ` in ${activeCollection.name}` : ""
                }`
              : `${totalCount} products in catalog`}
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-brown-dark px-6 py-2.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-brown"
        >
          Add Product
        </Link>
      </div>

      <Suspense fallback={null}>
        <AdminProductsFilters collections={collections} />
      </Suspense>

      <div className="mt-8 overflow-hidden rounded-2xl border border-sand bg-white">
        {products.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-text-muted">
            {isFiltered ? "No products in this collection." : "No products yet."}
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-sand bg-beige/50 text-text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Collection</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand">
              {products.map((product) => (
                <tr key={`${product.categorySlug}-${product.productId}`}>
                  <td className="px-4 py-3 font-medium text-brown-dark">{product.productId}</td>
                  <td className="px-4 py-3">{product.name}</td>
                  <td className="px-4 py-3 text-text-muted">{product.collection.name}</td>
                  <td className="px-4 py-3">{formatCartPrice(product.price, product.currency)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        product.inStock
                          ? "bg-emerald-50 text-emerald-800"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {product.inStock ? "In stock" : "Out of stock"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/products/${product.categorySlug}/${product.productId}`}
                      className="font-medium text-brown transition hover:text-brown-dark"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
