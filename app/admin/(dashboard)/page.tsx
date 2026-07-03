import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCartPrice } from "@/lib/cart";
import { ORDER_STATUS } from "@/lib/order-status";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  try {
    const [productCount, orderCount, pendingPayments, recentOrders] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.count({
        where: { status: ORDER_STATUS.PAYMENT_SUBMITTED },
      }),
      prisma.order.findMany({ take: 5, orderBy: { createdAt: "desc" } }),
    ]);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-brown-dark">Dashboard</h1>
      <p className="mt-2 text-text-muted">Manage your Zrochet store from one place.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Products", value: productCount, href: "/admin/products" },
          { label: "Total Orders", value: orderCount, href: "/admin/orders" },
          { label: "Awaiting Approval", value: pendingPayments, href: "/admin/orders" },
        ].map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-2xl border border-sand bg-white p-6 transition hover:luxury-shadow"
          >
            <p className="text-sm text-text-muted">{stat.label}</p>
            <p className="font-display mt-2 text-3xl font-semibold text-brown-dark">
              {stat.value}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-sand bg-white p-6">
        <h2 className="font-display text-xl font-semibold text-brown-dark">Recent Orders</h2>
        {recentOrders.length === 0 ? (
          <p className="mt-4 text-sm text-text-muted">No orders yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-sand">
            {recentOrders.map((order) => (
              <li key={order.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium text-brown-dark">{order.name}</p>
                  <p className="text-text-muted">{order.email}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCartPrice(order.subtotal, order.currency)}</p>
                  <Link href={`/admin/orders/${order.id}`} className="text-xs capitalize text-brown">
                    {order.status.replace(/_/g, " ")} →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
  } catch {
    return (
      <div className="rounded-2xl border border-sand bg-white p-8">
        <h1 className="font-display text-2xl font-semibold text-brown-dark">Database not ready</h1>
        <p className="mt-3 text-text-muted">
          Run migrations and seed the database: <code className="text-brown">npm run db:migrate && npm run db:seed</code>
        </p>
      </div>
    );
  }
}
