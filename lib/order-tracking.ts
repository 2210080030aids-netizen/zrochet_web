export const FULFILLMENT_STAGES = ["reviewed", "shipped", "delivered"] as const;

export type FulfillmentStage = (typeof FULFILLMENT_STAGES)[number];

export interface OrderTrackingState {
  reviewedAt: Date | string | null;
  shippedAt: Date | string | null;
  deliveredAt: Date | string | null;
  deliveryPartner: string | null;
  trackingId: string | null;
}

export function isStageCompleted(tracking: OrderTrackingState, stage: FulfillmentStage): boolean {
  switch (stage) {
    case "reviewed":
      return Boolean(tracking.reviewedAt);
    case "shipped":
      return Boolean(tracking.shippedAt);
    case "delivered":
      return Boolean(tracking.deliveredAt);
  }
}

export function formatTrackingDate(value: Date | string | null): string | null {
  if (!value) return null;
  return new Date(value).toLocaleString("en-IN");
}

export function buildTrackingUpdateData(
  tracking: OrderTrackingState,
  stage: FulfillmentStage,
  completed: boolean,
  fields?: { deliveryPartner?: string; trackingId?: string }
) {
  if (stage === "reviewed") {
    if (completed) {
      return {
        reviewedAt: new Date(),
      };
    }

    return {
      reviewedAt: null,
      shippedAt: null,
      deliveryPartner: null,
      trackingId: null,
      deliveredAt: null,
    };
  }

  if (stage === "shipped") {
    if (!isStageCompleted(tracking, "reviewed")) {
      throw new Error("Mark the order as reviewed before shipping.");
    }

    if (completed) {
      const deliveryPartner = fields?.deliveryPartner?.trim() || "";
      const trackingId = fields?.trackingId?.trim() || "";
      if (!deliveryPartner || !trackingId) {
        throw new Error("Delivery partner name and tracking ID are required.");
      }

      return {
        shippedAt: new Date(),
        deliveryPartner,
        trackingId,
      };
    }

    return {
      shippedAt: null,
      deliveryPartner: null,
      trackingId: null,
      deliveredAt: null,
    };
  }

  if (!isStageCompleted(tracking, "shipped")) {
    throw new Error("Mark the order as shipped before delivery.");
  }

  return {
    deliveredAt: completed ? new Date() : null,
  };
}
