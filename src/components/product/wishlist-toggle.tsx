"use client";

import { Heart } from "lucide-react";
import { useIsMounted } from "@/lib/use-is-mounted";
import { cn } from "@/lib/utils";
import { useWishlistStore } from "@/stores/wishlist-store";

/**
 * Nút bật/tắt yêu thích. Trạng thái đọc từ store (đã chuẩn hoá id) và chỉ hiện sau khi hydrate
 * để HTML server/client khớp nhau. `withLabel` dùng cho trang chi tiết, mặc định là nút tròn trên thẻ.
 */
export function WishlistToggle({
  productId,
  name,
  withLabel = false,
  className,
}: {
  productId: string;
  name: string;
  withLabel?: boolean;
  className?: string;
}) {
  const saved = useWishlistStore((state) => state.ids.includes(productId));
  const toggle = useWishlistStore((state) => state.toggle);
  const mounted = useIsMounted();
  const active = mounted && saved;
  const label = active ? `Bỏ ${name} khỏi yêu thích` : `Thêm ${name} vào yêu thích`;

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      title={label}
      onClick={() => toggle(productId)}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full border transition-colors",
        withLabel ? "h-12 px-5 text-base font-medium" : "h-10 w-10",
        active
          ? "border-red-200 bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          : "border-zinc-200 bg-white/90 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:bg-zinc-800",
        className,
      )}
    >
      <Heart size={withLabel ? 18 : 16} className={active ? "fill-current" : undefined} aria-hidden />
      {withLabel ? <span>{active ? "Đã yêu thích" : "Yêu thích"}</span> : null}
    </button>
  );
}
