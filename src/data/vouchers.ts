import type { Voucher } from "@/types";

/**
 * Danh sách mã giảm giá của shop demo. Mã được kiểm tra ở server (`src/lib/vouchers.ts`)
 * nên sửa localStorage cũng không tạo được mức giảm khác.
 */
export const vouchers: Voucher[] = [
  {
    code: "SALE10",
    label: "Giảm 10% cho đơn từ 2 triệu",
    kind: "percent",
    value: 0.1,
    minSubtotal: 2_000_000,
    maxDiscount: 500_000,
  },
  {
    code: "HA100K",
    label: "Giảm 100.000₫ cho đơn từ 1 triệu",
    kind: "amount",
    value: 100_000,
    minSubtotal: 1_000_000,
  },
  {
    code: "FREESHIP",
    label: "Miễn phí vận chuyển",
    kind: "shipping",
    value: 0,
    minSubtotal: 0,
  },
  {
    code: "VIP20",
    label: "Giảm 20% cho đơn từ 10 triệu",
    kind: "percent",
    value: 0.2,
    minSubtotal: 10_000_000,
    maxDiscount: 2_000_000,
  },
];

/** Chuẩn hoá mã người dùng nhập: bỏ khoảng trắng, viết hoa. */
export function normalizeVoucherCode(code: string) {
  return code.trim().toUpperCase();
}

export function findVoucher(code: string): Voucher | undefined {
  const wanted = normalizeVoucherCode(code);
  return vouchers.find((voucher) => voucher.code === wanted);
}
