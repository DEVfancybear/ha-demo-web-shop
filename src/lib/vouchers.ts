import { findVoucher, normalizeVoucherCode, vouchers } from "@/data/vouchers";
import { formatVND } from "@/lib/format";
import { shippingFeeFor, subtotalFor, voucherDiscountFor, type PricedLine } from "@/lib/pricing";

export type VoucherQuote =
  | { ok: true; code: string; label: string; discount: number; subtotal: number }
  | { ok: false; code: string; message: string };

/**
 * Kiểm tra mã giảm giá trên đúng các dòng hàng do client gửi lên nhưng tính tiền từ catalog,
 * nên sửa localStorage cũng không tạo ra mức giảm khác.
 */
export function quoteVoucher(rawCode: string, lines: PricedLine[]): VoucherQuote {
  const code = normalizeVoucherCode(rawCode);
  if (!code) return { ok: false, code, message: "Vui lòng nhập mã giảm giá." };

  const voucher = findVoucher(code);
  if (!voucher) {
    return { ok: false, code, message: `Mã ${code} không tồn tại. Xem danh sách mã đang chạy bên dưới.` };
  }

  const subtotal = subtotalFor(lines);
  if (subtotal <= 0) {
    return { ok: false, code, message: "Giỏ hàng đang trống nên chưa áp dụng được mã." };
  }
  if (subtotal < voucher.minSubtotal) {
    return { ok: false, code, message: `Mã ${code} chỉ áp dụng cho đơn từ ${formatVND(voucher.minSubtotal)}.` };
  }

  const discount = voucherDiscountFor(voucher, subtotal, shippingFeeFor(subtotal));
  if (discount <= 0) {
    return { ok: false, code, message: `Mã ${code} không giảm thêm cho đơn này.` };
  }

  return { ok: true, code, label: voucher.label, discount, subtotal };
}

/** Danh sách mã công khai để khách thử trong trang giỏ hàng. */
export function publicVouchers() {
  return vouchers.map((voucher) => ({
    code: voucher.code,
    label: voucher.label,
    minSubtotal: voucher.minSubtotal,
  }));
}

/**
 * Mã đang chọn có còn hiệu lực với giỏ hiện tại không?
 * Trả về voucher để tính tiền và thông báo nếu mã không còn hợp lệ (giỏ đổi, thiếu giá trị tối thiểu…).
 */
export function resolveAppliedVoucher(rawCode: string | null | undefined, lines: PricedLine[]) {
  if (!rawCode) return { voucher: undefined, message: undefined, code: null as string | null };
  const quote = quoteVoucher(rawCode, lines);
  if (!quote.ok) return { voucher: undefined, message: quote.message, code: normalizeVoucherCode(rawCode) };
  return { voucher: findVoucher(quote.code), message: undefined, code: quote.code };
}
