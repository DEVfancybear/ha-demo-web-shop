import { findVariant, getProductById, products, variantStockOf } from "@/data/catalog";
import { finalPrice } from "@/lib/format";
import type { CartLine, Product, Variant } from "@/types";

export type ResolvedCartLine = { product: Product; variant: Variant; quantity: number };

/** Tìm biến thể theo id trên toàn catalog (id đã bao gồm id sản phẩm). */
export function findVariantById(variantId: string): { product: Product; variant: Variant } | undefined {
  for (const product of products) {
    const variant = findVariant(product, variantId);
    if (variant) return { product, variant };
  }
  return undefined;
}

/** Số lượng hợp lệ cho một biến thể: số nguyên trong khoảng 1..tồn kho của biến thể. */
export function clampQuantity(variantId: string, quantity: number): number {
  const found = findVariantById(variantId);
  if (!found) return 1;
  const max = Math.max(1, variantStockOf(found.variant));
  const safe = Number.isFinite(quantity) ? Math.floor(quantity) : 1;
  return Math.min(Math.max(1, safe || 1), max);
}

export function priceOf(product: Product) {
  return finalPrice(product);
}

/**
 * Suy tên/đơn giá/tồn kho từ catalog khi render:
 * - dòng trỏ tới sản phẩm/biến thể không tồn tại hoặc đã hết hàng bị bỏ,
 * - dòng vượt tồn kho bị kẹp về đúng tồn kho của biến thể,
 * - hai dòng cùng biến thể được gộp lại.
 */
export function resolveCartLines(lines: CartLine[]): ResolvedCartLine[] {
  const byVariant = new Map<string, ResolvedCartLine>();
  for (const line of lines) {
    const product = getProductById(line.productId) ?? findVariantById(line.variantId)?.product;
    if (!product) continue;
    const variant = findVariant(product, line.variantId);
    if (!variant || variantStockOf(variant) < 1) continue;
    const existing = byVariant.get(variant.id);
    const quantity = clampQuantity(variant.id, (existing?.quantity ?? 0) + line.quantity);
    byVariant.set(variant.id, { product, variant, quantity });
  }
  return Array.from(byVariant.values());
}

export function pricedLines(lines: ResolvedCartLine[]) {
  return lines.map((line) => ({ price: priceOf(line.product), quantity: line.quantity }));
}

export function cartCount(lines: CartLine[]) {
  return resolveCartLines(lines).reduce((sum, line) => sum + line.quantity, 0);
}
