import { CheckoutForm } from "@/components/checkout/checkout-form";
import { Breadcrumbs } from "@/components/common/breadcrumbs";

export const metadata = {
  title: "Thanh toán",
  description: "Nhập thông tin nhận hàng và chọn phương thức thanh toán.",
};

export default function CheckoutPage() {
  return (
    <div>
      <Breadcrumbs items={[{ href: "/", label: "Trang chủ" }, { href: "/cart", label: "Giỏ hàng" }, { label: "Thanh toán" }]} />
      <h1 className="mb-6 text-2xl font-bold">Thanh toán</h1>
      <CheckoutForm />
    </div>
  );
}
