"use client";

import { useState } from "react";

const ONE_SIZE = "One Size";

type SizeMode = "one" | "custom";

interface AdminSizeSelectorProps {
  sizes: string[];
  onChange: (sizes: string[]) => void;
}

export default function AdminSizeSelector({ sizes, onChange }: AdminSizeSelectorProps) {
  const isOneSize = sizes.length === 1 && sizes[0] === ONE_SIZE;
  const mode: SizeMode = isOneSize ? "one" : "custom";
  const customSizes = isOneSize ? [] : sizes;
  const [draft, setDraft] = useState("");

  function selectOneSize() {
    onChange([ONE_SIZE]);
    setDraft("");
  }

  function selectCustom() {
    if (mode === "custom") return;
    onChange([]);
  }

  function addCustomSize() {
    const next = draft.trim();
    if (!next) return;
    if (customSizes.some((size) => size.toLowerCase() === next.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...customSizes, next]);
    setDraft("");
  }

  function removeCustomSize(size: string) {
    onChange(customSizes.filter((item) => item !== size));
  }

  return (
    <div>
      <p className="text-sm font-medium text-brown-dark">Size</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={selectOneSize}
          className={`rounded-full border px-4 py-2 text-sm transition ${
            mode === "one"
              ? "border-brown-dark bg-brown-dark text-white"
              : "border-sand bg-white text-text hover:border-gold"
          }`}
        >
          One Size
        </button>
        <button
          type="button"
          onClick={selectCustom}
          className={`rounded-full border px-4 py-2 text-sm transition ${
            mode === "custom"
              ? "border-brown-dark bg-brown-dark text-white"
              : "border-sand bg-white text-text hover:border-gold"
          }`}
        >
          Custom size
        </button>
      </div>

      {mode === "custom" && (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomSize();
                }
              }}
              placeholder="e.g. Medium, Large"
              className="min-w-[12rem] flex-1 rounded-xl border border-sand bg-cream px-4 py-3 text-sm"
            />
            <button
              type="button"
              onClick={addCustomSize}
              className="rounded-full border border-sand bg-white px-5 py-3 text-sm font-medium text-brown-dark transition hover:border-gold"
            >
              Add size
            </button>
          </div>

          {customSizes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {customSizes.map((size) => (
                <span
                  key={size}
                  className="inline-flex items-center gap-2 rounded-full border border-brown-dark bg-brown-dark px-4 py-2 text-sm text-white"
                >
                  {size}
                  <button
                    type="button"
                    onClick={() => removeCustomSize(size)}
                    aria-label={`Remove ${size}`}
                    className="text-white/80 transition hover:text-white"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-muted">
              Add one or more custom sizes for this product.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export { ONE_SIZE };
