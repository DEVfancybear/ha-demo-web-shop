"use client";

import { useState } from "react";
import Link from "next/link";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { QuantityStepper } from "@/components/product/quantity-stepper";
import { VariantPicker } from "@/components/product/variant-picker";
import { buttonClass } from "@/components/ui/button";
import { defaultVariant, findVariant, variantStockOf } from "@/data/catalog";
import type { Product } from "@/types";

export function ProductDetailActions({ product }: { product: Product }) {
  const initial = defaultVariant(product)?.id ?? product.variants[0]?.id ?? "";
  const [variantId, setVariantId] = useState(initial);
  const [quantity, setQuantity] = useState(1);

  const variant = findVariant(product, variantId) ?? defaultVariant(product);
  const stock = variant ? variantStockOf(variant) : 0;

  return (
    <div className="flex flex-col gap-4">
      <VariantPicker
        variants={product.variants}
        value={variant?.id ?? ""}
        onChange={(next) => {
          // Đổi phân loại thì đưa số lượng về 1 để không vượt tồn kho của biến thể mới.
          setVariantId(next);
          setQuantity(1);
        }}
      />
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Số lượng</span>
        <QuantityStepper value={quantity} max={Math.max(1, stock)} onChange={setQuantity} />
        <span className="text-xs text-zinc-500">
          {stock > 0 ? `Còn ${stock} sản phẩm` : "Phân loại này đã hết hàng"}
        </span>
      </div>
      <div className="flex flex-wrap gap-3">
        <AddToCartButton
          product={product}
          variantId={variant?.id}
          quantity={quantity}
          size="lg"
          label="Thêm vào giỏ hàng"
        />
        <Link href="/cart" className={buttonClass({ variant: "outline", size: "lg" })}>
          Xem giỏ hàng
        </Link>
      </div>
    </div>
  );
}
