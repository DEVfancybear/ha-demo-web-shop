import { NextResponse } from "next/server";
import { getOrderForPhone } from "@/lib/orders";

/** Chi tiết đơn chỉ trả khi kèm đúng số điện thoại đã đặt; sai thì coi như không tồn tại. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const phone = (searchParams.get("phone") ?? "").trim();
  const order = getOrderForPhone(id, phone);

  if (!order) {
    return NextResponse.json({ message: "Không tìm thấy đơn hàng." }, { status: 404 });
  }

  return NextResponse.json(order, { headers: { "Cache-Control": "no-store" } });
}
