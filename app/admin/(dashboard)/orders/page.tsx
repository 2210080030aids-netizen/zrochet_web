import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { formatCartPrice } from "@/lib/cart";
import { resolveOrderStageDisplay, ORDER_STATUS } from "@/lib/order-status";
import {
  buildOrderFilterQuery,
  buildOrderWhereClause,
  hasActiveOrderFilters,
  parseOrderFilters,
  PLACED_ORDER_WHERE,
} from "@/lib/order-filters";
import AdminOrdersFilters from "@/components/AdminOrdersFilters";
import { orderInvoiceDownloadPath } from "@/lib/invoice";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ view?: string; q?: string; month?: string }>;
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const filters = parseOrderFilters(await searchParams);
  const where = buildOrderWhereClause(filters);
  const filterQuery = buildOrderFilterQuery(filters);
  const isFiltered = hasActiveOrderFilters(filters);

  const [orders, totalCount, awaitingApproval] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        subtotal: true,
        currency: true,
        status: true,
        paymentProofUrl: true,
        shippedAt: true,
        deliveredAt: true,
        createdAt: true,
      },
    }),
    prisma.order.count({ where: PLACED_ORDER_WHERE }),
    prisma.order.count({
      where: { ...PLACED_ORDER_WHERE, status: ORDER_STATUS.PAYMENT_SUBMITTED },
    }),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-brown-dark">Orders & Payments</h1>
          <p className="mt-2 text-text-muted">
            {isFiltered
              ? `Showing ${orders.length} of ${totalCount} orders`
              : `${totalCount} orders`}
            {" · "}
            {awaitingApproval} awaiting approval
          </p>
        </div>
        {orders.length > 0 && (
          <a
            href={`/api/admin/orders/export${filterQuery}`}
            className="rounded-full bg-brown-dark px-6 py-2.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-brown"
          >
            Download CSV
          </a>
        )}
      </div>

      <Suspense fallback={<div className="mt-6 h-[74px] rounded-2xl border border-sand bg-white" />}>
        <AdminOrdersFilters />
      </Suspense>

      <div className="mt-6 overflow-hidden rounded-2xl border border-sand bg-white">
        {orders.length === 0 ? (
          <p className="p-8 text-sm text-text-muted">
            {isFiltered ? "No orders match your filters." : "No orders yet."}
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-sand bg-beige/50 text-text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Download</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3 text-text-muted">
                    {new Date(order.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-brown-dark">{order.name}</p>
                    <p className="text-text-muted">{order.email}</p>
                  </td>
                  <td className="px-4 py-3">{order.phone}</td>
                  <td className="px-4 py-3 font-medium">
                    {formatCartPrice(order.subtotal, order.currency)}
                  </td>
                  <td className="px-4 py-3">
                    {(() => {
                      const stage = resolveOrderStageDisplay(order);
                      return (
                        <span
                          className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${stage.badgeClass}`}
                        >
                          {stage.label}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={orderInvoiceDownloadPath(order.id)}
                      className="inline-flex rounded-full bg-brown-dark px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-brown"
                    >
                      Invoice PDF
                    </a>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-medium text-brown transition hover:text-brown-dark"
                    >
                      View
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
