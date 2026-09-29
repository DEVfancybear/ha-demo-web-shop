import { primeVariantStock } from "@/data/catalog";
import { readDb } from "@/lib/db";

/**
 * Đọc tồn kho biến thể từ SQLite và nạp vào cache đọc đồng bộ của catalog.
 * Gọi ở đầu mỗi route handler để process nào cũng thấy số mới nhất sau khi restart.
 */
export function syncStockFromDb(): void {
  const db = readDb();
  if (!db) return;
  const rows = db.prepare("SELECT variant_id, stock FROM variant_stock").all() as {
    variant_id: string;
    stock: number;
  }[];
  primeVariantStock(rows.map((row) => [row.variant_id, Number(row.stock)] as const));
}
