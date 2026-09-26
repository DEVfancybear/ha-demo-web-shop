import { NextResponse } from "next/server";
import { getOrder } from "@/lib/orders";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = getOrder(id);

  if (!order) {
    return NextResponse.json({ message: "Không tìm thấy đơn hàng." }, { status: 404 });
  }

  return NextResponse.json(order, { headers: { "Cache-Control": "no-store" } });
}
