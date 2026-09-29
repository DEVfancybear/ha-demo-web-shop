import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { ProductThumb } from "@/components/common/product-thumb";
import { formatDateTime, formatVND } from "@/lib/format";
import { paymentLabels } from "@/components/checkout/payment-labels";
import { bulkDiscountLabel } from "@/lib/pricing";
import { statusLabels, statusTones } from "@/lib/order-status";
import type { Order } from "@/types";

export function OrderResult({ order, orderId }: { order?: Order; orderId?: string }) {
  if (!order) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chưa tra được đơn hàng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-zinc-600 dark:text-zinc-300">
          <p>
            {orderId
              ? "Không tìm thấy đơn hàng này."
              : "Thiếu mã đơn hàng trong đường dẫn."}
          </p>
          <p>
            Đơn hàng được lưu trong SQLite trên server nên vẫn còn sau khi khởi động lại. Trang này cần đúng mã
            đơn và số điện thoại đã dùng khi đặt hàng.
          </p>
          <div className="flex gap-3">
            <Link href="/products" className={buttonClass()}>
              Tiếp tục mua sắm
            </Link>
            <Link href="/orders" className={buttonClass({ variant: "outline" })}>
              Danh sách đơn
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40">
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            <span aria-hidden>✅</span> Đặt hàng thành công
            <Badge tone={statusTones[order.status]}>{statusLabels[order.status]}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-emerald-900 dark:text-emerald-100">
          Mã đơn <strong>{order.code}</strong> · {formatDateTime(order.createdAt)} · Thanh toán{" "}
          {paymentLabels[order.customer.paymentMethod]}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Sản phẩm trong đơn</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {order.items.map((item) => (
                <li key={`${item.productId}-${item.variantId}`} className="flex items-center gap-3 py-3">
                  <ProductThumb emoji={item.emoji} tone={item.tone} className="h-14 w-14 rounded-xl text-2xl" />
                  <div className="flex-1">
                    <Link href={`/products/${item.slug}`} className="text-sm font-medium hover:underline">
                      {item.name}
                    </Link>
                    {item.variantLabel ? (
                      <p className="text-xs text-zinc-500">Phân loại: {item.variantLabel}</p>
                    ) : null}
                    <p className="text-xs text-zinc-500">
                      {item.quantity} × {formatVND(item.price)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold">{formatVND(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Tổng kết</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-600 dark:text-zinc-300">Tạm tính</dt>
                <dd className="font-medium">{formatVND(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-600 dark:text-zinc-300">Phí vận chuyển</dt>
                <dd className="font-medium">
                  {order.shippingFee === 0 ? "Miễn phí" : formatVND(order.shippingFee)}
                </dd>
              </div>
              {order.bulkDiscount > 0 ? (
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                  <dt>{bulkDiscountLabel}</dt>
                  <dd className="font-medium">-{formatVND(order.bulkDiscount)}</dd>
                </div>
              ) : null}
              {order.voucherDiscount > 0 ? (
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                  <dt>Mã giảm giá {order.voucherCode}</dt>
                  <dd className="font-medium">-{formatVND(order.voucherDiscount)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-zinc-200 pt-3 text-base dark:border-zinc-800">
                <dt className="font-semibold">Tổng cộng</dt>
                <dd className="font-bold">{formatVND(order.total)}</dd>
              </div>
            </dl>

            <div className="rounded-xl bg-zinc-50 p-3 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">Giao tới</p>
              <p className="mt-1">{order.customer.name}</p>
              <p>{order.customer.phone}</p>
              <p>{order.customer.address}</p>
              {order.customer.note ? <p className="mt-1 italic">Ghi chú: {order.customer.note}</p> : null}
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Cập nhật lần cuối: {formatDateTime(order.updatedAt)}
            </p>

            <Link href="/orders" className={buttonClass({ variant: "outline", className: "w-full" })}>
              Theo dõi trạng thái
            </Link>
            <Link href="/products" className={buttonClass({ className: "w-full" })}>
              Tiếp tục mua sắm
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
