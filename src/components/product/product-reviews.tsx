"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldError, Input, Label, Textarea } from "@/components/ui/field";
import { Rating } from "@/components/common/rating";
import { formatDateTime, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Review, ReviewSummary } from "@/types";

type ReviewsPayload = { reviews: Review[]; summary: ReviewSummary };

type FormState = { author: string; rating: number; title: string; body: string };

const emptyForm: FormState = { author: "", rating: 5, title: "", body: "" };

/**
 * Đánh giá thật của sản phẩm. Trang chi tiết được render tĩnh nên danh sách đánh giá
 * được tải bằng API (`/api/products/[slug]/reviews`) và gửi mới ngay trong trang này.
 */
export function ProductReviews({
  slug,
  fallbackRating,
  fallbackCount,
}: {
  slug: string;
  fallbackRating: number;
  fallbackCount: number;
}) {
  const [payload, setPayload] = useState<ReviewsPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetch(`/api/products/${slug}/reviews`, { signal: controller.signal, cache: "no-store" });
        if (!response.ok) throw new Error("Không tải được đánh giá.");
        setPayload((await response.json()) as ReviewsPayload);
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadError(error instanceof Error ? error.message : "Không tải được đánh giá.");
        }
      }
    };
    void load();
    return () => controller.abort();
  }, [slug]);

  const summary: ReviewSummary = payload?.summary ?? { count: fallbackCount, average: fallbackRating, stored: 0 };
  const reviews = payload?.reviews ?? [];

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found: Partial<Record<keyof FormState, string>> = {};
    if (form.author.trim().length < 2) found.author = "Vui lòng nhập tên hiển thị (tối thiểu 2 ký tự).";
    if (form.body.trim().length < 10) found.body = "Nội dung cần ít nhất 10 ký tự.";
    setErrors(found);
    setServerError(null);
    setNotice(null);
    if (Object.keys(found).length > 0) return;

    setSending(true);
    try {
      const response = await fetch(`/api/products/${slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: form.author.trim(),
          rating: form.rating,
          title: form.title.trim() || undefined,
          body: form.body.trim(),
        }),
      });
      const result = (await response.json().catch(() => null)) as
        | { review?: Review; summary?: ReviewSummary; message?: string }
        | null;

      if (!response.ok || !result?.review || !result.summary) {
        setServerError(result?.message ?? "Không gửi được đánh giá.");
        return;
      }

      setPayload((current) => ({
        reviews: [result.review as Review, ...(current?.reviews ?? [])],
        summary: result.summary as ReviewSummary,
      }));
      setForm(emptyForm);
      setNotice("Cảm ơn bạn đã đánh giá sản phẩm!");
    } catch {
      setServerError("Không kết nối được tới server để gửi đánh giá.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Đánh giá từ khách hàng</CardTitle>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Rating value={summary.average} reviewCount={summary.count} size={16} />
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {summary.stored > 0 ? `${formatNumber(summary.stored)} đánh giá mới trên trang` : "Chưa có đánh giá mới"}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadError ? (
            <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {loadError}
            </p>
          ) : null}

          {payload === null && !loadError ? (
            <div className="space-y-3" aria-busy>
              {[0, 1].map((row) => (
                <div key={row} className="h-20 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
              ))}
            </div>
          ) : null}

          {payload !== null && reviews.length === 0 ? (
            <p className="rounded-xl bg-zinc-50 p-3 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
              Chưa có đánh giá nào được gửi trên trang này. Hãy là người đầu tiên!
            </p>
          ) : null}

          <ul className="space-y-4">
            {reviews.map((review) => (
              <li key={review.id} className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Rating value={review.rating} size={13} />
                    <span className="text-sm font-semibold">{review.author}</span>
                  </div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{formatDateTime(review.createdAt)}</span>
                </div>
                {review.title ? <p className="mt-2 text-sm font-medium">{review.title}</p> : null}
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{review.body}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Viết đánh giá</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4" noValidate>
            <div>
              <Label htmlFor="review-author">Tên hiển thị *</Label>
              <Input
                id="review-author"
                name="author"
                value={form.author}
                onChange={(event) => setForm((prev) => ({ ...prev, author: event.target.value }))}
                aria-invalid={Boolean(errors.author)}
              />
              <FieldError>{errors.author}</FieldError>
            </div>

            <fieldset>
              <legend className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-200">Số sao *</legend>
              <div className="flex items-center gap-1" role="radiogroup" aria-label="Số sao">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    role="radio"
                    aria-checked={form.rating === star}
                    aria-label={`${star} sao`}
                    onClick={() => setForm((prev) => ({ ...prev, rating: star }))}
                    className="rounded-full p-1"
                  >
                    <Star
                      size={24}
                      className={cn(
                        star <= form.rating ? "fill-amber-400 text-amber-400" : "text-zinc-300 dark:text-zinc-600",
                      )}
                    />
                  </button>
                ))}
              </div>
            </fieldset>

            <div>
              <Label htmlFor="review-title">Tiêu đề</Label>
              <Input
                id="review-title"
                name="title"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="review-body">Nội dung *</Label>
              <Textarea
                id="review-body"
                name="body"
                value={form.body}
                onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))}
                aria-invalid={Boolean(errors.body)}
                placeholder="Cảm nhận của bạn sau khi dùng sản phẩm"
              />
              <FieldError>{errors.body}</FieldError>
            </div>

            {serverError ? (
              <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                {serverError}
              </p>
            ) : null}
            {notice ? (
              <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                {notice}
              </p>
            ) : null}

            <Button type="submit" className="w-full" disabled={sending}>
              {sending ? "Đang gửi…" : "Gửi đánh giá"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
