import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Check, Truck } from "lucide-react";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { ProductThumb } from "@/components/common/product-thumb";
import { Rating } from "@/components/common/rating";
import { PriceTag } from "@/components/common/price-tag";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductDetailActions } from "@/components/product/product-detail-actions";
import { ProductGrid } from "@/components/product/product-grid";
import { discountPercent } from "@/lib/format";
import { siteConfig } from "@/lib/config";
import {
  getCategory,
  getProductBySlug,
  getRelatedProducts,
  products,
  withEffectiveStock,
} from "@/data/catalog";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

/** Danh mục là dữ liệu tĩnh: slug lạ trả 404 ngay, không render theo yêu cầu. */
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return { title: "Không tìm thấy sản phẩm" };
  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const found = getProductBySlug(slug);
  if (!found) notFound();

  // Tồn kho hiện tại (đã trừ các đơn trong phiên chạy) để nút thêm vào giỏ không mời hàng đã hết.
  const product = withEffectiveStock(found);
  const category = getCategory(product.category);
  const related = getRelatedProducts(slug).map(withEffectiveStock);
  const discount = discountPercent(product.price, product.salePrice);

  return (
    <div>
      <Breadcrumbs
        items={[
          { href: "/", label: "Trang chủ" },
          { href: "/products", label: "Sản phẩm" },
          ...(category ? [{ href: `/products?category=${category.slug}`, label: category.name }] : []),
          { label: product.name },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-3">
          <ProductThumb
            emoji={product.emoji}
            tone={product.tone}
            className="h-80 w-full rounded-3xl text-8xl sm:h-96"
          />
          <div className="grid grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((index) => (
              <ProductThumb
                key={index}
                emoji={product.emoji}
                tone={product.tone}
                className={`h-20 w-full rounded-2xl text-2xl ${index === 0 ? "ring-2 ring-zinc-900 dark:ring-zinc-100" : "opacity-70"}`}
              />
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="outline">{product.brand}</Badge>
            {category ? <Badge tone="outline">{category.name}</Badge> : null}
            {discount > 0 ? <Badge tone="sale">Giảm {discount}%</Badge> : null}
            {product.featured ? <Badge tone="new">Nổi bật</Badge> : null}
          </div>

          <h1 className="text-2xl font-bold sm:text-3xl">{product.name}</h1>
          <Rating value={product.rating} reviewCount={product.reviewCount} size={16} />
          <PriceTag price={product.price} salePrice={product.salePrice} size="lg" />
          <p className="text-zinc-600 dark:text-zinc-300">{product.description}</p>

          <ul className="space-y-2 text-sm">
            {product.highlights.map((highlight) => (
              <li key={highlight} className="flex items-start gap-2">
                <Check size={16} className="mt-0.5 text-emerald-600" />
                {highlight}
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-zinc-50 p-3 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
            <Truck size={16} />
            Miễn phí vận chuyển từ {siteConfig.freeShippingFrom.toLocaleString("vi-VN")}₫ · Bảo hành 12 tháng
          </div>

          <ProductDetailActions product={product} />

          <Card>
            <CardHeader>
              <CardTitle>Thông số kỹ thuật</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
                {product.specs.map((spec) => (
                  <div key={spec.label} className="flex justify-between gap-4 py-2">
                    <dt className="text-zinc-500">{spec.label}</dt>
                    <dd className="text-right font-medium">{spec.value}</dd>
                  </div>
                ))}
                <div className="flex justify-between gap-4 py-2">
                  <dt className="text-zinc-500">Tồn kho</dt>
                  <dd className="text-right font-medium">{product.stock} sản phẩm</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>

      <section className="mt-14" aria-labelledby="tuong-tu">
        <div className="mb-5 flex items-end justify-between">
          <h2 id="tuong-tu" className="text-xl font-bold">
            Sản phẩm tương tự
          </h2>
          <Link href={`/products?category=${product.category}`} className="text-sm font-medium hover:underline">
            Xem cả danh mục
          </Link>
        </div>
        <ProductGrid products={related} />
      </section>
    </div>
  );
}
