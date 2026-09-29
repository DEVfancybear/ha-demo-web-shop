"use client";

import { useState } from "react";
import { Check, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { defaultVariant, findVariant, variantStockOf } from "@/data/catalog";
import { useCartStore } from "@/stores/cart-store";
import type { Product } from "@/types";

type CartProduct = Pick<Product, "id" | "slug" | "name" | "price" | "salePrice" | "emoji" | "tone" | "stock" | "variants">;

/**
 * Thêm vào giỏ theo biến thể. Không truyền `variantId` thì dùng biến thể mặc định
 * (còn hàng đầu tiên) — nút "Thêm vào giỏ" trên thẻ sản phẩm hoạt động như trước.
 */
export function AddToCartButton({
  product,
  variantId,
  quantity = 1,
  size = "md",
  variant = "primary",
  className,
  label = "Thêm vào giỏ",
}: {
  product: CartProduct;
  variantId?: string;
  quantity?: number;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "outline" | "subtle";
  className?: string;
  label?: string;
}) {
  const add = useCartStore((state) => state.add);
  const [added, setAdded] = useState(false);
  const target = (variantId ? findVariant(product, variantId) : undefined) ?? defaultVariant(product);
  const stock = target ? variantStockOf(target) : 0;
  const outOfStock = !target || stock <= 0;

  return (
    <Button
      size={size}
      variant={variant}
      className={className}
      disabled={outOfStock}
      onClick={() => {
        if (!target) return;
        add(product.id, target.id, Math.max(1, Math.min(quantity, stock)));
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1600);
      }}
    >
      {added ? <Check size={16} /> : <ShoppingCart size={16} />}
      {outOfStock ? "Hết hàng" : added ? "Đã thêm" : label}
    </Button>
  );
}
