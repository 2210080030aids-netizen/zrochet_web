"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "@/lib/types";
import { getCoverImage } from "@/lib/catalog";
import {
  cartItemKey,
  getSubtotal,
  getTotalItems,
  loadCartFromStorage,
  saveCartToStorage,
  type CartItem,
} from "@/lib/cart";

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  isReady: boolean;
  addItem: (product: Product, quantity?: number, size?: string) => void;
  removeItem: (category: string, id: string, size?: string) => void;
  updateQuantity: (category: string, id: string, quantity: number, size?: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setItems(loadCartFromStorage());
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    saveCartToStorage(items);
  }, [items, isReady]);

  const addItem = useCallback((product: Product, quantity = 1, size?: string) => {
    if (!product.inStock || product.quantity <= 0) return;
    const selectedSize = size || product.sizes?.[0] || "One Size";

    setItems((prev) => {
      const key = cartItemKey(product.category, product.id, selectedSize);
      const existing = prev.find(
        (item) => cartItemKey(item.category, item.id, item.size) === key
      );
      const maxAllowed = Math.min(10, product.quantity);

      if (existing) {
        return prev.map((item) =>
          cartItemKey(item.category, item.id, item.size) === key
            ? { ...item, quantity: Math.min(maxAllowed, item.quantity + quantity) }
            : item
        );
      }

      return [
        ...prev,
        {
          id: product.id,
          category: product.category,
          name: product.name,
          price: product.price,
          currency: product.currency,
          image: getCoverImage(product),
          quantity: Math.min(maxAllowed, Math.max(1, quantity)),
          size: selectedSize,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((category: string, id: string, size?: string) => {
    const key = cartItemKey(category, id, size);
    setItems((prev) =>
      prev.filter((item) => cartItemKey(item.category, item.id, item.size) !== key)
    );
  }, []);

  const updateQuantity = useCallback(
    (category: string, id: string, quantity: number, size?: string) => {
      const key = cartItemKey(category, id, size);
      if (quantity <= 0) {
        setItems((prev) =>
          prev.filter((item) => cartItemKey(item.category, item.id, item.size) !== key)
        );
        return;
      }

      setItems((prev) =>
        prev.map((item) =>
          cartItemKey(item.category, item.id, item.size) === key
            ? { ...item, quantity: Math.min(10, quantity) }
            : item
        )
      );
    },
    []
  );

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({
      items,
      totalItems: getTotalItems(items),
      subtotal: getSubtotal(items),
      isReady,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    }),
    [items, isReady, addItem, removeItem, updateQuantity, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
