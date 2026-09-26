import { OrderList } from "@/components/checkout/order-list";
import { Breadcrumbs } from "@/components/common/breadcrumbs";

export const metadata = {
  title: "Đơn hàng demo",
  description: "Danh sách đơn hàng đã tạo trong phiên chạy hiện tại.",
};

export default function OrdersPage() {
  return (
    <div>
      <Breadcrumbs items={[{ href: "/", label: "Trang chủ" }, { label: "Đơn hàng" }]} />
      <h1 className="mb-2 text-2xl font-bold">Đơn hàng demo</h1>
      <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
        Đơn hàng được lưu trong bộ nhớ của server nên sẽ mất khi khởi động lại.
      </p>
      <OrderList />
    </div>
  );
}
