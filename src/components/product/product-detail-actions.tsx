"use client";

import { useState } from "react";
import Link from "next/link";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { QuantityStepper } from "@/components/product/quantity-stepper";
import { buttonClass } from "@/components/ui/button";
import type { Product } from "@/types";

export function ProductDetailActions({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Số lượng</span>
        <QuantityStepper value={quantity} max={Math.max(1, product.stock)} onChange={setQuantity} />
        <span className="text-xs text-zinc-500">Còn {product.stock} sản phẩm</span>
      </div>
      <div className="flex flex-wrap gap-3">
        <AddToCartButton product={product} quantity={quantity} size="lg" label="Thêm vào giỏ hàng" />
        <Link
          href="/cart"
          className={buttonClass({ variant: "outline", size: "lg" })}
        >
          Xem giỏ hàng
        </Link>
      </div>
    </div>
  );
}
