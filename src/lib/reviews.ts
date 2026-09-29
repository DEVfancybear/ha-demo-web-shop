import { randomUUID } from "node:crypto";
import { z } from "zod";
import { readDb, writeDb } from "@/lib/db";
import type { Product, Review, ReviewInput, ReviewSummary } from "@/types";

/** Luật validate dùng chung cho API đánh giá (zod, thông báo lỗi tiếng Việt). */
export const reviewInputSchema = z.object({
  author: z
    .string()
    .trim()
    .min(2, "Tên hiển thị cần ít nhất 2 ký tự.")
    .max(60, "Tên hiển thị tối đa 60 ký tự."),
  rating: z.coerce
    .number()
    .int("Số sao phải là số nguyên.")
    .min(1, "Số sao từ 1 đến 5.")
    .max(5, "Số sao từ 1 đến 5."),
  title: z.string().trim().max(80, "Tiêu đề tối đa 80 ký tự.").optional(),
  body: z
    .string()
    .trim()
    .min(10, "Nội dung đánh giá cần ít nhất 10 ký tự.")
    .max(1000, "Nội dung đánh giá tối đa 1000 ký tự."),
});

type ReviewRow = {
  id: string;
  product_id: string;
  author: string;
  rating: number;
  title: string | null;
  body: string;
  created_at: string;
};

function hydrateReview(row: ReviewRow): Review {
  return {
    id: row.id,
    productId: row.product_id,
    author: row.author,
    rating: Number(row.rating),
    title: row.title ?? undefined,
    body: row.body,
    createdAt: row.created_at,
  };
}

/** Đánh giá thật của một sản phẩm, mới nhất trước. */
export function listReviews(productId: string, limit = 50): Review[] {
  const db = readDb();
  if (!db) return [];
  const rows = db
    .prepare("SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC LIMIT ?")
    .all(productId, limit) as ReviewRow[];
  return rows.map(hydrateReview);
}

export function parseReviewInput(input: unknown): { ok: true; value: ReviewInput } | { ok: false; message: string } {
  const parsed = reviewInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Dữ liệu đánh giá không hợp lệ." };
  }
  return {
    ok: true,
    value: {
      author: parsed.data.author,
      rating: parsed.data.rating,
      title: parsed.data.title || undefined,
      body: parsed.data.body,
    },
  };
}

function hasReviewed(productId: string, author: string) {
  const db = readDb();
  if (!db) return false;
  const row = db
    .prepare("SELECT id FROM reviews WHERE product_id = ? AND lower(author) = lower(?) LIMIT 1")
    .get(productId, author.trim()) as { id: string } | undefined;
  return Boolean(row);
}

/**
 * Thêm đánh giá cho một sản phẩm. Mỗi tên hiển thị chỉ đánh giá một sản phẩm một lần
 * để demo không bị spam; đánh giá lưu trong SQLite nên còn sau khi restart.
 */
export function addReview(product: Product, input: unknown): { ok: true; review: Review } | { ok: false; status: number; message: string } {
  const parsed = parseReviewInput(input);
  if (!parsed.ok) return { ok: false, status: 422, message: parsed.message };

  if (hasReviewed(product.id, parsed.value.author)) {
    return { ok: false, status: 409, message: `Bạn đã đánh giá ${product.name} rồi.` };
  }

  const review: Review = {
    id: randomUUID().slice(0, 8).toUpperCase(),
    productId: product.id,
    author: parsed.value.author,
    rating: parsed.value.rating,
    title: parsed.value.title,
    body: parsed.value.body,
    createdAt: new Date().toISOString(),
  };

  const db = writeDb();
  db.prepare("INSERT INTO reviews (id, product_id, author, rating, body, title, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
    review.id,
    review.productId,
    review.author,
    review.rating,
    review.body,
    review.title ?? null,
    review.createdAt,
  );

  return { ok: true, review };
}

/**
 * Điểm tổng hợp = số cứng trong catalog + đánh giá thật, để điểm hiển thị vẫn đúng
 * khi có người viết đánh giá mới.
 */
export function reviewSummary(product: Product, stored: Review[] = listReviews(product.id)): ReviewSummary {
  const storedSum = stored.reduce((sum, review) => sum + review.rating, 0);
  const count = product.reviewCount + stored.length;
  const average = count === 0 ? 0 : (product.rating * product.reviewCount + storedSum) / count;
  return { count, average: Math.round(average * 10) / 10, stored: stored.length };
}
