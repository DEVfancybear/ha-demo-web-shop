import Link from "next/link";
import { siteConfig, mainNav } from "@/lib/config";
import { categories } from "@/data/catalog";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-lg font-bold">{siteConfig.name}</p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{siteConfig.description}</p>
        </div>
        <div>
          <p className="font-semibold">Danh mục</p>
          <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link href={`/products?category=${category.slug}`} className="hover:text-zinc-900 dark:hover:text-zinc-100">
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold">Liên kết</p>
          <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-zinc-900 dark:hover:text-zinc-100">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold">Hỗ trợ</p>
          <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <li>Hotline: {siteConfig.hotline}</li>
            <li>{siteConfig.email}</li>
            <li>{siteConfig.address}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-zinc-200 py-5 text-center text-xs text-zinc-500 dark:border-zinc-800">
        © {new Date().getFullYear()} {siteConfig.name}. Dự án demo, không giao dịch thật.
      </div>
    </footer>
  );
}
