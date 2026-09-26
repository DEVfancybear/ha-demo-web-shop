import Link from "next/link";
import { Suspense } from "react";
import { Menu, Phone } from "lucide-react";
import { siteConfig, mainNav } from "@/lib/config";
import { CartButton } from "@/components/layout/cart-button";
import { SearchBar } from "@/components/layout/search-bar";
import { categories } from "@/data/catalog";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="bg-zinc-900 px-4 py-1.5 text-center text-xs text-zinc-100">
        Miễn phí vận chuyển cho đơn từ {siteConfig.freeShippingFrom.toLocaleString("vi-VN")}₫ · Hotline {siteConfig.hotline}
      </div>
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-zinc-900 text-sm text-white dark:bg-white dark:text-zinc-900">
            HA
          </span>
          {siteConfig.name}
        </Link>

        <nav aria-label="Điều hướng chính" className="hidden items-center gap-1 md:flex">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden max-w-xs flex-1 md:block">
          <Suspense fallback={<div className="h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800" />}>
            <SearchBar />
          </Suspense>
        </div>

        <a
          href={`tel:${siteConfig.hotline.replace(/\s/g, "")}`}
          className="hidden items-center gap-1.5 text-sm font-medium text-zinc-700 lg:flex dark:text-zinc-200"
        >
          <Phone size={16} /> {siteConfig.hotline}
        </a>
        <CartButton />
      </div>

      <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-3 text-sm">
        <Link
          href="/products"
          className="shrink-0 rounded-full bg-zinc-900 px-3 py-1.5 font-medium text-white dark:bg-white dark:text-zinc-900"
        >
          Tất cả
        </Link>
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/products?category=${category.slug}`}
            className="shrink-0 rounded-full border border-zinc-200 px-3 py-1.5 font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <span aria-hidden className="mr-1">{category.emoji}</span>
            {category.name}
          </Link>
        ))}
        <span className="ml-auto hidden items-center gap-1 text-zinc-400 md:flex">
          <Menu size={14} /> Dùng menu để lọc theo danh mục
        </span>
      </div>
    </header>
  );
}
