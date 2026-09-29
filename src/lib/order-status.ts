import type { OrderStatus } from "@/types";

/** Nhãn + tông màu dùng chung cho trang tra cứu, trang kết quả và API đổi trạng thái. */
export const statusLabels: Record<OrderStatus, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  shipping: "Đang giao",
  done: "Hoàn tất",
};

export const statusTones: Record<OrderStatus, "warning" | "outline" | "success"> = {
  pending: "warning",
  confirmed: "outline",
  shipping: "outline",
  done: "success",
};

/** Đơn chỉ đi tiến theo đúng một bước; `done` là trạng thái cuối. */
const nextStatus: Record<OrderStatus, OrderStatus | null> = {
  pending: "confirmed",
  confirmed: "shipping",
  shipping: "done",
  done: null,
};

export function isOrderStatus(value: unknown): value is OrderStatus {
  return value === "pending" || value === "confirmed" || value === "shipping" || value === "done";
}

export function nextStatusOf(status: OrderStatus): OrderStatus | null {
  return nextStatus[status];
}
