export const UPI_ID = process.env.NEXT_PUBLIC_UPI_ID ?? "sarathbhushan04@oksbi";
export const UPI_PAYEE_NAME = process.env.NEXT_PUBLIC_UPI_PAYEE_NAME ?? "Zrochet";

export function buildUpiPaymentUrl(amount: number, orderId: string): string {
  const params = new URLSearchParams({
    pa: UPI_ID,
    pn: UPI_PAYEE_NAME,
    am: amount.toFixed(2),
    cu: "INR",
    tn: `Zrochet-${orderId}`,
  });
  return `upi://pay?${params.toString()}`;
}

export function generateOrderId(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${stamp}-${rand}`;
}
