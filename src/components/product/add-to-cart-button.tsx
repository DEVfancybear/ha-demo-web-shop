"use client";

import { useState } from "react";
import { Check, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import type { Product } from "@/types";

export function AddToCartButton({
  product,
  quantity = 1,
  size = "md",
  variant = "primary",
  className,
  label = "Thêm vào giỏ",
}: {
  product: Pick<Product, "id" | "slug" | "name" | "price" | "salePrice" | "emoji" | "tone" | "stock">;
  quantity?: number;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "outline" | "subtle";
  className?: string;
  label?: string;
}) {
  const add = useCartStore((state) => state.add);
  const [added, setAdded] = useState(false);
  const outOfStock = product.stock <= 0;

  return (
    <Button
      size={size}
      variant={variant}
      className={className}
      disabled={outOfStock}
      onClick={() => {
        add(product, quantity);
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1600);
      }}
    >
      {added ? <Check size={16} /> : <ShoppingCart size={16} />}
      {outOfStock ? "Hết hàng" : added ? "Đã thêm" : label}
    </Button>
  );
}
