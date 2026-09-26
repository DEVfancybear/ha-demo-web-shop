"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { ProductThumb } from "@/components/common/product-thumb";
import { QuantityStepper } from "@/components/product/quantity-stepper";
import { formatVND } from "@/lib/format";
import { useCartStore } from "@/stores/cart-store";
import type { CartItem } from "@/types";

export function CartLineItem({ item }: { item: CartItem }) {
  const setQuantity = useCartStore((state) => state.setQuantity);
  const remove = useCartStore((state) => state.remove);

  return (
    <li className="flex flex-col gap-3 border-b border-zinc-200 py-4 last:border-b-0 sm:flex-row sm:items-center dark:border-zinc-800">
      <ProductThumb emoji={item.emoji} tone={item.tone} className="h-20 w-20 shrink-0 rounded-xl text-3xl" />

      <div className="flex-1">
        <Link href={`/products/${item.slug}`} className="font-medium hover:underline">
          {item.name}
        </Link>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Đơn giá {formatVND(item.price)}</p>
      </div>

      <QuantityStepper value={item.quantity} onChange={(next) => setQuantity(item.productId, next)} size="sm" />

      <div className="w-32 text-right font-semibold">{formatVND(item.price * item.quantity)}</div>

      <button
        type="button"
        aria-label={`Xoá ${item.name} khỏi giỏ`}
        onClick={() => remove(item.productId)}
        className="grid h-9 w-9 place-items-center self-start rounded-full text-zinc-500 hover:bg-red-50 hover:text-red-600 sm:self-center dark:hover:bg-red-950/40"
      >
        <Trash2 size={16} />
      </button>
    </li>
  );
}
