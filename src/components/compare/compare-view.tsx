"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Info, Trash2, X } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { PriceTag } from "@/components/common/price-tag";
import { ProductThumb } from "@/components/common/product-thumb";
import { Rating } from "@/components/common/rating";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { Button, buttonClass } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProductById } from "@/data/catalog";
import { buildCompareRows, COMPARE_MAX } from "@/lib/compare";
import { useIsMounted } from "@/lib/use-is-mounted";
import { cn } from "@/lib/utils";
import { useCompareStore } from "@/stores/compare-store";
import type { Product } from "@/types";

/** Liên kết chia sẻ được của một danh sách so sánh. */
function shareHref(ids: string[]) {
  return ids.length > 0 ? `/compare?ids=${ids.join(",")}` : "/compare";
}

/**
 * Bảng so sánh. Hai chế độ:
 * - mặc định: đọc danh sách đã chọn từ store (localStorage),
 * - có `?ids=` (liên kết chia sẻ): hiện đúng danh sách trong URL, kèm nút lưu vào danh sách của mình.
 */
export function CompareView({ sharedIds, shareBroken = false }: { sharedIds: string[] | null; shareBroken?: boolean }) {
  const storeIds = useCompareStore((state) => state.ids);
  const remove = useCompareStore((state) => state.remove);
  const clear = useCompareStore((state) => state.clear);
  const setIds = useCompareStore((state) => state.setIds);
  const mounted = useIsMounted();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [copyFallback, setCopyFallback] = useState<string | null>(null);

  const ids = sharedIds ?? (mounted ? storeIds : []);
  const products = ids
    .map((id) => getProductById(id))
    .filter((product): product is Product => Boolean(product));

  // Link chia sẻ hỏng hẳn (mọi id đều không còn) thì nói rõ, không im lặng rơi về danh sách của người mở link.
  if (shareBroken) {
    return (
      <EmptyState
        icon="🔗"
        title="Liên kết chia sẻ không còn sản phẩm nào"
        description="Sản phẩm trong liên kết có thể đã bị gỡ khỏi cửa hàng. Danh sách so sánh của bạn vẫn còn nguyên."
        action={
          <Link href="/compare" className={buttonClass()}>
            Xem danh sách của tôi
          </Link>
        }
      />
    );
  }

  // Chưa hydrate thì chưa biết trong localStorage có gì — hiện khung chờ để HTML server/client khớp.
  if (!sharedIds && !mounted) {
    return <div className="h-64 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" aria-busy />;
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon="⚖️"
        title="Chưa chọn sản phẩm để so sánh"
        description={`Bấm nút so sánh trên thẻ sản phẩm để thêm vào bảng, tối đa ${COMPARE_MAX} sản phẩm.`}
        action={
          <Link href="/products" className={buttonClass()}>
            Xem sản phẩm
          </Link>
        }
      />
    );
  }

  const rows = buildCompareRows(products);

  const removeFromView = (productId: string) => {
    if (sharedIds) {
      router.replace(shareHref(sharedIds.filter((id) => id !== productId)), { scroll: false });
      return;
    }
    remove(productId);
  };

  const clearView = () => {
    if (sharedIds) {
      router.replace("/compare", { scroll: false });
      return;
    }
    clear();
  };

  const saveShared = () => {
    setIds(products.map((product) => product.id));
    router.replace("/compare", { scroll: false });
  };

  const copyLink = async () => {
    const url = new URL(shareHref(products.map((product) => product.id)), window.location.origin).toString();
    try {
      // Clipboard có thể bị chặn (http, quyền trình duyệt) — khi đó hiện liên kết để copy tay.
      await navigator.clipboard.writeText(url);
      setCopyFallback(null);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
      setCopyFallback(url);
    }
  };

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle>Đang so sánh {products.length} sản phẩm</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={copyLink} aria-live="polite">
            <Copy size={16} />
            {copied ? "Đã sao chép liên kết" : "Sao chép liên kết"}
          </Button>
          <Button variant="ghost" size="sm" onClick={clearView}>
            <Trash2 size={16} />
            Xoá tất cả
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {copyFallback ? (
          <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            Trình duyệt chặn sao chép tự động. Liên kết chia sẻ: <code className="break-all">{copyFallback}</code>
          </p>
        ) : null}

        {sharedIds ? (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl bg-sky-50 p-3 text-sm text-sky-900 dark:bg-sky-950/40 dark:text-sky-200">
            <Info size={16} aria-hidden />
            <span>Đây là danh sách chia sẻ qua liên kết.</span>
            <Button
              variant="outline"
              size="sm"
              onClick={saveShared}
              title={storeIds.length > 0 ? "Thay danh sách so sánh đang có bằng danh sách này" : undefined}
            >
              {storeIds.length > 0 ? "Thay danh sách so sánh" : "Lưu vào danh sách so sánh"}
            </Button>
          </div>
        ) : null}

        {/* `contain:paint` để phần tràn ngang của bảng không bị Chromium tính vào scrollWidth của cả trang (đo được: 390px -> 434px khi thiếu). */}
        <div className="overflow-x-auto [contain:paint]">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <caption className="sr-only">Bảng so sánh {products.length} sản phẩm</caption>
            <thead>
              <tr>
                <th
                  scope="col"
                  className="w-28 border-b border-zinc-200 p-3 text-left align-top text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:border-zinc-800"
                >
                  Tiêu chí
                </th>
                {products.map((product) => (
                  <th
                    key={product.id}
                    scope="col"
                    data-compare-column={product.id}
                    className="border-b border-zinc-200 p-3 text-left align-top dark:border-zinc-800"
                  >
                    <div className="flex w-56 flex-col gap-2">
                      <Link href={`/products/${product.slug}`} className="flex items-center gap-2 font-semibold hover:underline">
                        <ProductThumb
                          emoji={product.emoji}
                          tone={product.tone}
                          className="h-10 w-10 shrink-0 rounded-xl text-xl"
                        />
                        <span>{product.name}</span>
                      </Link>
                      <Rating value={product.rating} reviewCount={product.reviewCount} />
                      <PriceTag price={product.price} salePrice={product.salePrice} size="sm" />
                      <div className="flex flex-wrap gap-2">
                        <AddToCartButton product={product} size="sm" label="Thêm vào giỏ" />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFromView(product.id)}
                          aria-label={`Bỏ ${product.name} khỏi so sánh`}
                        >
                          <X size={16} />
                          Bỏ
                        </Button>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} data-row={row.key} data-diff={row.differs ? "true" : "false"}>
                  <th
                    scope="row"
                    className="border-b border-zinc-100 p-3 text-left align-top font-medium text-zinc-500 dark:border-zinc-800"
                  >
                    {row.label}
                    {row.differs ? (
                      <span className="ml-1 text-amber-600" title="Khác nhau giữa các sản phẩm">
                        •<span className="sr-only"> (khác nhau giữa các sản phẩm)</span>
                      </span>
                    ) : null}
                  </th>
                  {row.cells.map((cell) => (
                    <td
                      key={cell.product.id}
                      className={cn(
                        "border-b border-zinc-100 p-3 align-top dark:border-zinc-800",
                        row.differs ? "font-medium text-zinc-900 dark:text-zinc-50" : "text-zinc-500 dark:text-zinc-400",
                      )}
                    >
                      {cell.value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
          Dấu <span className="text-amber-600">•</span> là dòng có giá trị khác nhau giữa các sản phẩm. Bấm nút so
          sánh trên thẻ sản phẩm để thêm hoặc bỏ, tối đa {COMPARE_MAX} sản phẩm.
        </p>
      </CardContent>
    </Card>
  );
}
