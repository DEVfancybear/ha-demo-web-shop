import { OrderResult } from "@/components/checkout/order-result";
import { getOrder } from "@/lib/orders";

export const metadata = {
  title: "Đặt hàng thành công",
  description: "Thông tin đơn hàng vừa tạo.",
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ orderId?: string | string[] }>;

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const raw = params.orderId;
  const orderId = Array.isArray(raw) ? raw[0] : raw;
  const order = orderId ? getOrder(orderId) : undefined;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Kết quả đặt hàng</h1>
      <OrderResult order={order} orderId={orderId} />
    </div>
  );
}
