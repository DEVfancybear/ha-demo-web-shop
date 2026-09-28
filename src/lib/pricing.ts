import { siteConfig } from "@/lib/config";

/**
 * Quy tắc tính tiền dùng chung cho giỏ hàng (client) và đơn hàng (server).
 * Trước đây luật này nằm ở hai nơi nên nhãn và số tiền dễ lệch nhau.
 */
export type PricedLine = { price: number; quantity: number };

export const discountLabel = `Giảm giá đơn lớn (${Math.round(siteConfig.bulkDiscountRate * 100)}%)`;

export function subtotalFor(lines: PricedLine[]) {
  return lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
}

export function shippingFeeFor(subtotal: number) {
  if (subtotal === 0) return 0;
  return subtotal >= siteConfig.freeShippingFrom ? 0 : siteConfig.shippingFee;
}

export function discountFor(subtotal: number) {
  if (subtotal >= siteConfig.bulkDiscountFrom) {
    return Math.round(subtotal * siteConfig.bulkDiscountRate);
  }
  return 0;
}

export function totalsFor(lines: PricedLine[]) {
  const subtotal = subtotalFor(lines);
  const shippingFee = shippingFeeFor(subtotal);
  const discount = discountFor(subtotal);
  return { subtotal, shippingFee, discount, total: subtotal + shippingFee - discount };
}
