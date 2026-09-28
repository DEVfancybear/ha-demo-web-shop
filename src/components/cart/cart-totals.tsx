"use client";

import { formatVND } from "@/lib/format";
import { siteConfig } from "@/lib/config";
import { discountLabel, totalsFor } from "@/lib/pricing";
import { pricedLines, type ResolvedCartLine } from "@/lib/cart";

/** Bảng tiền dùng chung một nguồn luật với server (`src/lib/pricing.ts`). */
export function CartTotals({
  lines,
  showFreeShippingHint = true,
}: {
  lines: ResolvedCartLine[];
  showFreeShippingHint?: boolean;
}) {
  const { subtotal, shippingFee, discount, total } = totalsFor(pricedLines(lines));

  return (
    <dl className="space-y-3 text-sm">
      <div className="flex justify-between">
        <dt className="text-zinc-600 dark:text-zinc-300">Tạm tính</dt>
        <dd className="font-medium">{formatVND(subtotal)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-zinc-600 dark:text-zinc-300">Phí vận chuyển</dt>
        <dd className="font-medium">{shippingFee === 0 ? "Miễn phí" : formatVND(shippingFee)}</dd>
      </div>
      {discount > 0 ? (
        <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
          <dt>{discountLabel}</dt>
          <dd className="font-medium">-{formatVND(discount)}</dd>
        </div>
      ) : null}
      <div className="flex justify-between border-t border-zinc-200 pt-3 text-base dark:border-zinc-800">
        <dt className="font-semibold">Tổng cộng</dt>
        <dd className="font-bold">{formatVND(total)}</dd>
      </div>
      {showFreeShippingHint && shippingFee > 0 ? (
        <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          Mua thêm {formatVND(siteConfig.freeShippingFrom - subtotal)} để được miễn phí vận chuyển.
        </p>
      ) : null}
    </dl>
  );
}
