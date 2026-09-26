import Link from "next/link";
import { BadgeCheck, Headphones, RefreshCcw, Truck } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { ProductGrid } from "@/components/product/product-grid";
import { getCategories, getFeaturedProducts } from "@/data/catalog";
import { formatNumber } from "@/lib/format";
import { siteConfig } from "@/lib/config";

const benefits = [
  { icon: Truck, title: "Giao nhanh 2 giờ", text: "Nội thành TP.HCM và Hà Nội, miễn phí từ 500.000₫." },
  { icon: BadgeCheck, title: "Hàng chính hãng", text: "Bảo hành 12–24 tháng, đổi mới trong 30 ngày." },
  { icon: RefreshCcw, title: "Đổi trả dễ dàng", text: "Hỗ trợ đổi trả tận nhà, không cần hoá đơn giấy." },
  { icon: Headphones, title: "Tư vấn 24/7", text: `Hotline ${siteConfig.hotline} và chat trực tuyến.` },
];

export default function HomePage() {
  const featured = getFeaturedProducts(8);
  const categories = getCategories();

  return (
    <div className="space-y-14">
      <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900">
        <div className="grid gap-8 p-8 lg:grid-cols-2 lg:p-12">
          <div className="space-y-5">
            <span className="inline-flex rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white dark:bg-white dark:text-zinc-900">
              Ưu đãi tháng 9 · giảm tới 15%
            </span>
            <h1 className="text-3xl leading-tight font-bold sm:text-4xl">
              Đồ công nghệ cho mọi nhu cầu, giá minh bạch
            </h1>
            <p className="max-w-lg text-zinc-600 dark:text-zinc-300">
              {formatNumber(featured.length * 2)} sản phẩm demo thuộc {categories.length} nhóm hàng: điện thoại, laptop,
              tai nghe, đồng hồ và phụ kiện. Đặt hàng thử ngay để trải nghiệm luồng mua sắm hoàn chỉnh.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/products" className={buttonClass({ size: "lg" })}>
                Mua sắm ngay
              </Link>
              <Link href="/orders" className={buttonClass({ variant: "outline", size: "lg" })}>
                Xem đơn hàng demo
              </Link>
            </div>
            <dl className="grid grid-cols-3 gap-4 pt-4 text-sm">
              <div>
                <dt className="text-zinc-500">Sản phẩm</dt>
                <dd className="text-lg font-semibold">16</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Danh mục</dt>
                <dd className="text-lg font-semibold">{categories.length}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Đánh giá</dt>
                <dd className="text-lg font-semibold">4.6/5</dd>
              </div>
            </dl>
          </div>

          <div className="grid grid-cols-2 gap-3 self-center">
            {featured.slice(0, 4).map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white/70 p-3 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60"
              >
                <span aria-hidden className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br text-2xl ${product.tone}`}>
                  {product.emoji}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{product.name}</span>
                  <span className="block text-xs text-zinc-500">{product.brand}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="danh-muc">
        <div className="mb-5 flex items-end justify-between">
          <h2 id="danh-muc" className="text-xl font-bold">
            Danh mục nổi bật
          </h2>
          <Link href="/products" className="text-sm font-medium hover:underline">
            Xem tất cả
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/products?category=${category.slug}`}
              className="rounded-2xl border border-zinc-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              <span aria-hidden className="text-3xl">{category.emoji}</span>
              <h3 className="mt-3 font-semibold">{category.name}</h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{category.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="noi-bat">
        <div className="mb-5 flex items-end justify-between">
          <h2 id="noi-bat" className="text-xl font-bold">
            Sản phẩm nổi bật
          </h2>
          <Link href="/products?sort=rating" className="text-sm font-medium hover:underline">
            Xem theo đánh giá
          </Link>
        </div>
        <ProductGrid products={featured} />
      </section>

      <section aria-labelledby="vi-sao">
        <h2 id="vi-sao" className="mb-5 text-xl font-bold">
          Vì sao chọn {siteConfig.name}?
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <benefit.icon className="text-zinc-900 dark:text-zinc-100" size={22} />
              <h3 className="mt-3 font-semibold">{benefit.title}</h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{benefit.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
