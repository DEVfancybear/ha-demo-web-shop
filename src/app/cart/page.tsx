import { CartView } from "@/components/cart/cart-view";

export const metadata = {
  title: "Giỏ hàng",
  description: "Xem lại sản phẩm đã chọn, đổi số lượng và tiến hành đặt hàng.",
};

export default function CartPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Giỏ hàng</h1>
      <CartView />
    </div>
  );
}
