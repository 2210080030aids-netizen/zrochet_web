export interface CartItem {
  id: string;
  category: string;
  name: string;
  price: number;
  currency: string;
  image: string;
  quantity: number;
  size?: string;
}

export const CART_STORAGE_KEY = "zrochet-cart";

export function cartItemKey(category: string, id: string, size?: string): string {
  return size ? `${category}:${id}:${size}` : `${category}:${id}`;
}

export function getTotalItems(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function getSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function formatCartPrice(amount: number, currency = "INR"): string {
  if (currency === "INR") {
    return "₹" + amount.toLocaleString("en-IN");
  }
  return "$" + amount.toFixed(2);
}

export function loadCartFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCartToStorage(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}
