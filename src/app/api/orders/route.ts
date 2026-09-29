import { NextResponse } from "next/server";
import { createOrder, listOrdersByPhone } from "@/lib/orders";

const noStore = { "Cache-Control": "no-store" };

/**
 * Tra cứu đơn hàng: bắt buộc có số điện thoại đã dùng khi đặt (tuỳ chọn thêm mã đơn).
 * Không còn trả về danh sách đơn kèm thông tin cá nhân của mọi khách.
 */
export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = (searchParams.get("phone") ?? "").trim();

  if (!/^0\d{9,10}$/.test(phone)) {
    return NextResponse.json(
      { message: "Cần số điện thoại hợp lệ để tra cứu đơn hàng.", orders: [] },
      { status: 400, headers: noStore },
    );
  }

  const code = searchParams.get("code") ?? undefined;
  return NextResponse.json({ orders: listOrdersByPhone(phone, code) }, { headers: noStore });
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Body phải là JSON hợp lệ." }, { status: 400 });
  }

  const result = createOrder(payload);
  if (!result.ok) {
    return NextResponse.json(
      { message: result.message, ...(result.voucherInvalid ? { voucherInvalid: true } : {}) },
      { status: result.status },
    );
  }

  return NextResponse.json(result.order, { status: 201 });
}
