import { getProductById, stockOf } from "@/data/catalog";
import { finalPrice } from "@/lib/format";
import type { CartLine, Product } from "@/types";

export type ResolvedCartLine = { product: Product; quantity: number };

/** Số lượng hợp lệ cho một sản phẩm: số nguyên trong khoảng 1..tồn kho. */
export function clampQuantity(productId: string, quantity: number): number {
  const product = getProductById(productId);
  if (!product) return 1;
  const max = Math.max(1, stockOf(product));
  const safe = Number.isFinite(quantity) ? Math.floor(quantity) : 1;
  return Math.min(Math.max(1, safe || 1), max);
}

export function priceOf(product: Product) {
  return finalPrice(product);
}

/**
 * Suy tên/đơn giá/tồn kho từ catalog khi render:
 * - dòng trỏ tới sản phẩm không tồn tại hoặc đã hết hàng bị bỏ,
 * - dòng vượt tồn kho bị kẹp về đúng tồn kho.
 */
export function resolveCartLines(lines: CartLine[]): ResolvedCartLine[] {
  const resolved: ResolvedCartLine[] = [];
  for (const line of lines) {
    const product = getProductById(line.productId);
    if (!product) continue;
    if (stockOf(product) < 1) continue;
    resolved.push({ product, quantity: clampQuantity(product.id, line.quantity) });
  }
  return resolved;
}

export function pricedLines(lines: ResolvedCartLine[]) {
  return lines.map((line) => ({ price: priceOf(line.product), quantity: line.quantity }));
}

export function cartCount(lines: CartLine[]) {
  return resolveCartLines(lines).reduce((sum, line) => sum + line.quantity, 0);
}
