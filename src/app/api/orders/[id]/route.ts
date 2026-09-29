import { NextResponse } from "next/server";
import { getOrderForPhone, updateOrderStatus } from "@/lib/orders";

const noStore = { "Cache-Control": "no-store" };

/** Chi tiết đơn chỉ trả khi kèm đúng số điện thoại đã đặt; sai thì coi như không tồn tại. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const phone = (searchParams.get("phone") ?? "").trim();
  const order = getOrderForPhone(id, phone);

  if (!order) {
    return NextResponse.json({ message: "Không tìm thấy đơn hàng." }, { status: 404 });
  }

  return NextResponse.json(order, { headers: noStore });
}

/**
 * Đổi trạng thái đơn (chờ xác nhận -> đã xác nhận -> đang giao -> hoàn tất).
 * Phải kèm đúng số điện thoại đã đặt; đơn chỉ đi tiến một bước mỗi lần.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Body phải là JSON hợp lệ." }, { status: 400, headers: noStore });
  }

  const body = (payload ?? {}) as { phone?: unknown; status?: unknown };
  const phone = typeof body.phone === "string" ? body.phone : "";
  const result = updateOrderStatus(id, phone, body.status);

  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: result.status, headers: noStore });
  }
  return NextResponse.json(result.order, { headers: noStore });
}
