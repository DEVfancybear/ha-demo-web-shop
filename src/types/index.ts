export type Category = {
  slug: string;
  name: string;
  description: string;
  emoji: string;
};

export type Spec = { label: string; value: string };

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
  stock: number;
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
 * Dòng trong giỏ hàng. Chỉ lưu `productId` + `quantity` để giỏ không thể bị sửa giá:
 * tên, đơn giá và tồn kho luôn được suy lại từ `src/data/catalog.ts` khi render.
 */
export type CartLine = {
  productId: string;
  quantity: number;
};

/** Dòng trong đơn hàng: server chốt tên/đơn giá tại thời điểm đặt. */
export type OrderItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  emoji: string;
  tone: string;
  quantity: number;
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

export type Order = {
  id: string;
  code: string;
  createdAt: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  customer: CustomerInfo;
  status: OrderStatus;
};
