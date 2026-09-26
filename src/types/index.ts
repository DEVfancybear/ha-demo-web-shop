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

export type CartItem = {
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
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  customer: CustomerInfo;
  status: OrderStatus;
};
