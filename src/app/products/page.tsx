import { Suspense } from "react";
import { FilterSidebar } from "@/components/product/filter-sidebar";
import { SortSelect } from "@/components/product/sort-select";
import { ProductGrid } from "@/components/product/product-grid";
import { Pagination } from "@/components/product/pagination";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { filterProducts, getBrands, getCategories, getCategory, sortOptions } from "@/data/catalog";
import { syncStockFromDb } from "@/lib/stock";
import type { SortKey } from "@/types";

export const metadata = {
  title: "Tất cả sản phẩm",
  description: "Lọc theo danh mục, thương hiệu, khoảng giá và sắp xếp sản phẩm.",
  alternates: { canonical: "/products" },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const PER_PAGE = 8;

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  // Tồn kho thật nằm trong SQLite: nạp lại cache trước khi lọc.
  syncStockFromDb();
  const params = await searchParams;
  const read = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const sortParam = read("sort") as SortKey | undefined;
  const sort = sortOptions.some((option) => option.value === sortParam) ? (sortParam as SortKey) : "newest";
  const categorySlug = read("category");
  const category = categorySlug ? getCategory(categorySlug) : undefined;
  const pageParam = Number(read("page") ?? "1");
  const maxPriceParam = Number(read("maxPrice") ?? "0");

  const result = filterProducts({
    q: read("q"),
    category: categorySlug,
    brand: read("brand"),
    sort,
    maxPrice: Number.isFinite(maxPriceParam) && maxPriceParam > 0 ? maxPriceParam : undefined,
    page: Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1,
    perPage: PER_PAGE,
  });

  const buildHref = (nextPage: number) => {
    const next = new URLSearchParams();
    for (const key of ["q", "category", "brand", "sort", "maxPrice"]) {
      const value = read(key);
      if (value) next.set(key, value);
    }
    if (nextPage > 1) next.set("page", String(nextPage));
    const query = next.toString();
    return query ? `/products?${query}` : "/products";
  };

  return (
    <div>
      <Breadcrumbs items={[{ href: "/", label: "Trang chủ" }, { label: category ? category.name : "Sản phẩm" }]} />

      <header className="mb-6">
        <h1 className="text-2xl font-bold">{category ? category.name : "Tất cả sản phẩm"}</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {category ? category.description : "Toàn bộ danh mục sản phẩm demo."} · Tìm thấy {result.total} sản phẩm
          {read("q") ? ` cho từ khoá “${read("q")}”` : ""}.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />}>
          <FilterSidebar categories={getCategories()} brands={getBrands()} />
        </Suspense>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <Suspense fallback={null}>
              <SortSelect />
            </Suspense>
          </div>

          <ProductGrid products={result.items} />

          <Pagination page={result.page} totalPages={result.totalPages} buildHref={buildHref} />
        </div>
      </div>
    </div>
  );
}
