/** Shared helpers for collection naming / URL slugs. */

export function slugifyCollectionName(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Storefront label derived from the display name. */
export function labelFromCollectionName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "";
  if (/collection$/i.test(trimmed)) return trimmed;
  return `${trimmed} Collection`;
}
