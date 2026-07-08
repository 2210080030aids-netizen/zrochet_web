export const UPI_ID = process.env.NEXT_PUBLIC_UPI_ID ?? "sarathbhushan04@oksbi";
export const UPI_PAYEE_NAME = process.env.NEXT_PUBLIC_UPI_PAYEE_NAME ?? "Zrochet";

export function buildUpiPaymentUrl(
  amount: number,
  orderId: string,
  upiId: string = process.env.NEXT_PUBLIC_UPI_ID ?? "sarathbhushan04@oksbi",
  payeeName: string = process.env.NEXT_PUBLIC_UPI_PAYEE_NAME ?? "Zrochet"
): string {
  const params = new URLSearchParams({
    pa: upiId,
    pn: payeeName,
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
