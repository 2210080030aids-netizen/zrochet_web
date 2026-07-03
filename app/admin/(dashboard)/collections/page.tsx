import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCartPrice } from "@/lib/cart";

export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage() {
  const collections = await prisma.collection.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-brown-dark">Collections</h1>
          <p className="mt-2 text-text-muted">{collections.length} collections</p>
        </div>
        <Link
          href="/admin/collections/new"
          className="rounded-full bg-brown-dark px-6 py-2.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-brown"
        >
          Add Collection
        </Link>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-sand bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-sand bg-beige/50 text-text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Label</th>
              <th className="px-4 py-3 font-medium">Default Price</th>
              <th className="px-4 py-3 font-medium">Products</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand">
            {collections.map((collection) => (
              <tr key={collection.slug}>
                <td className="px-4 py-3 font-mono text-xs text-brown-dark">{collection.slug}</td>
                <td className="px-4 py-3 font-medium">{collection.name}</td>
                <td className="px-4 py-3 text-text-muted">{collection.label}</td>
                <td className="px-4 py-3">{formatCartPrice(collection.defaultPrice, "INR")}</td>
                <td className="px-4 py-3">{collection._count.products}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/collections/${collection.slug}`}
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
