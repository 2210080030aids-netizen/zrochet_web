import type { Metadata } from "next";
import CartPageContent from "@/components/CartPageContent";

export const metadata: Metadata = {
  title: "Shopping Cart — Zrochet",
  description: "Review your handcrafted crochet bag order.",
};

export default function CartPage() {
  return <CartPageContent />;
}
