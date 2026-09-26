import type { PaymentMethod } from "@/types";

export const paymentLabels: Record<PaymentMethod, string> = {
  cod: "khi nhận hàng (COD)",
  bank: "chuyển khoản ngân hàng",
  momo: "ví điện tử Momo",
};
