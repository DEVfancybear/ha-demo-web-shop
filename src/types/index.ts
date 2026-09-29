export type Category = {
  slug: string;
  name: string;
  description: string;
  emoji: string;
};

export type Spec = { label: string; value: string };

/**
 * Biến thể của sản phẩm (màu/kích cỡ hoặc phiên bản). Tồn kho được quản lý theo biến thể:
 * `src/data/catalog.ts` chỉ là số gốc, server giữ số thật sau mỗi đơn.
 */
export type Variant = {
  id: string;
  color: string;
  size: string;
  stock: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  /** Giá gốc, đơn vị VND */
  price: number;
  /** Giá khuyến mãi (nếu có) */
  salePrice?: number;
  rating: number;
  reviewCount: number;
  /** Tổng tồn kho, luôn bằng tổng `stock` của các biến thể */
  stock: number;
  variants: Variant[];
  description: string;
  highlights: string[];
  specs: Spec[];
  emoji: string;
  /** Lớp gradient dùng cho ảnh placeholder */
  tone: string;
  featured?: boolean;
  createdAt: string;
};

/**
 * Dòng trong giỏ hàng. Chỉ lưu `productId` + `variantId` + `quantity` để giỏ không thể bị sửa giá:
 * tên, đơn giá và tồn kho luôn được suy lại từ `src/data/catalog.ts` khi render.
 */
export type CartLine = {
  productId: string;
  variantId: string;
  quantity: number;
};

/** Dòng trong đơn hàng: server chốt tên/đơn giá/biến thể tại thời điểm đặt. */
export type OrderItem = {
  productId: string;
  variantId: string;
  /** Nhãn biến thể tại thời điểm đặt, ví dụ "Đen · 256GB" */
  variantLabel: string;
  slug: string;
  name: string;
  price: number;
  emoji: string;
  tone: string;
  quantity: number;
};

/** Nguồn của một gợi ý trong ô tìm kiếm. */
export type SearchSuggestionType = "product" | "category" | "brand";

/**
 * Gợi ý tìm kiếm trả về từ `GET /api/search/suggest`.
 * `price`/`salePrice` chỉ có với gợi ý sản phẩm; giá vẫn do server đọc từ catalog.
 */
export type SearchSuggestion = {
  type: SearchSuggestionType;
  label: string;
  href: string;
  meta?: string;
  emoji?: string;
  price?: number;
  salePrice?: number;
};

export type SearchSuggestResult = {
  query: string;
  /** Độ dài tối thiểu của từ khoá để có gợi ý. */
  minLength: number;
  /** Tổng số sản phẩm khớp (không bị cắt theo `limit`). */
  total: number;
  items: SearchSuggestion[];
};

export type ProductQuery = {
  q?: string;
  category?: string;
  brand?: string;
  sort?: SortKey;
  maxPrice?: number;
  page?: number;
  perPage?: number;
};

export type SortKey = "newest" | "price-asc" | "price-desc" | "rating" | "name";

export type PaymentMethod = "cod" | "bank" | "momo";

export type CustomerInfo = {
  name: string;
  phone: string;
  email: string;
  address: string;
  note?: string;
  paymentMethod: PaymentMethod;
};

export type OrderStatus = "pending" | "confirmed" | "shipping" | "done";

/** Loại mã giảm giá: theo phần trăm, theo số tiền, hoặc giảm đúng phí vận chuyển. */
export type VoucherKind = "percent" | "amount" | "shipping";

export type Voucher = {
  code: string;
  label: string;
  kind: VoucherKind;
  /** Phần trăm (0..1) hoặc số tiền, tuỳ `kind`; bỏ qua với `shipping`. */
  value: number;
  /** Giá trị tối thiểu của tạm tính để mã có hiệu lực. */
  minSubtotal: number;
  /** Mức giảm tối đa (dùng cho mã phần trăm). */
  maxDiscount?: number;
};

export type Order = {
  id: string;
  code: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  /** Giảm giá đơn lớn theo luật chung (10% từ 5 triệu). */
  bulkDiscount: number;
  voucherCode?: string;
  voucherDiscount: number;
  /** Tổng giảm giá = bulkDiscount + voucherDiscount. */
  discount: number;
  total: number;
  customer: CustomerInfo;
  status: OrderStatus;
};

export type Review = {
  id: string;
  productId: string;
  author: string;
  rating: number;
  title?: string;
  body: string;
  createdAt: string;
};

export type ReviewInput = {
  author: string;
  rating: number;
  title?: string;
  body: string;
};

/** Điểm đánh giá tổng hợp: số cứng trong catalog + đánh giá thật đã lưu. */
export type ReviewSummary = {
  count: number;
  average: number;
  stored: number;
};
