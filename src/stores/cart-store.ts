"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getProductById } from "@/data/catalog";
import { cartCount, clampQuantity } from "@/lib/cart";
import type { CartLine, Product } from "@/types";

export type CartState = {
  items: CartLine[];
  add: (product: Pick<Product, "id">, quantity?: number) => void;
  remove: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
};

/**
 * Giỏ chỉ lưu `productId` + `quantity` trong localStorage.
 * Tên, đơn giá và tồn kho luôn suy lại từ `src/data/catalog.ts` khi render
 * (xem `resolveCartLines`), nên sửa localStorage không đổi được số tiền.
 */
export const CART_STORAGE_KEY = "shop-ha-cart";
export const CART_STORAGE_VERSION = 2;

/** localStorage có thể chứa dữ liệu của phiên bản cũ (hoặc bị sửa tay) — chuẩn hoá lại. */
export function migrateCartState(persisted: unknown): { items: CartLine[] } {
  const raw = persisted as { items?: unknown } | null | undefined;
  if (!raw || !Array.isArray(raw.items)) return { items: [] };
  const items: CartLine[] = [];
  for (const entry of raw.items) {
    const line = entry as { productId?: unknown; quantity?: unknown };
    if (!line || typeof line.productId !== "string" || !line.productId) continue;
    const quantity = Number(line.quantity);
    items.push({ productId: line.productId, quantity: Number.isFinite(quantity) ? Math.floor(quantity) : 1 });
  }
  return { items };
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (product, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((item) => item.productId === product.id);
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.productId === product.id
                  ? { ...item, quantity: clampQuantity(product.id, item.quantity + quantity) }
                  : item,
              ),
            };
          }
          return {
            items: [...state.items, { productId: product.id, quantity: clampQuantity(product.id, quantity) }],
          };
        }),
      remove: (productId) => set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
      setQuantity: (productId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.productId !== productId)
              : state.items.map((i) =>
                  i.productId === productId ? { ...i, quantity: clampQuantity(productId, quantity) } : i,
                ),
        })),
      clear: () => set({ items: [] }),
    }),
    {
      name: CART_STORAGE_KEY,
      version: CART_STORAGE_VERSION,
      migrate: migrateCartState,
      partialize: (state) => ({ items: state.items }),
      /**
       * Khi nạp lại giỏ: bỏ dòng trỏ tới sản phẩm không có trong catalog và kẹp số lượng
       * theo tồn kho, để dữ liệu cũ/bị sửa tay không đi tiếp vào đơn hàng.
       */
      merge: (persisted, current) => ({
        ...current,
        items: migrateCartState(persisted)
          .items.filter((line) => getProductById(line.productId))
          .map((line) => ({ productId: line.productId, quantity: clampQuantity(line.productId, line.quantity) })),
      }),
    },
  ),
);

/**
 * Số sản phẩm trong giỏ, đã kẹp theo tồn kho và bỏ dòng không còn hợp lệ.
 * An toàn với SSR: chưa hydrate thì store trả về mảng rỗng.
 */
export function useCartCount() {
  return useCartStore((state) => cartCount(state.items));
}
