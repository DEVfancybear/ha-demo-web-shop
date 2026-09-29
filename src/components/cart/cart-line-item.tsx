"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { ProductThumb } from "@/components/common/product-thumb";
import { QuantityStepper } from "@/components/product/quantity-stepper";
import { formatVND } from "@/lib/format";
import { useCartStore } from "@/stores/cart-store";
import type { ResolvedCartLine } from "@/lib/cart";

/**
 * Dòng giỏ hàng nhận sản phẩm + biến thể từ catalog (không đọc giá/tên từ localStorage)
 * và `quantity` đã được kẹp theo tồn kho của biến thể. Một sản phẩm có thể có nhiều dòng
 * nếu khách chọn nhiều phân loại khác nhau.
 */
export function CartLineItem({ line }: { line: ResolvedCartLine }) {
  const setQuantity = useCartStore((state) => state.setQuantity);
  const remove = useCartStore((state) => state.remove);
  const { product, variant, quantity } = line;
  const price = product.salePrice ?? product.price;
  const atMax = quantity >= variant.stock;
  const variantLabel = [variant.color, variant.size].filter(Boolean).join(" · ");

  return (
    <li className="flex flex-col gap-3 border-b border-zinc-200 py-4 last:border-b-0 sm:flex-row sm:items-center dark:border-zinc-800">
      <ProductThumb emoji={product.emoji} tone={product.tone} className="h-20 w-20 shrink-0 rounded-xl text-3xl" />

      <div className="flex-1">
        <Link href={`/products/${product.slug}`} className="font-medium hover:underline">
          {product.name}
        </Link>
        {variantLabel ? (
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">Phân loại: {variantLabel}</p>
        ) : null}
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Đơn giá {formatVND(price)}</p>
        <p
          className={`mt-0.5 text-xs ${
            atMax ? "text-amber-700 dark:text-amber-300" : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          {atMax ? `Chỉ còn ${variant.stock} sản phẩm trong kho` : `Còn ${variant.stock} sản phẩm trong kho`}
        </p>
      </div>

      <QuantityStepper
        value={quantity}
        max={variant.stock}
        onChange={(next) => setQuantity(variant.id, next)}
        size="sm"
      />

      <div className="w-32 text-right font-semibold">{formatVND(price * quantity)}</div>

      <button
        type="button"
        aria-label={`Xoá ${product.name} khỏi giỏ`}
        onClick={() => remove(variant.id)}
        className="grid h-9 w-9 place-items-center self-start rounded-full text-zinc-500 hover:bg-red-50 hover:text-red-600 sm:self-center dark:hover:bg-red-950/40"
      >
        <Trash2 size={16} />
      </button>
    </li>
  );
}
