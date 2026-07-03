import type { Metadata } from "next";
import CheckoutPageContent from "@/components/CheckoutPageContent";

export const metadata: Metadata = {
  title: "Checkout — Zrochet",
  description: "Complete your Zrochet order.",
};

export default function CheckoutPage() {
  return <CheckoutPageContent />;
}
