"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { ProductMedia } from "@/lib/types";

interface AdminProductMediaUploadProps {
  productId: string;
  value: ProductMedia[];
  onChange: (media: ProductMedia[]) => void;
}

export default function AdminProductMediaUpload({
  productId,
  value,
  onChange,
}: AdminProductMediaUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFiles(selected: FileList | null) {
    if (!selected?.length) return;

    if (!productId.trim()) {
      setError("Enter a Product ID first (e.g. B10).");
      return;
    }

    setError("");
    setUploading(true);

    const next = [...value];
    let index = next.length + 1;

    try {
      for (const file of Array.from(selected)) {
        const form = new FormData();
        form.append("file", file);
        form.append("productId", productId.trim());
        form.append("index", String(index));
        form.append("label", `View ${index}`);

        const res = await fetch("/api/admin/upload", { method: "POST", body: form });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Upload failed");
        }

        next.push(data.media as ProductMedia);
        index += 1;
      }

      onChange(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }

  function updateLabel(i: number, label: string) {
    onChange(value.map((item, idx) => (idx === i ? { ...item, label } : item)));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="rounded-full border border-sand bg-cream px-5 py-2.5 text-sm font-medium text-brown-dark transition hover:border-gold disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "Choose images / video"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <p className="text-xs text-text-muted">JPEG, PNG, WebP, MP4 — max 20 MB each</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {value.length === 0 ? (
        <p className="rounded-xl border border-dashed border-sand bg-cream/50 px-4 py-8 text-center text-sm text-text-muted">
          No images yet. Click &quot;Choose images / video&quot; to upload from your computer.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {value.map((item, i) => (
            <li
              key={`${item.src}-${i}`}
              className="overflow-hidden rounded-xl border border-sand bg-cream/40 p-3"
            >
              <div className="relative aspect-square overflow-hidden rounded-lg bg-white">
                {item.type === "video" ? (
                  <video src={item.src} className="h-full w-full object-cover" controls muted />
                ) : (
                  <Image
                    src={item.src}
                    alt={item.label}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                )}
              </div>
              <label className="mt-3 block text-xs font-medium text-brown-dark">
                Label
                <input
                  value={item.label}
                  onChange={(e) => updateLabel(i, e.target.value)}
                  className="mt-1 w-full rounded-lg border border-sand bg-white px-3 py-2 text-sm"
                />
              </label>
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="mt-2 text-xs font-medium text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
