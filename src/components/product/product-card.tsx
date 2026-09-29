import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { PriceTag } from "@/components/common/price-tag";
import { Rating } from "@/components/common/rating";
import { ProductThumb } from "@/components/common/product-thumb";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { CompareToggle } from "@/components/product/compare-toggle";
import { WishlistToggle } from "@/components/product/wishlist-toggle";
import { discountPercent } from "@/lib/format";
import type { Product } from "@/types";

export function ProductCard({ product }: { product: Product }) {
  const discount = discountPercent(product.price, product.salePrice);
  return (
    <article className="group @container flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <div className="relative">
        <Link href={`/products/${product.slug}`} className="relative block">
          <ProductThumb
            emoji={product.emoji}
            tone={product.tone}
            className="h-44 w-full text-6xl transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <div className="absolute top-3 left-3 flex gap-2">
            {discount > 0 ? <Badge tone="sale">-{discount}%</Badge> : null}
            {product.featured ? <Badge tone="new">Nổi bật</Badge> : null}
            {product.stock <= 5 && product.stock > 0 ? <Badge tone="warning">Sắp hết</Badge> : null}
            {product.stock === 0 ? <Badge tone="outline">Hết hàng</Badge> : null}
          </div>
        </Link>
        {/* Nút yêu thích/so sánh nằm ngoài thẻ Link để bấm không bị điều hướng sang trang chi tiết. */}
        <div className="absolute top-3 right-3 flex gap-1.5">
          <WishlistToggle productId={product.id} name={product.name} className="shadow-sm backdrop-blur" />
          <CompareToggle productId={product.id} name={product.name} className="shadow-sm backdrop-blur" />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs font-medium text-zinc-500 uppercase dark:text-zinc-400">{product.brand}</p>
        <h3 className="line-clamp-2 text-sm font-semibold">
          <Link href={`/products/${product.slug}`} className="hover:underline">
            {product.name}
          </Link>
        </h3>
        <Rating value={product.rating} reviewCount={product.reviewCount} />
        <PriceTag price={product.price} salePrice={product.salePrice} className="mt-auto" />
        {/* Hai nút thao tác: xếp ngang khi thẻ đủ rộng, xếp dọc khi thẻ hẹp (lưới 4 cột kèm sidebar). */}
        <div className="mt-2 flex flex-col gap-2 @[260px]:flex-row">
          <AddToCartButton
            product={product}
            size="sm"
            className="w-full @[260px]:w-auto @[260px]:flex-1"
            label="Thêm vào giỏ"
          />
          <Link
            href={`/products/${product.slug}`}
            className={buttonClass({ variant: "outline", size: "sm", className: "w-full @[260px]:w-auto" })}
          >
            Chi tiết
          </Link>
        </div>
      </div>
    </article>
  );
}
