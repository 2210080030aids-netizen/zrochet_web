export type ProductHighlightKey = "freeDelivery" | "secureCheckout" | "easyReturns";

export interface ProductHighlightDef {
  key: ProductHighlightKey;
  title: string;
  /** Static description; freeDelivery uses the product's deliveryDays instead. */
  description: string;
}

/** Trust badges shown on the product purchase panel. */
export const PRODUCT_HIGHLIGHTS: ProductHighlightDef[] = [
  { key: "freeDelivery", title: "Free delivery", description: "Estimated delivery time" },
  { key: "secureCheckout", title: "Secure checkout", description: "100% secure payment processing" },
  { key: "easyReturns", title: "Easy returns", description: "7-day hassle-free return policy" },
];

export const ALL_HIGHLIGHT_KEYS: ProductHighlightKey[] = PRODUCT_HIGHLIGHTS.map((h) => h.key);

/** New products start with every badge enabled. */
export const DEFAULT_HIGHLIGHT_KEYS: ProductHighlightKey[] = [...ALL_HIGHLIGHT_KEYS];

/**
 * Normalize stored highlights into a clean, ordered key list.
 * A valid array is honored exactly (an empty array hides all badges).
 * Missing/invalid values fall back to all badges enabled (legacy rows).
 */
export function normalizeProductHighlights(value: unknown): ProductHighlightKey[] {
  let raw: unknown = value;

  if (typeof raw === "string") {
    const asString = raw;
    try {
      raw = JSON.parse(asString);
    } catch {
      return [...DEFAULT_HIGHLIGHT_KEYS];
    }
  }

  if (!Array.isArray(raw)) {
    return [...DEFAULT_HIGHLIGHT_KEYS];
  }

  return ALL_HIGHLIGHT_KEYS.filter((key) => raw.some((item) => item === key));
}
