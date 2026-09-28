import { randomUUID } from "node:crypto";
import { getProductById, releaseStock, reserveStock, stockOf } from "@/data/catalog";
import { totalsFor } from "@/lib/pricing";
import type { CustomerInfo, Order, OrderItem } from "@/types";

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

  // 1. Gộp dòng trùng sản phẩm, kiểm tra sản phẩm tồn tại và số lượng là số nguyên dương.
  const wanted = new Map<string, number>();
  for (const raw of payload.items) {
    const product = getProductById(String((raw as { productId?: unknown })?.productId ?? ""));
    if (!product) {
      return { ok: false, status: 422, message: "Có sản phẩm không tồn tại trong đơn hàng." };
    }
    const quantity = Number((raw as { quantity?: unknown })?.quantity ?? 0);
    if (!Number.isInteger(quantity) || quantity < 1) {
      return { ok: false, status: 422, message: `Số lượng của ${product.name} không hợp lệ.` };
    }
    wanted.set(product.id, (wanted.get(product.id) ?? 0) + quantity);
  }

  // 2. Giá và tên do server chốt theo catalog, không tin dữ liệu client gửi lên.
  const items: OrderItem[] = [];
  for (const [productId, quantity] of wanted) {
    const product = getProductById(productId) as NonNullable<ReturnType<typeof getProductById>>;
    const available = stockOf(product);
    if (quantity > available) {
      return { ok: false, status: 409, message: `${product.name} chỉ còn ${available} sản phẩm.` };
    }
    items.push({
      productId,
      slug: product.slug,
      name: product.name,
      price: product.salePrice ?? product.price,
      emoji: product.emoji,
      tone: product.tone,
      quantity,
    });
  }

  // 3. Giữ chỗ tồn kho để hai đơn liên tiếp không bán vượt số hàng còn lại.
  const reserved: { productId: string; quantity: number }[] = [];
  for (const item of items) {
    if (!reserveStock(item.productId, item.quantity)) {
      for (const done of reserved) releaseStock(done.productId, done.quantity);
      const product = getProductById(item.productId);
      return {
        ok: false,
        status: 409,
        message: `${item.name} chỉ còn ${product ? stockOf(product) : 0} sản phẩm.`,
      };
    }
    reserved.push({ productId: item.productId, quantity: item.quantity });
  }

  const totals = totalsFor(items);
  const id = randomUUID().slice(0, 8).toUpperCase();
  const order: Order = {
    id,
    code: `HA-${id.slice(0, 6)}`,
    createdAt: new Date().toISOString(),
    items,
    subtotal: totals.subtotal,
    shippingFee: totals.shippingFee,
    discount: totals.discount,
    total: totals.total,
    // Chuẩn hoá khoảng trắng để tra cứu theo SĐT luôn khớp.
    customer: {
      ...payload.customer,
      name: payload.customer.name.trim(),
      phone: payload.customer.phone.trim(),
      address: payload.customer.address.trim(),
    },
    status: "pending",
  };

  orders.set(id, order);
  return { ok: true, order };
}

/**
 * Tra cứu đơn theo số điện thoại của người đặt (demo chưa có tài khoản).
 * Chỉ trả về đơn khớp SĐT nên không còn lộ thông tin của khách khác.
 */
export function listOrdersByPhone(phone: string, code?: string): Order[] {
  const wantedPhone = phone.trim();
  const wantedCode = code?.trim().toUpperCase();
  return Array.from(orders.values())
    .filter((order) => order.customer.phone === wantedPhone)
    .filter((order) => !wantedCode || order.code.toUpperCase() === wantedCode)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/** Đọc chi tiết đơn: phải kèm đúng SĐT đã đặt, nếu không coi như không tồn tại. */
export function getOrderForPhone(id: string, phone: string): Order | undefined {
  const order = orders.get(id);
  if (!order) return undefined;
  return order.customer.phone === phone.trim() ? order : undefined;
}
