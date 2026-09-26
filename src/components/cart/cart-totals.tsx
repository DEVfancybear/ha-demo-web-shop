"use client";

import { siteConfig } from "@/lib/config";
import { formatVND } from "@/lib/format";
import { cartSubtotal, discountFor, shippingFeeFor } from "@/stores/cart-store";
import type { CartItem } from "@/types";

export function CartTotals({ items, showFreeShippingHint = true }: { items: CartItem[]; showFreeShippingHint?: boolean }) {
  const subtotal = cartSubtotal(items);
  const shipping = shippingFeeFor(subtotal);
  const discount = discountFor(subtotal);
  const total = subtotal + shipping - discount;

  return (
    <dl className="space-y-3 text-sm">
      <div className="flex justify-between">
        <dt className="text-zinc-600 dark:text-zinc-300">Tạm tính</dt>
        <dd className="font-medium">{formatVND(subtotal)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-zinc-600 dark:text-zinc-300">Phí vận chuyển</dt>
        <dd className="font-medium">{shipping === 0 ? "Miễn phí" : formatVND(shipping)}</dd>
      </div>
      {discount > 0 ? (
        <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
          <dt>Giảm giá đơn lớn ({Math.round(siteConfig.bulkDiscountRate * 100)}%)</dt>
          <dd className="font-medium">-{formatVND(discount)}</dd>
        </div>
      ) : null}
      <div className="flex justify-between border-t border-zinc-200 pt-3 text-base dark:border-zinc-800">
        <dt className="font-semibold">Tổng cộng</dt>
        <dd className="font-bold">{formatVND(total)}</dd>
      </div>
      {showFreeShippingHint && shipping > 0 ? (
        <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          Mua thêm {formatVND(siteConfig.freeShippingFrom - subtotal)} để được miễn phí vận chuyển.
        </p>
      ) : null}
    </dl>
  );
}

export function cartTotalValue(items: CartItem[]) {
  const subtotal = cartSubtotal(items);
  return subtotal + shippingFeeFor(subtotal) - discountFor(subtotal);
}
