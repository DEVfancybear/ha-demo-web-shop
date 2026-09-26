import { NextResponse } from "next/server";
import { createOrder, listOrders } from "@/lib/orders";

export function GET() {
  return NextResponse.json({ orders: listOrders() }, { headers: { "Cache-Control": "no-store" } });
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
    return NextResponse.json({ message: result.message }, { status: result.status });
  }

  return NextResponse.json(result.order, { status: 201 });
}
