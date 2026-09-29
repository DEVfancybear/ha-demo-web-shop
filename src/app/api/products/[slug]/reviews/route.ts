import { NextResponse } from "next/server";
import { getProductBySlug } from "@/data/catalog";
import { addReview, listReviews, reviewSummary } from "@/lib/reviews";
import type { Product } from "@/types";

const noStore = { "Cache-Control": "no-store" };

type Params = { params: Promise<{ slug: string }> };

async function productOr404(slug: string): Promise<{ product?: Product; response?: NextResponse }> {
  const product = getProductBySlug(slug);
  if (!product) {
    return { response: NextResponse.json({ message: "Không tìm thấy sản phẩm." }, { status: 404, headers: noStore }) };
  }
  return { product };
}

/** Danh sách đánh giá thật + điểm tổng hợp (catalog + đánh giá đã lưu). */
export async function GET(_request: Request, { params }: Params) {
  const { slug } = await params;
  const { product, response } = await productOr404(slug);
  if (!product) return response;

  const reviews = listReviews(product.id);
  return NextResponse.json({ reviews, summary: reviewSummary(product, reviews) }, { headers: noStore });
}

export async function POST(request: Request, { params }: Params) {
  const { slug } = await params;
  const { product, response } = await productOr404(slug);
  if (!product) return response;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Body phải là JSON hợp lệ." }, { status: 400, headers: noStore });
  }

  const result = addReview(product, payload);
  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: result.status, headers: noStore });
  }

  const reviews = listReviews(product.id);
  return NextResponse.json({ review: result.review, summary: reviewSummary(product, reviews) }, { status: 201, headers: noStore });
}
