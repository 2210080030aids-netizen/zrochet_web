import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCartPrice } from "@/lib/cart";
import { formatOrderStatus, orderStatusBadgeClass } from "@/lib/order-status";
import AdminOrderActions from "@/components/AdminOrderActions";
import AdminOrderTracking from "@/components/AdminOrderTracking";
import { orderPaymentProofPath } from "@/lib/payment-proof";
import { ORDER_STATUS } from "@/lib/order-status";
import type { CartItem } from "@/lib/cart";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) notFound();

  const items = order.items as unknown as CartItem[];
  const paymentProofSrc = order.paymentProofUrl
    ? order.paymentProofUrl.startsWith("/api/")
      ? order.paymentProofUrl
      : orderPaymentProofPath(order.id)
    : null;

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
            {order.rejectedAt && (
              <div>
                <dt className="text-text-muted">Rejected</dt>
                <dd>{new Date(order.rejectedAt).toLocaleString("en-IN")}</dd>
              </div>
            )}
            {order.rejectionReason && (
              <div>
                <dt className="text-text-muted">Rejection reason</dt>
                <dd>{order.rejectionReason}</dd>
              </div>
            )}
            <div>
              <dt className="text-text-muted">Rejection email</dt>
              <dd>
                {order.rejectionEmailSent ? (
                  <span className="text-emerald-700">Sent</span>
                ) : order.status === "rejected" ? (
                  <span className="text-amber-800">
                    Not sent{order.rejectionEmailError ? ` — ${order.rejectionEmailError}` : ""}
                  </span>
                ) : (
                  <span className="text-text-muted">—</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-text-muted">Thank-you email</dt>
              <dd>
                {order.thankYouEmailSent ? (
                  <span className="text-emerald-700">Sent</span>
                ) : order.status === "approved" ? (
                  <span className="text-amber-800">
                    Not sent{order.thankYouEmailError ? ` — ${order.thankYouEmailError}` : ""}
                  </span>
                ) : (
                  <span className="text-text-muted">Pending approval</span>
                )}
              </dd>
            </div>
          </dl>
          <a
            href={`/api/orders/${order.id}/receipt`}
            className="mt-4 inline-flex rounded-full bg-brown-dark px-6 py-2.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-brown"
          >
            Download receipt PDF
          </a>
        </div>
      </div>

      {paymentProofSrc && (
        <div className="mt-6 rounded-2xl border border-sand bg-white p-6">
          <h2 className="font-display text-lg font-semibold text-brown-dark">Payment screenshot</h2>
          <p className="mt-1 text-sm text-text-muted">
            Uploaded by customer — verify amount and UPI reference before approving.
          </p>
          <div className="relative mt-4 max-w-md overflow-hidden rounded-xl border border-sand bg-cream">
            <a href={paymentProofSrc} target="_blank" rel="noopener noreferrer">
              <div className="relative aspect-[3/4] w-full">
                <Image
                  src={paymentProofSrc}
                  alt="Customer payment proof"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            </a>
          </div>
          <a
            href={paymentProofSrc}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm font-medium text-brown hover:text-brown-dark"
          >
            Open full size →
          </a>
        </div>
      )}

      {!paymentProofSrc && order.status === "payment_submitted" && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          No payment screenshot uploaded for this order.
        </div>
      )}

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
          <AdminOrderActions
            orderId={order.id}
            status={order.status}
            thankYouEmailSent={order.thankYouEmailSent}
            thankYouEmailError={order.thankYouEmailError}
            rejectionReason={order.rejectionReason}
            rejectionEmailSent={order.rejectionEmailSent}
            rejectionEmailError={order.rejectionEmailError}
          />
        </div>

        {order.status === ORDER_STATUS.APPROVED && (
          <div className="mt-8 border-t border-sand pt-6">
            <h3 className="font-display text-lg font-semibold text-brown-dark">Order Tracking</h3>
            <p className="mt-1 text-sm text-text-muted">
              Update fulfillment stages. Changes appear immediately on the customer Track My Order
              page.
            </p>
            <div className="mt-4">
              <AdminOrderTracking
                orderId={order.id}
                reviewedAt={order.reviewedAt}
                shippedAt={order.shippedAt}
                deliveredAt={order.deliveredAt}
                deliveryPartner={order.deliveryPartner}
                trackingId={order.trackingId}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
