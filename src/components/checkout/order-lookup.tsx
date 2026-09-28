"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/field";
import { formatDateTime, formatVND } from "@/lib/format";
import type { Order, OrderStatus } from "@/types";

const statusLabels: Record<OrderStatus, { label: string; tone: "warning" | "outline" | "success" }> = {
  pending: { label: "Chờ xác nhận", tone: "warning" },
  confirmed: { label: "Đã xác nhận", tone: "outline" },
  shipping: { label: "Đang giao", tone: "outline" },
  done: { label: "Hoàn tất", tone: "success" },
};

/**
 * Tra cứu đơn theo số điện thoại đã đặt (demo chưa có tài khoản).
 * Trước đây trang này gọi `GET /api/orders` và hiển thị tên + địa chỉ của mọi khách.
 */
export function OrderLookup() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setOrders(null);
    try {
      const params = new URLSearchParams({ phone: phone.trim() });
      if (code.trim()) params.set("code", code.trim().toUpperCase());
      const response = await fetch(`/api/orders?${params.toString()}`, { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as { orders?: Order[]; message?: string } | null;
      if (!response.ok) throw new Error(payload?.message ?? "Không tra được đơn hàng.");
      setOrders(payload?.orders ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Có lỗi không xác định.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-5">
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div>
              <Label htmlFor="lookup-phone">Số điện thoại đã đặt hàng *</Label>
              <Input
                id="lookup-phone"
                name="phone"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="0912345678"
              />
            </div>
            <div>
              <Label htmlFor="lookup-code">Mã đơn (không bắt buộc)</Label>
              <Input
                id="lookup-code"
                name="code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="HA-XXXXXX"
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Đang tra..." : "Tra cứu"}
            </Button>
          </form>
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            Shop demo chưa có tài khoản khách hàng, nên đơn được tra bằng đúng số điện thoại đã dùng khi đặt.
          </p>
        </CardContent>
      </Card>

      {message ? (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {message}
        </p>
      ) : null}

      {orders && orders.length === 0 && !message ? (
        <EmptyState
          icon="📦"
          title="Không tìm thấy đơn hàng nào"
          description="Kiểm tra lại số điện thoại (và mã đơn nếu có) rồi tra lại."
        />
      ) : null}

      {orders && orders.length > 0 ? (
        <ul className="space-y-4">
          {orders.map((order) => {
            const status = statusLabels[order.status] ?? statusLabels.pending;
            return (
              <li key={order.id}>
                <Card>
                  <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{order.code}</p>
                        <Badge tone={status.tone}>{status.label}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        {formatDateTime(order.createdAt)} · {order.items.length} sản phẩm · giao tới {order.customer.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{formatVND(order.total)}</p>
                      <Link
                        href={`/checkout/success?orderId=${order.id}&phone=${encodeURIComponent(order.customer.phone)}`}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        Xem chi tiết
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      ) : null}

      {orders === null && !message ? (
        <EmptyState
          icon="🔎"
          title="Chưa tra cứu đơn nào"
          description="Nhập số điện thoại đã dùng khi đặt hàng để xem đơn của bạn."
          action={
            <Link href="/products" className={buttonClass()}>
              Mua sắm ngay
            </Link>
          }
        />
      ) : null}
    </div>
  );
}
