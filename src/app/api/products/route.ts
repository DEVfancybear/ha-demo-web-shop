import { NextResponse } from "next/server";
import { filterProducts } from "@/data/catalog";
import type { SortKey } from "@/types";

const allowedSorts: SortKey[] = ["newest", "price-asc", "price-desc", "rating", "name"];

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sortParam = searchParams.get("sort") as SortKey | null;
  const pageParam = Number(searchParams.get("page") ?? "1");
  const perPageParam = Number(searchParams.get("perPage") ?? "8");
  const maxPriceParam = Number(searchParams.get("maxPrice") ?? "0");

  const result = filterProducts({
    q: searchParams.get("q") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    brand: searchParams.get("brand") ?? undefined,
    sort: sortParam && allowedSorts.includes(sortParam) ? sortParam : "newest",
    maxPrice: Number.isFinite(maxPriceParam) && maxPriceParam > 0 ? maxPriceParam : undefined,
    page: Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1,
    perPage: Number.isFinite(perPageParam) && perPageParam > 0 ? Math.min(perPageParam, 50) : 8,
  });

  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}
