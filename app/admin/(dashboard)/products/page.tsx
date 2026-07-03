import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCartPrice } from "@/lib/cart";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: { collection: true },
    orderBy: [{ categorySlug: "asc" }, { productId: "asc" }],
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-brown-dark">Products</h1>
          <p className="mt-2 text-text-muted">{products.length} products in catalog</p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-brown-dark px-6 py-2.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-brown"
        >
          Add Product
        </Link>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-sand bg-white">
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
      </div>
    </div>
  );
}
