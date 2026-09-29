import { randomUUID } from "node:crypto";
import { defaultVariant, findVariant, getProductById, variantLabel, variantStockOf } from "@/data/catalog";
import { findVoucher } from "@/data/vouchers";
import { inTransaction, readDb, writeDb } from "@/lib/db";
import { isOrderStatus, nextStatusOf, statusLabels } from "@/lib/order-status";
import { totalsFor, type PricedLine } from "@/lib/pricing";
import { syncStockFromDb } from "@/lib/stock";
import { quoteVoucher } from "@/lib/vouchers";
import type { CustomerInfo, Order, OrderItem, OrderStatus, PaymentMethod } from "@/types";

export type CreateOrderInput = {
  items: { productId: string; variantId?: string; quantity: number }[];
  customer: CustomerInfo;
  voucherCode?: string;
};

export type CreateOrderResult =
  | { ok: true; order: Order }
  | { ok: false; status: number; message: string; voucherInvalid?: boolean };

export type UpdateStatusResult =
  | { ok: true; order: Order }
  | { ok: false; status: number; message: string };

type OrderRow = {
  id: string;
  code: string;
  created_at: string;
  updated_at: string;
  status: string;
  subtotal: number;
  shipping_fee: number;
  bulk_discount: number;
  voucher_code: string | null;
  voucher_discount: number;
  total: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_address: string;
  customer_note: string | null;
  payment_method: string;
};

type ItemRow = {
  order_id: string;
  product_id: string;
  variant_id: string;
  variant_label: string;
  slug: string;
  name: string;
  price: number;
  emoji: string;
  tone: string;
  quantity: number;
};

/** Dòng hàng đang chờ ghi vào DB: kèm số gốc (để seed bảng tồn kho) và số đang thấy trong cache. */
type PendingItem = OrderItem & { baseStock: number; available: number };

/** Ném ra khi transaction không trừ được tồn kho (hết hàng giữa chừng). */
class OutOfStockError extends Error {
  constructor(
    readonly variantId: string,
    readonly productName: string,
    readonly label: string,
  ) {
    super("out-of-stock");
  }
}

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

function normalizeCustomer(customer: CustomerInfo): CustomerInfo {
  // Chuẩn hoá khoảng trắng để tra cứu theo SĐT luôn khớp.
  return {
    ...customer,
    name: customer.name.trim(),
    phone: customer.phone.trim(),
    email: typeof customer.email === "string" ? customer.email.trim() : "",
    address: customer.address.trim(),
    note: customer.note?.trim() || undefined,
  };
}

function hydrateOrder(row: OrderRow, items: ItemRow[]): Order {
  return {
    id: row.id,
    code: row.code,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: items.map((item) => ({
      productId: item.product_id,
      variantId: item.variant_id,
      variantLabel: item.variant_label,
      slug: item.slug,
      name: item.name,
      price: item.price,
      emoji: item.emoji,
      tone: item.tone,
      quantity: item.quantity,
    })),
    subtotal: row.subtotal,
    shippingFee: row.shipping_fee,
    bulkDiscount: row.bulk_discount,
    voucherCode: row.voucher_code ?? undefined,
    voucherDiscount: row.voucher_discount,
    discount: row.bulk_discount + row.voucher_discount,
    total: row.total,
    customer: {
      name: row.customer_name,
      phone: row.customer_phone,
      email: row.customer_email,
      address: row.customer_address,
      note: row.customer_note ?? undefined,
      paymentMethod: row.payment_method as PaymentMethod,
    },
    status: row.status as OrderStatus,
  };
}

function loadOrders(where: string, params: string[]): Order[] {
  const db = readDb();
  if (!db) return [];
  const rows = db.prepare(`SELECT * FROM orders ${where} ORDER BY created_at DESC`).all(...params) as OrderRow[];
  if (rows.length === 0) return [];

  const placeholders = rows.map(() => "?").join(", ");
  const itemRows = db
    .prepare(`SELECT * FROM order_items WHERE order_id IN (${placeholders}) ORDER BY order_id, position`)
    .all(...rows.map((row) => row.id)) as ItemRow[];

  const itemsByOrder = new Map<string, ItemRow[]>();
  for (const item of itemRows) {
    const list = itemsByOrder.get(item.order_id);
    if (list) list.push(item);
    else itemsByOrder.set(item.order_id, [item]);
  }

  return rows.map((row) => hydrateOrder(row, itemsByOrder.get(row.id) ?? []));
}

/**
 * Tra cứu đơn theo số điện thoại của người đặt (demo chưa có tài khoản).
 * Chỉ trả về đơn khớp SĐT nên không còn lộ thông tin của khách khác.
 */
export function listOrdersByPhone(phone: string, code?: string): Order[] {
  const wantedPhone = phone.trim();
  const wantedCode = code?.trim().toUpperCase();
  const orders = loadOrders("WHERE customer_phone = ?", [wantedPhone]);
  return orders.filter((order) => !wantedCode || order.code.toUpperCase() === wantedCode);
}

/** Đọc chi tiết đơn: phải kèm đúng SĐT đã đặt, nếu không coi như không tồn tại. */
export function getOrderForPhone(id: string, phone: string): Order | undefined {
  const wanted = phone.trim();
  if (!wanted) return undefined;
  return loadOrders("WHERE id = ? AND customer_phone = ?", [id, wanted])[0];
}

/** Cập nhật trạng thái: chỉ chủ đơn (đúng SĐT) và chỉ đi tiến một bước. */
export function updateOrderStatus(id: string, phone: string, status: unknown): UpdateStatusResult {
  const order = getOrderForPhone(id, phone);
  if (!order) return { ok: false, status: 404, message: "Không tìm thấy đơn hàng." };
  if (!isOrderStatus(status)) return { ok: false, status: 422, message: "Trạng thái đơn hàng không hợp lệ." };
  if (status === order.status) return { ok: true, order };

  if (nextStatusOf(order.status) !== status) {
    return {
      ok: false,
      status: 409,
      message: `Đơn ${order.code} đang ở trạng thái "${statusLabels[order.status]}", không thể chuyển sang "${statusLabels[status]}".`,
    };
  }

  const db = writeDb();
  const now = new Date().toISOString();
  db.prepare("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?").run(status, now, id);
  return { ok: true, order: { ...order, status, updatedAt: now } };
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

  // Đọc tồn kho thật từ SQLite trước khi kiểm tra (process có thể vừa được khởi động lại).
  syncStockFromDb();

  // 1. Gộp dòng trùng biến thể, kiểm tra sản phẩm/biến thể tồn tại và số lượng là số nguyên dương.
  const wanted = new Map<string, PendingItem>();
  for (const raw of payload.items) {
    const product = getProductById(String((raw as { productId?: unknown })?.productId ?? ""));
    if (!product) {
      return { ok: false, status: 422, message: "Có sản phẩm không tồn tại trong đơn hàng." };
    }

    const rawVariantId = (raw as { variantId?: unknown })?.variantId;
    const variant =
      typeof rawVariantId === "string" && rawVariantId ? findVariant(product, rawVariantId) : defaultVariant(product);
    if (!variant) {
      return { ok: false, status: 422, message: `Sản phẩm ${product.name} chưa có biến thể để đặt.` };
    }

    const quantity = Number((raw as { quantity?: unknown })?.quantity ?? 0);
    if (!Number.isInteger(quantity) || quantity < 1) {
      return { ok: false, status: 422, message: `Số lượng của ${product.name} không hợp lệ.` };
    }

    const existing = wanted.get(variant.id);
    if (existing) {
      existing.quantity += quantity;
      continue;
    }

    // 2. Giá, tên và nhãn biến thể do server chốt theo catalog, không tin dữ liệu client gửi lên.
    wanted.set(variant.id, {
      productId: product.id,
      variantId: variant.id,
      variantLabel: variantLabel(variant),
      slug: product.slug,
      name: product.name,
      price: product.salePrice ?? product.price,
      emoji: product.emoji,
      tone: product.tone,
      quantity,
      baseStock: variant.stock,
      available: variantStockOf(variant),
    });
  }

  const pending = Array.from(wanted.values());
  const items: OrderItem[] = pending.map((item) => ({
    productId: item.productId,
    variantId: item.variantId,
    variantLabel: item.variantLabel,
    slug: item.slug,
    name: item.name,
    price: item.price,
    emoji: item.emoji,
    tone: item.tone,
    quantity: item.quantity,
  }));
  const lines: PricedLine[] = items.map((item) => ({ price: item.price, quantity: item.quantity }));

  // 3. Kiểm tra mã giảm giá (nếu có) rồi mới tính tiền.
  let voucherCode: string | undefined;
  if (payload.voucherCode) {
    const quote = quoteVoucher(String(payload.voucherCode), lines);
    if (!quote.ok) return { ok: false, status: 422, message: quote.message, voucherInvalid: true };
    voucherCode = quote.code;
  }
  const totals = totalsFor(lines, voucherCode ? findVoucher(voucherCode) : undefined);

  // 4. Kiểm tra nhanh để báo lỗi sớm; bước trừ kho trong transaction vẫn là chốt cuối.
  for (const item of pending) {
    if (item.quantity > item.available) {
      return {
        ok: false,
        status: 409,
        message: `${item.name} (${item.variantLabel}) chỉ còn ${item.available} sản phẩm.`,
      };
    }
  }

  const db = writeDb();
  const id = randomUUID().slice(0, 8).toUpperCase();
  const now = new Date().toISOString();
  const customer = normalizeCustomer(payload.customer);
  const order: Order = {
    id,
    code: `HA-${id.slice(0, 6)}`,
    createdAt: now,
    updatedAt: now,
    items,
    subtotal: totals.subtotal,
    shippingFee: totals.shippingFee,
    bulkDiscount: totals.bulkDiscount,
    voucherCode,
    voucherDiscount: totals.voucherDiscount,
    discount: totals.discount,
    total: totals.total,
    customer,
    status: "pending",
  };

  try {
    inTransaction(db, () => {
      // 5. Giữ chỗ tồn kho theo biến thể: `UPDATE ... WHERE stock >= ?` là bước chốt, chạy trong
      // cùng transaction với việc ghi đơn nên hai đơn liên tiếp không thể bán vượt số hàng còn lại.
      for (const item of pending) {
        db.prepare("INSERT OR IGNORE INTO variant_stock (variant_id, stock) VALUES (?, ?)").run(
          item.variantId,
          item.baseStock,
        );
        const updated = db
          .prepare("UPDATE variant_stock SET stock = stock - ? WHERE variant_id = ? AND stock >= ?")
          .run(item.quantity, item.variantId, item.quantity);
        if (Number(updated.changes) !== 1) {
          throw new OutOfStockError(item.variantId, item.name, item.variantLabel);
        }
      }

      db.prepare(
        `INSERT INTO orders (
          id, code, created_at, updated_at, status, subtotal, shipping_fee, bulk_discount,
          voucher_code, voucher_discount, total, customer_name, customer_phone, customer_email,
          customer_address, customer_note, payment_method
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        order.id,
        order.code,
        order.createdAt,
        order.updatedAt,
        order.status,
        order.subtotal,
        order.shippingFee,
        order.bulkDiscount,
        order.voucherCode ?? null,
        order.voucherDiscount,
        order.total,
        customer.name,
        customer.phone,
        customer.email,
        customer.address,
        customer.note ?? null,
        customer.paymentMethod,
      );

      const insertItem = db.prepare(
        `INSERT INTO order_items (
          order_id, position, product_id, variant_id, variant_label, slug, name, price, emoji, tone, quantity
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      );
      items.forEach((item, position) => {
        insertItem.run(
          order.id,
          position,
          item.productId,
          item.variantId,
          item.variantLabel,
          item.slug,
          item.name,
          item.price,
          item.emoji,
          item.tone,
          item.quantity,
        );
      });
    });
  } catch (error) {
    if (error instanceof OutOfStockError) {
      const row = db.prepare("SELECT stock FROM variant_stock WHERE variant_id = ?").get(error.variantId) as
        | { stock: number }
        | undefined;
      syncStockFromDb();
      return {
        ok: false,
        status: 409,
        message: `${error.productName} (${error.label}) chỉ còn ${row ? Number(row.stock) : 0} sản phẩm.`,
      };
    }
    throw error;
  }

  // 6. Nạp lại cache tồn kho để trang/API trong cùng process thấy số vừa trừ.
  syncStockFromDb();
  return { ok: true, order };
}
