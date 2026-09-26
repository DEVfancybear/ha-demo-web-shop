"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { siteConfig } from "@/lib/config";
import type { CartItem, Product } from "@/types";

export type CartState = {
  items: CartItem[];
  add: (product: Pick<Product, "id" | "slug" | "name" | "price" | "salePrice" | "emoji" | "tone" | "stock">, quantity?: number) => void;
  remove: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
};

export function lineTotal(item: CartItem) {
  return item.price * item.quantity;
}

export function cartSubtotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + lineTotal(item), 0);
}

export function shippingFeeFor(subtotal: number) {
  if (subtotal === 0) return 0;
  return subtotal >= siteConfig.freeShippingFrom ? 0 : siteConfig.shippingFee;
}

export function discountFor(subtotal: number) {
  if (subtotal >= siteConfig.bulkDiscountFrom) {
    return Math.round(subtotal * siteConfig.bulkDiscountRate);
  }
  return 0;
}

export function cartTotal(items: CartItem[]) {
  const subtotal = cartSubtotal(items);
  return subtotal + shippingFeeFor(subtotal) - discountFor(subtotal);
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (product, quantity = 1) =>
        set((state) => {
          const price = product.salePrice ?? product.price;
          const existing = state.items.find((item) => item.productId === product.id);
          const max = Math.max(1, product.stock);
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.productId === product.id
                  ? { ...item, quantity: Math.min(max, item.quantity + quantity) }
                  : item,
              ),
            };
          }
          const item: CartItem = {
            productId: product.id,
            slug: product.slug,
            name: product.name,
            price,
            emoji: product.emoji,
            tone: product.tone,
            quantity: Math.min(max, quantity),
          };
          return { items: [...state.items, item] };
        }),
      remove: (productId) => set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
      setQuantity: (productId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.productId !== productId)
              : state.items.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: "shop-ha-cart", version: 1 },
  ),
);

/** Số lượng sản phẩm trong giỏ, an toàn với SSR (chưa hydrate trả về 0). */
export function useCartCount() {
  return useCartStore((state) => state.items.reduce((sum, item) => sum + item.quantity, 0));
}
