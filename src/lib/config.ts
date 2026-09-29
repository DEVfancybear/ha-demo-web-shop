export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "ShopHA",
  /** URL công khai của site, dùng cho canonical/JSON-LD/sitemap. Đổi bằng NEXT_PUBLIC_SITE_URL khi deploy. */
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  description:
    "Cửa hàng demo đồ công nghệ: điện thoại, laptop, tai nghe, đồng hồ và phụ kiện.",
  hotline: process.env.NEXT_PUBLIC_HOTLINE ?? "1900 0000",
  email: "hotro@shopha.demo",
  address: "123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
  currency: "VND",
  shippingFee: 30_000,
  freeShippingFrom: 500_000,
  /** Giảm giá 10% cho đơn từ 5 triệu */
  bulkDiscountFrom: 5_000_000,
  bulkDiscountRate: 0.1,
};

export const mainNav = [
  { href: "/", label: "Trang chủ" },
  { href: "/products", label: "Sản phẩm" },
  { href: "/orders", label: "Đơn hàng" },
];
