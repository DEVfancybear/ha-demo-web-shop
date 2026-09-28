"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PRICE_MIN, PRICE_STEP, clampMaxPrice, priceSliderMax } from "@/data/catalog";
import type { Category } from "@/types";

export function FilterSidebar({ categories, brands }: { categories: Category[]; brands: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);

  const currentCategory = params.get("category") ?? "";
  const currentBrand = params.get("brand") ?? "";

  // `?maxPrice=abc` cho NaN (trước đây hiện "Dưới NaN₫"); giá trị ngoài [min, max] của thanh trượt
  // cũng bị kẹp lại để nhãn luôn khớp `input.value` và khớp danh sách sản phẩm.
  const sliderMax = priceSliderMax();
  const parsedMax = Number(params.get("maxPrice"));
  const currentMax = Number.isFinite(parsedMax) && parsedMax > 0 ? clampMaxPrice(parsedMax) : sliderMax;

  const resetAll = () => {
    router.push(pathname);
  };

  const apply = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    next.delete("page");
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const priceOptions = [5_000_000, 10_000_000, 20_000_000, 30_000_000, sliderMax];

  return (
    <aside className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">Bộ lọc</h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={resetAll}>
            Xoá hết
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden"
            aria-expanded={open}
            aria-controls="filter-panel"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "Thu gọn" : "Mở lọc"}
          </Button>
        </div>
      </div>

      {/* Trên mobile bộ lọc đóng sẵn để danh sách sản phẩm lên đầu trang; từ lg luôn mở. */}
      <div id="filter-panel" className={open ? "space-y-6" : "hidden space-y-6 lg:block"}>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Danh mục</legend>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => apply({ category: null })}
              aria-pressed={currentCategory === ""}
              className={`block w-full rounded-lg px-2 py-1.5 text-left text-sm ${
                currentCategory === "" ? "bg-zinc-900 text-white" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              Tất cả danh mục
            </button>
            {categories.map((category) => (
              <button
                key={category.slug}
                type="button"
                onClick={() => apply({ category: category.slug })}
                aria-pressed={currentCategory === category.slug}
                className={`block w-full rounded-lg px-2 py-1.5 text-left text-sm ${
                  currentCategory === category.slug
                    ? "bg-zinc-900 text-white"
                    : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                <span aria-hidden className="mr-1.5">{category.emoji}</span>
                {category.name}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Thương hiệu</legend>
          <div className="space-y-1.5">
            {brands.map((brand) => (
              <label key={brand} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="brand"
                  value={brand}
                  checked={currentBrand === brand}
                  onChange={() => apply({ brand })}
                  className="h-4 w-4"
                />
                {brand}
              </label>
            ))}
            {currentBrand ? (
              <button
                type="button"
                className="text-xs font-medium text-blue-600 hover:underline"
                onClick={() => apply({ brand: null })}
              >
                Bỏ chọn thương hiệu
              </button>
            ) : null}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Giá tối đa</legend>
          <input
            type="range"
            min={PRICE_MIN}
            max={sliderMax}
            step={PRICE_STEP}
            value={currentMax}
            aria-label="Giá tối đa"
            onChange={(event) => apply({ maxPrice: event.target.value })}
            className="w-full accent-zinc-900"
          />
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Dưới {currentMax.toLocaleString("vi-VN")}₫
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {priceOptions.map((price) => (
              <button
                key={price}
                type="button"
                onClick={() => apply({ maxPrice: price >= sliderMax ? null : String(price) })}
                className="rounded-full border border-zinc-200 px-2.5 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                {price >= sliderMax ? "Mọi mức giá" : `≤ ${(price / 1_000_000).toLocaleString("vi-VN")}tr`}
              </button>
            ))}
          </div>
        </fieldset>
      </div>
    </aside>
  );
}
