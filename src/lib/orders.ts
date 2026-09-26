import { randomUUID } from "node:crypto";
import { siteConfig } from "@/lib/config";
import { getProductBySlug, products } from "@/data/catalog";
import type { CartItem, CustomerInfo, Order } from "@/types";

/**
 * Lưu đơn hàng trong bộ nhớ server — đủ cho demo, mất khi restart.
 * Gắn vào globalThis để page và route handler dùng chung một Map
 * (mỗi module graph của Next có thể tạo instance riêng).
 */
const globalStore = globalThis as typeof globalThis & { __shopHaOrders?: Map<string, Order> };
const orders = (globalStore.__shopHaOrders ??= new Map<string, Order>());

export type CreateOrderInput = {
  items: { productId: string; quantity: number }[];
  customer: CustomerInfo;
};

export type CreateOrderResult =
  | { ok: true; order: Order }
  | { ok: false; status: number; message: string };

const productById = new Map(products.map((product) => [product.id, product]));

function isCustomer(value: unknown): value is CustomerInfo {
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.name === "string" &&
    c.name.trim().length >= 2 &&
    typeof c.phone === "string" &&
    /^0\d{9,10}$/.test(c.phone.trim()) &&
    typeof c.address === "string" &&
    c.address.trim().length >= 10 &&
    (c.paymentMethod === "cod" || c.paymentMethod === "bank" || c.paymentMethod === "momo")
  );
}

export function createOrder(input: unknown): CreateOrderResult {
  if (!input || typeof input !== "object") {
    return { ok: false, status: 400, message: "Dữ liệu đơn hàng không hợp lệ." };
  }

  const payload = input as Partial<CreateOrderInput>;
  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    return { ok: false, status: 400, message: "Đơn hàng phải có ít nhất một sản phẩm." };
  }
  if (!isCustomer(payload.customer)) {
    return { ok: false, status: 422, message: "Thông tin người nhận chưa hợp lệ." };
  }

  const items: CartItem[] = [];
  for (const raw of payload.items) {
    const product = productById.get(String((raw as { productId?: unknown })?.productId ?? ""));
    if (!product) {
      return { ok: false, status: 422, message: "Có sản phẩm không tồn tại trong đơn hàng." };
    }
    const quantity = Number((raw as { quantity?: unknown })?.quantity ?? 0);
    if (!Number.isInteger(quantity) || quantity < 1) {
      return { ok: false, status: 422, message: `Số lượng của ${product.name} không hợp lệ.` };
    }
    if (quantity > product.stock) {
      return {
        ok: false,
        status: 409,
        message: `${product.name} chỉ còn ${product.stock} sản phẩm.`,
      };
    }
    items.push({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.salePrice ?? product.price,
      emoji: product.emoji,
      tone: product.tone,
      quantity,
    });
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = subtotal >= siteConfig.freeShippingFrom ? 0 : siteConfig.shippingFee;
  const discount =
    subtotal >= siteConfig.bulkDiscountFrom ? Math.round(subtotal * siteConfig.bulkDiscountRate) : 0;

  const id = randomUUID().slice(0, 8).toUpperCase();
  const order: Order = {
    id,
    code: `HA-${id.slice(0, 6)}`,
    createdAt: new Date().toISOString(),
    items,
    subtotal,
    shippingFee,
    discount,
    total: subtotal + shippingFee - discount,
    customer: payload.customer,
    status: "pending",
  };

  orders.set(id, order);
  return { ok: true, order };
}

export function listOrders(): Order[] {
  return Array.from(orders.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getOrder(id: string): Order | undefined {
  return orders.get(id);
}

export function catalogSnapshot(slug: string) {
  return getProductBySlug(slug);
}
