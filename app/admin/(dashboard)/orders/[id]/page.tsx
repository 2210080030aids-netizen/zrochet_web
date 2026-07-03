import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCartPrice } from "@/lib/cart";
import { formatOrderStatus, orderStatusBadgeClass } from "@/lib/order-status";
import AdminOrderActions from "@/components/AdminOrderActions";
import type { CartItem } from "@/lib/cart";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) notFound();

  const items = order.items as CartItem[];

  return (
    <div>
      <Link href="/admin/orders" className="text-sm text-brown hover:text-brown-dark">
        ← Back to orders
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-brown-dark">Order Details</h1>
          <p className="mt-2 font-mono text-sm text-text-muted">{order.id}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${orderStatusBadgeClass(order.status)}`}
        >
          {formatOrderStatus(order.status)}
        </span>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-sand bg-white p-6">
          <h2 className="font-display text-lg font-semibold text-brown-dark">Customer</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div>
              <dt className="text-text-muted">Name</dt>
              <dd className="font-medium text-brown-dark">{order.name}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Email</dt>
              <dd>{order.email}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Phone</dt>
              <dd>{order.phone}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Address</dt>
              <dd className="whitespace-pre-wrap">{order.address}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-sand bg-white p-6">
          <h2 className="font-display text-lg font-semibold text-brown-dark">Payment</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div>
              <dt className="text-text-muted">Total</dt>
              <dd className="font-display text-2xl font-semibold text-brown-dark">
                {formatCartPrice(order.subtotal, order.currency)}
              </dd>
            </div>
            <div>
              <dt className="text-text-muted">Method</dt>
              <dd className="uppercase">{order.paymentMethod || "upi"}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Ordered</dt>
              <dd>{new Date(order.createdAt).toLocaleString("en-IN")}</dd>
            </div>
            {order.paidAt && (
              <div>
                <dt className="text-text-muted">Payment submitted</dt>
                <dd>{new Date(order.paidAt).toLocaleString("en-IN")}</dd>
              </div>
            )}
            {order.approvedAt && (
              <div>
                <dt className="text-text-muted">Approved</dt>
                <dd>{new Date(order.approvedAt).toLocaleString("en-IN")}</dd>
              </div>
            )}
          </dl>
          <a
            href={`/api/orders/${order.id}/receipt`}
            className="mt-4 inline-block text-sm font-medium text-brown transition hover:text-brown-dark"
          >
            Download receipt PDF →
          </a>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-sand bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-brown-dark">Items</h2>
        <ul className="mt-4 divide-y divide-sand">
          {items.map((item) => (
            <li
              key={`${item.category}:${item.id}`}
              className="flex justify-between gap-4 py-3 text-sm"
            >
              <span>
                {item.name} × {item.quantity}
              </span>
              <span className="font-medium">
                {formatCartPrice(item.price * item.quantity, item.currency)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 rounded-2xl border border-sand bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-brown-dark">Actions</h2>
        <div className="mt-4">
          <AdminOrderActions orderId={order.id} status={order.status} />
        </div>
      </div>
    </div>
  );
}
