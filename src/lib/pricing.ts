import { siteConfig } from "@/lib/config";
import type { Voucher } from "@/types";

/**
 * Quy tắc tính tiền dùng chung cho giỏ hàng (client) và đơn hàng (server).
 * Trước đây luật này nằm ở hai nơi nên nhãn và số tiền dễ lệch nhau.
 */
export type PricedLine = { price: number; quantity: number };

export const bulkDiscountLabel = `Giảm giá đơn lớn (${Math.round(siteConfig.bulkDiscountRate * 100)}%)`;

export function subtotalFor(lines: PricedLine[]) {
  return lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
}

export function shippingFeeFor(subtotal: number) {
  if (subtotal === 0) return 0;
  return subtotal >= siteConfig.freeShippingFrom ? 0 : siteConfig.shippingFee;
}

/** Giảm giá đơn lớn theo luật chung (10% cho đơn từ 5 triệu). */
export function bulkDiscountFor(subtotal: number) {
  if (subtotal >= siteConfig.bulkDiscountFrom) {
    return Math.round(subtotal * siteConfig.bulkDiscountRate);
  }
  return 0;
}

/**
 * Mức giảm của một mã giảm giá, đã kẹp để tổng tiền không bao giờ âm:
 * mã phần trăm bị giới hạn bởi `maxDiscount`, mã `shipping` giảm đúng phí vận chuyển.
 */
export function voucherDiscountFor(voucher: Voucher | undefined, subtotal: number, shippingFee: number): number {
  if (!voucher) return 0;
  let raw: number;
  if (voucher.kind === "percent") raw = Math.round(subtotal * voucher.value);
  else if (voucher.kind === "amount") raw = voucher.value;
  else raw = shippingFee;
  if (voucher.maxDiscount !== undefined) raw = Math.min(raw, voucher.maxDiscount);
  const ceiling = Math.max(0, subtotal + shippingFee - bulkDiscountFor(subtotal));
  return Math.max(0, Math.min(raw, ceiling));
}

/** Tổng tiền của một giỏ/đơn: một nguồn duy nhất cho cả client và server. */
export function totalsFor(lines: PricedLine[], voucher?: Voucher) {
  const subtotal = subtotalFor(lines);
  const shippingFee = shippingFeeFor(subtotal);
  const bulkDiscount = bulkDiscountFor(subtotal);
  const voucherDiscount = voucherDiscountFor(voucher, subtotal, shippingFee);
  const discount = bulkDiscount + voucherDiscount;
  return { subtotal, shippingFee, bulkDiscount, voucherDiscount, discount, total: subtotal + shippingFee - discount };
}
