import PaymentPageContent from "@/components/PaymentPageContent";

export const metadata = {
  title: "Pay — Zrochet",
};

export default function PayPage() {
  return (
    <div className="mx-auto px-5 pt-28 pb-16">
      <PaymentPageContent />
    </div>
  );
}
