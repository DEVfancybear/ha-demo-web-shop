const vnd = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

/** 12900000 -> "12.900.000 ₫" */
export function formatVND(value: number) {
  return vnd.format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

/** Giảm giá theo phần trăm, trả về 0 nếu không giảm. */
export function discountPercent(price: number, salePrice?: number) {
  if (!salePrice || salePrice >= price) return 0;
  return Math.round(((price - salePrice) / price) * 100);
}

export function finalPrice(product: { price: number; salePrice?: number }) {
  return product.salePrice ?? product.price;
}
