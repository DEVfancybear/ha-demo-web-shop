"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { CartLineItem } from "@/components/cart/cart-line-item";
import { CartTotals } from "@/components/cart/cart-totals";
import { VoucherForm } from "@/components/cart/voucher-form";
import { useCartStore } from "@/stores/cart-store";
import { resolveCartLines } from "@/lib/cart";
import { useIsMounted } from "@/lib/use-is-mounted";

export function CartView() {
  const items = useCartStore((state) => state.items);
  const clear = useCartStore((state) => state.clear);
  const mounted = useIsMounted();
  // Giá/tên/tồn kho luôn lấy từ catalog, không lấy từ localStorage.
  const lines = resolveCartLines(items);

  if (!mounted) {
    return (
      <div className="space-y-3" aria-busy>
        {[0, 1, 2].map((row) => (
          <div key={row} className="h-24 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
        ))}
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <EmptyState
        icon="🛒"
        title="Giỏ hàng đang trống"
        description="Chọn vài sản phẩm trong danh mục rồi quay lại đây để đặt hàng."
        action={
          <Link href="/products" className={buttonClass({ size: "md" })}>
            Xem sản phẩm
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Giỏ hàng ({lines.length} sản phẩm)</CardTitle>
          <Button variant="ghost" size="sm" onClick={clear}>
            Xoá tất cả
          </Button>
        </CardHeader>
        <CardContent>
          {items.length > lines.length ? (
            <p className="mb-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              Một số sản phẩm đã ngừng bán hoặc hết hàng nên được bỏ khỏi giỏ.
            </p>
          ) : null}
          <ul>
            {lines.map((line) => (
              <CartLineItem key={line.variant.id} line={line} />
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="h-fit lg:sticky lg:top-36">
        <CardHeader>
          <CardTitle>Thanh toán</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <VoucherForm lines={lines} />
          <CartTotals lines={lines} />
          <Link href="/checkout" className={buttonClass({ size: "lg", className: "w-full" })}>
            Tiến hành đặt hàng
          </Link>
          <Link href="/products" className={buttonClass({ variant: "outline", className: "w-full" })}>
            Tiếp tục mua sắm
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
