import { NextResponse } from "next/server";
import { suggestSearch } from "@/lib/search";

/**
 * Gợi ý tìm kiếm cho ô tìm kiếm ở header.
 * `?q=dien thoai&limit=6` — không có `q` (hoặc ngắn hơn 2 ký tự) thì trả danh sách rỗng.
 * Không đụng tới SQLite: gợi ý chỉ gồm tên/giá trong catalog, không hiện tồn kho hay điểm đánh giá.
 */
export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitParam = Number(searchParams.get("limit") ?? "6");
  const result = suggestSearch(searchParams.get("q"), Number.isFinite(limitParam) ? limitParam : undefined);

  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
