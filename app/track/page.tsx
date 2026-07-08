import { Suspense } from "react";
import TrackOrderPageContent from "@/components/TrackOrderPageContent";

export default function TrackOrderPage() {
  return (
    <div className="mx-auto px-5 pt-28 pb-16">
      <Suspense fallback={<p className="text-center text-text-muted">Loading…</p>}>
        <TrackOrderPageContent />
      </Suspense>
    </div>
  );
}
