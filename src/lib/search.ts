import { categories, filterProducts, getCategory, getBrands, normalizeSearchText, products } from "@/data/catalog";
import type { Product, SearchSuggestion } from "@/types";

/** Từ khoá ngắn hơn mốc này thì không gợi ý (gõ 1 ký tự gợi ý gần như vô nghĩa). */
export const SUGGEST_MIN_LENGTH = 2;
export const SUGGEST_LIMIT_DEFAULT = 6;
export const SUGGEST_LIMIT_MAX = 8;

export function clampSuggestLimit(limit: number) {
  if (!Number.isFinite(limit)) return SUGGEST_LIMIT_DEFAULT;
  return Math.min(Math.max(Math.floor(limit), 1), SUGGEST_LIMIT_MAX);
}

function categoryNameOf(product: Product) {
  return getCategory(product.category)?.name ?? "";
}

function suggestionOf(product: Product): SearchSuggestion {
  return {
    type: "product",
    label: product.name,
    href: `/products/${product.slug}`,
    meta: [product.brand, categoryNameOf(product)].filter(Boolean).join(" · "),
    emoji: product.emoji,
    price: product.price,
    salePrice: product.salePrice,
  };
}

/**
 * Hạng của một sản phẩm với từ khoá đã bỏ dấu; `null` nghĩa là không khớp.
 * Dùng đúng các trường mà `filterProducts` dò (tên, thương hiệu, mô tả, slug và tên danh mục)
 * nên gợi ý không bao giờ lệch với danh sách ở `/products?q=`.
 */
function rankOf(product: Product, term: string): number | null {
  const name = normalizeSearchText(product.name);
  const brand = normalizeSearchText(product.brand);
  const categoryName = normalizeSearchText(categoryNameOf(product));
  const haystack = [name, brand, normalizeSearchText(product.description), product.category, categoryName].join(" ");
  if (!haystack.includes(term)) return null;
  if (name.startsWith(term)) return 0;
  if (name.includes(term)) return 1;
  if (brand.startsWith(term)) return 2;
  if (brand.includes(term)) return 3;
  if (categoryName.includes(term) || product.category.includes(term)) return 4;
  return 5;
}

/**
 * Gợi ý cho ô tìm kiếm: sản phẩm khớp trước, rồi tới danh mục và thương hiệu khớp.
 * Trả về `total` = số sản phẩm khớp thật (lấy từ `filterProducts`) để UI hiện "Xem tất cả N kết quả".
 */
export function suggestSearch(rawQuery: string | null | undefined, limit: number = SUGGEST_LIMIT_DEFAULT) {
  const query = (rawQuery ?? "").trim();
  const term = normalizeSearchText(query);
  const safeLimit = clampSuggestLimit(limit);
  if (term.length < SUGGEST_MIN_LENGTH) {
    return { query, minLength: SUGGEST_MIN_LENGTH, total: 0, items: [] as SearchSuggestion[] };
  }

  const ranked = products
    .map((product) => ({ product, rank: rankOf(product, term) }))
    .filter((entry): entry is { product: Product; rank: number } => entry.rank !== null)
    .sort(
      (a, b) =>
        a.rank - b.rank ||
        b.product.rating - a.product.rating ||
        a.product.name.localeCompare(b.product.name, "vi"),
    );

  const items: SearchSuggestion[] = ranked.slice(0, safeLimit).map((entry) => suggestionOf(entry.product));

  for (const category of categories) {
    if (items.length >= safeLimit) break;
    if (normalizeSearchText(category.name).includes(term) || category.slug.includes(term)) {
      items.push({
        type: "category",
        label: category.name,
        href: `/products?category=${category.slug}`,
        meta: "Danh mục",
        emoji: category.emoji,
      });
    }
  }

  for (const brand of getBrands()) {
    if (items.length >= safeLimit) break;
    if (normalizeSearchText(brand).includes(term)) {
      items.push({
        type: "brand",
        label: brand,
        href: `/products?brand=${encodeURIComponent(brand)}`,
        meta: "Thương hiệu",
      });
    }
  }

  return {
    query,
    minLength: SUGGEST_MIN_LENGTH,
    total: filterProducts({ q: query, perPage: 1 }).total,
    items: items.slice(0, safeLimit),
  };
}
