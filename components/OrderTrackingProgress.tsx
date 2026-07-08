import {
  formatTrackingDate,
  isStageCompleted,
  type FulfillmentStage,
  type OrderTrackingState,
} from "@/lib/order-tracking";

const STAGES: { key: FulfillmentStage; label: string }[] = [
  { key: "reviewed", label: "Reviewed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

const DELIVERED_MESSAGE = "Your order is delivered. Thank you for choosing us.";

interface OrderTrackingProgressProps extends OrderTrackingState {
  orderId?: string;
}

function getStageTimestamp(
  stage: FulfillmentStage,
  tracking: OrderTrackingState
): string | null {
  const value =
    stage === "reviewed"
      ? tracking.reviewedAt
      : stage === "shipped"
        ? tracking.shippedAt
        : tracking.deliveredAt;

  return value ? formatTrackingDate(value) : null;
}

export default function OrderTrackingProgress({
  reviewedAt,
  shippedAt,
  deliveredAt,
  deliveryPartner,
  trackingId,
  orderId,
}: OrderTrackingProgressProps) {
  const tracking: OrderTrackingState = {
    reviewedAt,
    shippedAt,
    deliveredAt,
    deliveryPartner,
    trackingId,
  };

  return (
    <div>
      <ol className="flex w-full list-none p-0">
        {STAGES.map((stage, index) => {
          const completed = isStageCompleted(tracking, stage.key);
          const timestamp = getStageTimestamp(stage.key, tracking);
          const isDeliveredStage = stage.key === "delivered";
          const showDeliveredMessage = isDeliveredStage && completed;

          return (
            <li
              key={stage.key}
              className="relative flex flex-1 flex-col items-center"
            >
              {index > 0 && (
                <div
                  className={`absolute right-1/2 top-6 h-0.5 w-full -translate-y-1/2 ${
                    isStageCompleted(tracking, STAGES[index - 1].key)
                      ? "bg-emerald-500"
                      : "bg-sand"
                  }`}
                  aria-hidden="true"
                />
              )}

              <div
                className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 transition ${
                  completed
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-sand bg-cream text-text-muted"
                }`}
              >
                {completed ? (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </div>

              <div className="mt-3 flex min-h-[4.5rem] w-full flex-col items-center px-1 text-center">
                <p
                  className={`text-sm font-medium ${
                    completed ? "text-emerald-800" : "text-text-muted"
                  }`}
                >
                  {stage.label}
                </p>

                {showDeliveredMessage ? (
                  <p className="mt-1 max-w-[11rem] text-xs leading-relaxed text-emerald-800">
                    {DELIVERED_MESSAGE}
                  </p>
                ) : completed && timestamp ? (
                  <p className="mt-1 whitespace-nowrap text-xs text-text-muted">{timestamp}</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      {isStageCompleted(tracking, "shipped") && (deliveryPartner || trackingId) && (
        <div className="mt-4 rounded-2xl border border-sand bg-cream/30 p-5 text-left">
          <h3 className="font-display text-lg font-semibold text-brown-dark">Shipping details</h3>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            {deliveryPartner && (
              <div>
                <dt className="text-text-muted">Delivery partner</dt>
                <dd className="font-medium text-brown-dark">{deliveryPartner}</dd>
              </div>
            )}
            {trackingId && (
              <div>
                <dt className="text-text-muted">Tracking ID / AWB</dt>
                <dd className="font-medium text-brown-dark">{trackingId}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {orderId && (
        <p className="mt-6 text-center text-sm text-text-muted">
          Order ID: <span className="font-medium text-brown-dark">{orderId}</span>
        </p>
      )}
    </div>
  );
}
