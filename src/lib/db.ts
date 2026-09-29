import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

/**
 * SQLite là nơi lưu bền vững đơn hàng, tồn kho biến thể và đánh giá.
 * Dùng `node:sqlite` (có sẵn trong Node 22+) nên không cần native dependency.
 * Đường dẫn đổi được bằng `SHOP_DB_PATH` — test E2E trỏ vào file tạm để không lẫn dữ liệu.
 */
const SCHEMA = `
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  status TEXT NOT NULL,
  subtotal INTEGER NOT NULL,
  shipping_fee INTEGER NOT NULL,
  bulk_discount INTEGER NOT NULL DEFAULT 0,
  voucher_code TEXT,
  voucher_discount INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  customer_note TEXT,
  payment_method TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders (customer_phone);

CREATE TABLE IF NOT EXISTS order_items (
  order_id TEXT NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  product_id TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  variant_label TEXT NOT NULL,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  emoji TEXT NOT NULL,
  tone TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  PRIMARY KEY (order_id, position)
);

CREATE TABLE IF NOT EXISTS variant_stock (
  variant_id TEXT PRIMARY KEY,
  stock INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  author TEXT NOT NULL,
  rating INTEGER NOT NULL,
  body TEXT NOT NULL,
  title TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews (product_id, created_at DESC);
`;

export function databasePath() {
  return process.env.SHOP_DB_PATH ?? path.join(process.cwd(), ".data", "shop.db");
}

type DbHandle = { db: DatabaseSync; readOnly: boolean };
const globalDb = globalThis as typeof globalThis & { __shopHaDb?: DbHandle };

function open(file: string, readOnly: boolean): DatabaseSync {
  const db = new DatabaseSync(file, { readOnly });
  db.exec("PRAGMA busy_timeout = 5000");
  if (!readOnly) db.exec(SCHEMA);
  return db;
}

/**
 * Mở DB để đọc. Trả `null` khi file chưa tồn tại (mở read-only sẽ lỗi) để lúc build/render
 * không tạo ra file rác — khi đó catalog vẫn là nguồn số gốc.
 */
export function readDb(): DatabaseSync | null {
  const cached = globalDb.__shopHaDb;
  if (cached) return cached.db;

  const file = databasePath();
  // File chưa có hoặc rỗng: coi như chưa có DB. Mở một file 0 byte sẽ "thành công" nhưng mọi truy vấn
  // sau đó lỗi "no such table" và biến toàn bộ API thành 500 — thà trả `null` để catalog là nguồn số gốc.
  let size: number;
  try {
    size = fs.statSync(file).size;
  } catch {
    return null;
  }
  if (size === 0) return null;

  const db = openReadable(file);
  if (!db) return null;
  globalDb.__shopHaDb = { db, readOnly: true };
  return db;
}

/**
 * Mở DB chỉ để đọc và kiểm tra có schema. File không phải SQLite, hoặc thiếu bảng `orders` (file rác,
 * file của chương trình khác) thì trả `null`; handle được đóng trước khi trả vì trên Windows còn handle
 * là file còn bị khoá.
 */
function openReadable(file: string): DatabaseSync | null {
  let db: DatabaseSync | null = null;
  try {
    db = open(file, true);
    const hasSchema = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'orders'").get();
    if (!hasSchema) throw new Error("missing schema");
    return db;
  } catch {
    try {
      db?.close();
    } catch {
      // handle đã hỏng thì không đóng được nữa; bỏ qua.
    }
    return null;
  }
}

/** Mở DB để ghi (tạo file + schema nếu cần). Handle chỉ đọc cũ được đóng lại để nhường chỗ. */
export function writeDb(): DatabaseSync {
  const cached = globalDb.__shopHaDb;
  if (cached && !cached.readOnly) return cached.db;
  const file = databasePath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = open(file, false);
  if (cached) cached.db.close();
  globalDb.__shopHaDb = { db, readOnly: false };
  return db;
}

/** Chạy `run` trong một transaction ghi, rollback nếu có lỗi. */
export function inTransaction<T>(db: DatabaseSync, run: () => T): T {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = run();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
