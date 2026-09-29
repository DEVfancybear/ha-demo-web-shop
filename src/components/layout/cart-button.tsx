"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCartCount } from "@/stores/cart-store";
import { useIsMounted } from "@/lib/use-is-mounted";
import { cn } from "@/lib/utils";

export function CartButton({ className }: { className?: string }) {
  const count = useCartCount();
  const mounted = useIsMounted();

  // Dấu hiệu "app đã hydrate xong" cho test E2E (tests/e2e.cjs) — không ảnh hưởng giao diện.
  useEffect(() => {
    document.documentElement.dataset.hydrated = "true";
  }, []);

  return (
    <Link
      href="/cart"
      aria-label={`Giỏ hàng${mounted && count > 0 ? ` (${count} sản phẩm)` : ""}`}
      className={cn(
        "relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 text-zinc-800 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800",
        className,
      )}
    >
      <ShoppingCart size={18} />
      {mounted && count > 0 ? (
        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-semibold text-white">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
