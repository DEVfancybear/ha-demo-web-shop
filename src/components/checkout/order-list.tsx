"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatVND } from "@/lib/format";
import type { Order } from "@/types";

export function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/orders", { cache: "no-store" });
        if (!response.ok) throw new Error("Không tải được danh sách đơn hàng.");
        const data = (await response.json()) as { orders: Order[] };
        if (!cancelled) {
          setOrders(data.orders);
          setStatus("ready");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") {
    return (
      <div aria-busy className="space-y-3">
        {[0, 1].map((row) => (
          <div key={row} className="h-28 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
        ))}
      </div>
    );
  }

  if (status === "error") {
    return (
      <EmptyState
        icon="⚠️"
        title="Không tải được đơn hàng"
        description="Server demo có thể đã khởi động lại. Hãy thử tải lại trang."
      />
    );
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        icon="📦"
        title="Chưa có đơn hàng nào"
        description="Đặt thử một đơn để xem luồng mua sắm hoạt động."
        action={
          <Link href="/products" className={buttonClass()}>
            Mua sắm ngay
          </Link>
        }
      />
    );
  }

  return (
    <ul className="space-y-4">
      {orders.map((order) => (
        <li key={order.id}>
          <Card>
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{order.code}</p>
                  <Badge tone="warning">Chờ xác nhận</Badge>
                </div>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {formatDateTime(order.createdAt)} · {order.items.length} sản phẩm · giao tới {order.customer.name}
                </p>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{order.customer.address}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{formatVND(order.total)}</p>
                <Link
                  href={`/checkout/success?orderId=${order.id}`}
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  Xem chi tiết
                </Link>
              </div>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
