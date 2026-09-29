"use client";

import Link from "next/link";
import { EmptyState } from "@/components/common/empty-state";
import { ProductGrid } from "@/components/product/product-grid";
import { Button, buttonClass } from "@/components/ui/button";
import { getProductById } from "@/data/catalog";
import { useIsMounted } from "@/lib/use-is-mounted";
import { useWishlistStore } from "@/stores/wishlist-store";
import type { Product } from "@/types";

/**
 * Danh sách yêu thích đọc từ store; chỉ lưu id nên tên/giá/tồn kho luôn suy lại từ catalog
 * (thẻ sản phẩm vẫn là nơi bỏ yêu thích — bấm trái tim lần nữa).
 */
export function WishlistView() {
  const ids = useWishlistStore((state) => state.ids);
  const clear = useWishlistStore((state) => state.clear);
  const mounted = useIsMounted();

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-busy>
        {[0, 1, 2, 3].map((row) => (
          <div key={row} className="h-80 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
        ))}
      </div>
    );
  }

  const products = ids
    .map((id) => getProductById(id))
    .filter((product): product is Product => Boolean(product));

  if (products.length === 0) {
    return (
      <EmptyState
        icon="❤️"
        title="Chưa có sản phẩm yêu thích"
        description="Bấm trái tim trên thẻ sản phẩm để lưu lại xem sau. Danh sách chỉ nằm trong trình duyệt này."
        action={
          <Link href="/products" className={buttonClass()}>
            Xem sản phẩm
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Đang lưu {products.length} sản phẩm · bấm trái tim để bỏ khỏi danh sách.
        </p>
        <Button variant="ghost" size="sm" onClick={clear}>
          Xoá tất cả
        </Button>
      </div>
      <ProductGrid products={products} />
    </div>
  );
}
