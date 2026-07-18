"use client";

import {
  PRODUCT_HIGHLIGHTS,
  type ProductHighlightKey,
} from "@/lib/product-highlights";

interface AdminHighlightsSelectorProps {
  value: ProductHighlightKey[];
  onChange: (value: ProductHighlightKey[]) => void;
}

export default function AdminHighlightsSelector({
  value,
  onChange,
}: AdminHighlightsSelectorProps) {
  function toggle(key: ProductHighlightKey, checked: boolean) {
    if (checked) {
      if (value.includes(key)) return;
      // Preserve the canonical badge order.
      onChange(PRODUCT_HIGHLIGHTS.map((h) => h.key).filter((k) => k === key || value.includes(k)));
    } else {
      onChange(value.filter((k) => k !== key));
    }
  }

  return (
    <div>
      <p className="text-sm font-medium text-brown-dark">Purchase highlights</p>
      <p className="mt-1 text-xs text-text-muted">
        Shown on the product page. Untick any you don&apos;t want to display.
      </p>
      <div className="mt-3 space-y-2">
        {PRODUCT_HIGHLIGHTS.map((highlight) => {
          const checked = value.includes(highlight.key);
          return (
            <label
              key={highlight.key}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-sand bg-cream px-4 py-3"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => toggle(highlight.key, e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-brown-dark"
              />
              <span>
                <span className="block text-sm font-medium text-brown-dark">
                  {highlight.title}
                </span>
                <span className="block text-xs text-text-muted">
                  {highlight.description}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
