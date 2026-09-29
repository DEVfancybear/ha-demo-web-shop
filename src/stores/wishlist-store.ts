"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getProductById } from "@/data/catalog";

export type WishlistState = {
  ids: string[];
  toggle: (productId: string) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

export const WISHLIST_STORAGE_KEY = "shop-ha-wishlist";
export const WISHLIST_STORAGE_VERSION = 1;

/**
 * Danh sách yêu thích chỉ lưu `productId`; tên/giá/tồn kho luôn suy lại từ `src/data/catalog.ts`.
 * Hàm này bỏ id trùng và id không còn trong catalog, nên `localStorage` bị sửa tay cũng không tạo dòng rác.
 */
export function normalizeWishlistIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  for (const entry of value) {
    if (typeof entry !== "string" || seen.has(entry)) continue;
    if (!getProductById(entry)) continue;
    seen.add(entry);
  }
  return Array.from(seen);
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set) => ({
      ids: [],
      toggle: (productId) =>
        set((state) => {
          if (state.ids.includes(productId)) return { ids: state.ids.filter((id) => id !== productId) };
          if (!getProductById(productId)) return state;
          return { ids: [...state.ids, productId] };
        }),
      remove: (productId) => set((state) => ({ ids: state.ids.filter((id) => id !== productId) })),
      clear: () => set({ ids: [] }),
    }),
    {
      name: WISHLIST_STORAGE_KEY,
      version: WISHLIST_STORAGE_VERSION,
      partialize: (state) => ({ ids: state.ids }),
      // Dữ liệu cũ (khác version) cũng đi qua cùng bộ lọc, không tin `localStorage`.
      migrate: (persisted) => ({ ids: normalizeWishlistIds((persisted as { ids?: unknown } | null | undefined)?.ids) }),
      merge: (persisted, current) => ({
        ...current,
        ids: normalizeWishlistIds((persisted as { ids?: unknown } | null | undefined)?.ids),
      }),
    },
  ),
);

/** Số sản phẩm đang lưu; an toàn với SSR (chưa hydrate thì store trả mảng rỗng). */
export function useWishlistCount() {
  return useWishlistStore((state) => state.ids.length);
}
