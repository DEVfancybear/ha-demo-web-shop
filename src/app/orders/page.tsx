import { OrderLookup } from "@/components/checkout/order-lookup";
import { Breadcrumbs } from "@/components/common/breadcrumbs";

export const metadata = {
  title: "Tra cứu đơn hàng",
  description: "Nhập số điện thoại đã đặt hàng để xem lại đơn của bạn.",
};

export default function OrdersPage() {
  return (
    <div>
      <Breadcrumbs items={[{ href: "/", label: "Trang chủ" }, { label: "Đơn hàng" }]} />
      <h1 className="mb-2 text-2xl font-bold">Tra cứu đơn hàng</h1>
      <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
        Đơn hàng được lưu trong SQLite trên server nên vẫn còn sau khi khởi động lại. Để xem đơn, nhập đúng số điện
        thoại đã dùng khi đặt — thông tin của khách khác không hiển thị ở đây.
      </p>
      <OrderLookup />
    </div>
  );
}
