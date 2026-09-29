"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getProductById } from "@/data/catalog";
import { COMPARE_MAX } from "@/lib/compare";

export const COMPARE_STORAGE_KEY = "shop-ha-compare";
export const COMPARE_STORAGE_VERSION = 1;

export type CompareToggleResult = "added" | "removed" | "full" | "invalid";

export type CompareState = {
  ids: string[];
  /** Trả về kết quả để nút bấm biết vì sao không thêm được (danh sách đầy). */
  toggle: (productId: string) => CompareToggleResult;
  /** Thay cả danh sách (nút "Lưu vào danh sách so sánh" của liên kết chia sẻ), bỏ id lạ/trùng và cắt theo `COMPARE_MAX`. */
  setIds: (productIds: string[]) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

/** Bỏ id trùng/id không có trong catalog và cắt về tối đa `COMPARE_MAX`. */
export function normalizeCompareIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  for (const entry of value) {
    if (typeof entry !== "string" || seen.has(entry)) continue;
    if (!getProductById(entry)) continue;
    seen.add(entry);
    if (seen.size >= COMPARE_MAX) break;
  }
  return Array.from(seen);
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (productId) => {
        const { ids } = get();
        if (ids.includes(productId)) {
          set({ ids: ids.filter((id) => id !== productId) });
          return "removed";
        }
        if (!getProductById(productId)) return "invalid";
        if (ids.length >= COMPARE_MAX) return "full";
        set({ ids: [...ids, productId] });
        return "added";
      },
      setIds: (productIds) => set({ ids: normalizeCompareIds(productIds) }),
      remove: (productId) => set((state) => ({ ids: state.ids.filter((id) => id !== productId) })),
      clear: () => set({ ids: [] }),
    }),
    {
      name: COMPARE_STORAGE_KEY,
      version: COMPARE_STORAGE_VERSION,
      partialize: (state) => ({ ids: state.ids }),
      // Dữ liệu cũ (khác version) cũng đi qua cùng bộ lọc, không tin `localStorage`.
      migrate: (persisted) => ({ ids: normalizeCompareIds((persisted as { ids?: unknown } | null | undefined)?.ids) }),
      merge: (persisted, current) => ({
        ...current,
        ids: normalizeCompareIds((persisted as { ids?: unknown } | null | undefined)?.ids),
      }),
    },
  ),
);
