import { getCategory } from "@/data/catalog";
import { formatVND, finalPrice } from "@/lib/format";
import type { Product } from "@/types";

/** Số sản phẩm tối đa trong một lần so sánh (bảng rộng hơn thì khó đọc). */
export const COMPARE_MAX = 4;

export type CompareCell = {
  product: Product;
  value: string;
  /** `true` khi giá trị này khác ít nhất một sản phẩm khác trong bảng. */
  differs: boolean;
};

export type CompareRow = {
  /** Khoá ổn định cho React và cho `data-row`. */
  key: string;
  label: string;
  cells: CompareCell[];
  differs: boolean;
};

/** Các dòng so sánh cố định, trước phần thông số kỹ thuật. */
function fixedRows(product: Product): { key: string; label: string; value: string }[] {
  const category = getCategory(product.category);
  return [
    { key: "price", label: "Giá", value: formatVND(finalPrice(product)) },
    { key: "brand", label: "Thương hiệu", value: product.brand },
    { key: "category", label: "Danh mục", value: category?.name ?? product.category },
    { key: "rating", label: "Đánh giá", value: `${product.rating}/5 (${product.reviewCount} lượt)` },
    { key: "stock", label: "Tồn kho", value: `${product.stock} sản phẩm` },
    { key: "highlights", label: "Điểm nổi bật", value: product.highlights.join(" · ") || "—" },
  ];
}

/**
 * Dựng bảng so sánh: các dòng cố định + hợp của mọi nhãn thông số (sản phẩm thiếu nhãn thì "—").
 * Dòng bị đánh dấu `differs` khi các cột không giống nhau, để UI làm nổi phần khác biệt.
 */
export function buildCompareRows(products: Product[]): CompareRow[] {
  if (products.length === 0) return [];

  const specLabels: string[] = [];
  for (const product of products) {
    for (const spec of product.specs) {
      if (!specLabels.includes(spec.label)) specLabels.push(spec.label);
    }
  }

  const perProduct = products.map((product) => fixedRows(product));
  const raw: { key: string; label: string; values: string[] }[] = perProduct[0].map((row) => ({
    key: row.key,
    label: row.label,
    // Cùng bộ khoá nên chỉ cần tra theo `key` là ra giá trị của từng sản phẩm.
    values: perProduct.map((rows) => rows.find((candidate) => candidate.key === row.key)?.value ?? "—"),
  }));

  for (const label of specLabels) {
    raw.push({
      key: `spec:${label}`,
      label,
      values: products.map((product) => product.specs.find((spec) => spec.label === label)?.value ?? "—"),
    });
  }

  return raw.map((row) => {
    const differs = new Set(row.values).size > 1;
    return {
      key: row.key,
      label: row.label,
      differs,
      cells: row.values.map((value, index) => ({ product: products[index], value, differs })),
    };
  });
}

/** Đọc `?ids=p01,p02` thành danh sách id sạch (bỏ khoảng trắng, bỏ trùng). */
export function parseCompareIdsParam(value: string | null | undefined, maxEntries = 32): string[] {
  if (!value) return [];
  const seen: string[] = [];
  for (const part of value.split(",")) {
    const id = part.trim();
    if (!id || seen.includes(id)) continue;
    seen.push(id);
    if (seen.length >= maxEntries) break;
  }
  return seen;
}
