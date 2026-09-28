"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { ProductThumb } from "@/components/common/product-thumb";
import { QuantityStepper } from "@/components/product/quantity-stepper";
import { formatVND } from "@/lib/format";
import { useCartStore } from "@/stores/cart-store";
import type { Product } from "@/types";

/**
 * Dòng giỏ hàng nhận `product` từ catalog (không đọc giá/tên từ localStorage)
 * và `quantity` đã được kẹp theo tồn kho.
 */
export function CartLineItem({ product, quantity }: { product: Product; quantity: number }) {
  const setQuantity = useCartStore((state) => state.setQuantity);
  const remove = useCartStore((state) => state.remove);
  const price = product.salePrice ?? product.price;
  const atMax = quantity >= product.stock;

  return (
    <li className="flex flex-col gap-3 border-b border-zinc-200 py-4 last:border-b-0 sm:flex-row sm:items-center dark:border-zinc-800">
      <ProductThumb emoji={product.emoji} tone={product.tone} className="h-20 w-20 shrink-0 rounded-xl text-3xl" />

      <div className="flex-1">
        <Link href={`/products/${product.slug}`} className="font-medium hover:underline">
          {product.name}
        </Link>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Đơn giá {formatVND(price)}</p>
        <p
          className={`mt-0.5 text-xs ${
            atMax ? "text-amber-700 dark:text-amber-300" : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          {atMax ? `Chỉ còn ${product.stock} sản phẩm trong kho` : `Còn ${product.stock} sản phẩm trong kho`}
        </p>
      </div>

      <QuantityStepper
        value={quantity}
        max={product.stock}
        onChange={(next) => setQuantity(product.id, next)}
        size="sm"
      />

      <div className="w-32 text-right font-semibold">{formatVND(price * quantity)}</div>

      <button
        type="button"
        aria-label={`Xoá ${product.name} khỏi giỏ`}
        onClick={() => remove(product.id)}
        className="grid h-9 w-9 place-items-center self-start rounded-full text-zinc-500 hover:bg-red-50 hover:text-red-600 sm:self-center dark:hover:bg-red-950/40"
      >
        <Trash2 size={16} />
      </button>
    </li>
  );
}
