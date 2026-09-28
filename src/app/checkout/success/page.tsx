import { OrderResult } from "@/components/checkout/order-result";
import { getOrderForPhone } from "@/lib/orders";

export const metadata = {
  title: "Đặt hàng thành công",
  description: "Thông tin đơn hàng vừa tạo.",
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ orderId?: string | string[]; phone?: string | string[] }>;

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const read = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const orderId = read(params.orderId);
  const phone = read(params.phone);
  // Chỉ hiện đơn khi đường dẫn kèm đúng SĐT đã đặt, tránh đoán mã đơn để đọc thông tin người khác.
  const order = orderId && phone ? getOrderForPhone(orderId, phone) : undefined;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Kết quả đặt hàng</h1>
      <OrderResult order={order} orderId={orderId} />
    </div>
  );
}
