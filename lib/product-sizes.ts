/** Default when product has no size list. */
export const DEFAULT_PRODUCT_SIZE = "One Size";

/** Normalize DB/JSON sizes into a clean string list. */
export function normalizeProductSizes(value: unknown): string[] {
  let raw: unknown = value;

  if (typeof raw === "string") {
    const asString = raw;
    try {
      raw = JSON.parse(asString);
    } catch {
      const trimmed = asString.trim();
      return trimmed ? [trimmed] : [DEFAULT_PRODUCT_SIZE];
    }
  }

  if (!Array.isArray(raw)) {
    return [DEFAULT_PRODUCT_SIZE];
  }

  const sizes = raw
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);

  return sizes.length ? sizes : [DEFAULT_PRODUCT_SIZE];
}

/** True when admin set custom size(s) instead of only One Size. */
export function hasCustomSizes(sizes: string[]): boolean {
  if (sizes.length === 0) return false;
  if (sizes.length > 1) return true;
  return sizes[0] !== DEFAULT_PRODUCT_SIZE;
}
