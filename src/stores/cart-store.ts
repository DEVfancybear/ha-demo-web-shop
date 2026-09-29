"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultVariant, findVariant, getProductById } from "@/data/catalog";
import { cartCount, clampQuantity } from "@/lib/cart";
import type { CartLine } from "@/types";

export type CartState = {
  items: CartLine[];
  /** Mã giảm giá đang chọn; server vẫn kiểm tra lại khi tạo đơn. */
  voucherCode: string | null;
  add: (productId: string, variantId: string, quantity?: number) => void;
  remove: (variantId: string) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  setVoucher: (code: string | null) => void;
  clear: () => void;
};

/**
 * Giỏ chỉ lưu `productId` + `variantId` + `quantity` trong localStorage.
 * Tên, đơn giá và tồn kho luôn suy lại từ `src/data/catalog.ts` khi render
 * (xem `resolveCartLines`), nên sửa localStorage không đổi được số tiền.
 */
export const CART_STORAGE_KEY = "shop-ha-cart";
export const CART_STORAGE_VERSION = 3;

/** Biến thể mặc định để nâng cấp giỏ của phiên bản cũ (chỉ có productId + quantity). */
function variantIdFor(productId: string, variantId: unknown): string | null {
  const product = getProductById(productId);
  if (!product) return null;
  if (typeof variantId === "string" && variantId && findVariant(product, variantId)) return variantId;
  return defaultVariant(product)?.id ?? null;
}

/** localStorage có thể chứa dữ liệu của phiên bản cũ (hoặc bị sửa tay) — chuẩn hoá lại. */
export function migrateCartState(persisted: unknown): { items: CartLine[] } {
  const raw = persisted as { items?: unknown } | null | undefined;
  if (!raw || !Array.isArray(raw.items)) return { items: [] };
  const items: CartLine[] = [];
  for (const entry of raw.items) {
    const line = entry as { productId?: unknown; variantId?: unknown; quantity?: unknown };
    if (!line || typeof line.productId !== "string" || !line.productId) continue;
    const variantId = variantIdFor(line.productId, line.variantId);
    if (!variantId) continue;
    const quantity = Number(line.quantity);
    items.push({ productId: line.productId, variantId, quantity: Number.isFinite(quantity) ? Math.floor(quantity) : 1 });
  }
  return { items };
}

/** Bỏ dòng không còn hợp lệ và kẹp số lượng theo tồn kho hiện tại của biến thể. */
function normalizeLines(lines: CartLine[]): CartLine[] {
  return lines
    .filter((line) => {
      const product = getProductById(line.productId);
      return Boolean(product && findVariant(product, line.variantId));
    })
    .map((line) => ({ ...line, quantity: clampQuantity(line.variantId, line.quantity) }));
}

function mergeLine(items: CartLine[], productId: string, variantId: string, quantity: number): CartLine[] {
  const existing = items.find((item) => item.variantId === variantId);
  if (existing) {
    return items.map((item) =>
      item.variantId === variantId ? { ...item, quantity: clampQuantity(variantId, item.quantity + quantity) } : item,
    );
  }
  return [...items, { productId, variantId, quantity: clampQuantity(variantId, quantity) }];
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      voucherCode: null,
      add: (productId, variantId, quantity = 1) =>
        set((state) => ({ items: mergeLine(state.items, productId, variantId, quantity) })),
      remove: (variantId) => set((state) => ({ items: state.items.filter((item) => item.variantId !== variantId) })),
      setQuantity: (variantId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((item) => item.variantId !== variantId)
              : state.items.map((item) =>
                  item.variantId === variantId ? { ...item, quantity: clampQuantity(variantId, quantity) } : item,
                ),
        })),
      setVoucher: (code) => set({ voucherCode: code }),
      clear: () => set({ items: [], voucherCode: null }),
    }),
    {
      name: CART_STORAGE_KEY,
      version: CART_STORAGE_VERSION,
      migrate: migrateCartState,
      partialize: (state) => ({ items: state.items, voucherCode: state.voucherCode }),
      /**
       * Khi nạp lại giỏ: nâng cấp dữ liệu cũ, bỏ dòng trỏ tới sản phẩm/biến thể không có
       * trong catalog và kẹp số lượng theo tồn kho, để dữ liệu cũ/bị sửa tay không đi tiếp vào đơn.
       */
      merge: (persisted, current) => {
        const stored = persisted as { voucherCode?: unknown } | null | undefined;
        return {
          ...current,
          voucherCode: typeof stored?.voucherCode === "string" ? stored.voucherCode : null,
          items: normalizeLines(migrateCartState(persisted).items),
        };
      },
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
