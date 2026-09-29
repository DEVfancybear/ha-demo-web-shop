"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useIsMounted } from "@/lib/use-is-mounted";
import { cn } from "@/lib/utils";
import { useWishlistCount } from "@/stores/wishlist-store";

/** Lối vào danh sách yêu thích ở header, kèm số sản phẩm đang lưu. */
export function WishlistButton({ className }: { className?: string }) {
  const count = useWishlistCount();
  const mounted = useIsMounted();

  return (
    <Link
      href="/wishlist"
      aria-label={`Sản phẩm yêu thích${mounted && count > 0 ? ` (${count} sản phẩm)` : ""}`}
      className={cn(
        "relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 text-zinc-800 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800",
        className,
      )}
    >
      <Heart size={18} />
      {mounted && count > 0 ? (
        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-semibold text-white">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
