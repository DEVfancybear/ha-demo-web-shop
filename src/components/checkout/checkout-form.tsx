"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonClass } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/field";
import { EmptyState } from "@/components/common/empty-state";
import { CartTotals } from "@/components/cart/cart-totals";
import { useCartStore } from "@/stores/cart-store";
import { resolveCartLines } from "@/lib/cart";
import { useIsMounted } from "@/lib/use-is-mounted";
import type { CustomerInfo, PaymentMethod } from "@/types";

type FormState = {
  name: string;
  phone: string;
  email: string;
  address: string;
  note: string;
  paymentMethod: PaymentMethod;
};

const paymentMethods: { value: PaymentMethod; label: string; hint: string }[] = [
  { value: "cod", label: "Thanh toán khi nhận hàng (COD)", hint: "Trả tiền mặt cho shipper" },
  { value: "bank", label: "Chuyển khoản ngân hàng", hint: "Nhận thông tin tài khoản sau khi đặt" },
  { value: "momo", label: "Ví điện tử Momo", hint: "Thanh toán qua ví điện tử" },
];

function validate(form: FormState) {
  const errors: Partial<Record<keyof FormState, string>> = {};
  if (form.name.trim().length < 2) errors.name = "Vui lòng nhập họ tên (tối thiểu 2 ký tự).";
  if (!/^0\d{9,10}$/.test(form.phone.trim())) errors.phone = "Số điện thoại phải bắt đầu bằng 0 và có 10-11 số.";
  if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = "Email không hợp lệ.";
  if (form.address.trim().length < 10) errors.address = "Địa chỉ cần chi tiết hơn (tối thiểu 10 ký tự).";
  return errors;
}

export function CheckoutForm() {
  const items = useCartStore((state) => state.items);
  const clear = useCartStore((state) => state.clear);
  const router = useRouter();
  const mounted = useIsMounted();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  // Chỉ gửi productId + số lượng; giá và tồn kho do server chốt lại từ catalog.
  const lines = resolveCartLines(items);
  const [form, setForm] = useState<FormState>({
    name: "",
    phone: "",
    email: "",
    address: "",
    note: "",
    paymentMethod: "cod",
  });

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  if (mounted && lines.length === 0) {
    return (
      <EmptyState
        icon="🧾"
        title="Chưa có sản phẩm để đặt"
        description="Giỏ hàng trống nên chưa thể tạo đơn hàng."
        action={
          <Link href="/products" className={buttonClass()}>
            Chọn sản phẩm
          </Link>
        }
      />
    );
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validate(form);
    setErrors(found);
    setServerError(null);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      const customer: CustomerInfo = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        note: form.note.trim() || undefined,
        paymentMethod: form.paymentMethod,
      };
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
          customer,
        }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? "Không tạo được đơn hàng.");
      }
      const order = (await response.json()) as { id: string };
      clear();
      // Kèm SĐT để trang kết quả chỉ hiện đơn cho đúng người đặt.
      router.push(`/checkout/success?orderId=${order.id}&phone=${encodeURIComponent(customer.phone)}`);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Có lỗi không xác định.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin nhận hàng</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Họ và tên *</Label>
              <Input
                id="name"
                name="name"
                autoComplete="name"
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                aria-invalid={Boolean(errors.name)}
              />
              <FieldError>{errors.name}</FieldError>
            </div>
            <div>
              <Label htmlFor="phone">Số điện thoại *</Label>
              <Input
                id="phone"
                name="phone"
                inputMode="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(event) => update("phone", event.target.value)}
                aria-invalid={Boolean(errors.phone)}
              />
              <FieldError>{errors.phone}</FieldError>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
                aria-invalid={Boolean(errors.email)}
              />
              <FieldError>{errors.email}</FieldError>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="address">Địa chỉ giao hàng *</Label>
              <Input
                id="address"
                name="address"
                autoComplete="street-address"
                value={form.address}
                onChange={(event) => update("address", event.target.value)}
                aria-invalid={Boolean(errors.address)}
              />
              <FieldError>{errors.address}</FieldError>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="note">Ghi chú</Label>
              <Textarea
                id="note"
                name="note"
                value={form.note}
                onChange={(event) => update("note", event.target.value)}
                placeholder="Ví dụ: giao ngoài giờ hành chính"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Phương thức thanh toán</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {paymentMethods.map((method) => (
              <label
                key={method.value}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 p-3 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60"
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  className="mt-1 h-4 w-4"
                  checked={form.paymentMethod === method.value}
                  onChange={() => update("paymentMethod", method.value)}
                />
                <span>
                  <span className="block text-sm font-medium">{method.label}</span>
                  <span className="block text-xs text-zinc-500 dark:text-zinc-400">{method.hint}</span>
                </span>
              </label>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit lg:sticky lg:top-32">
        <CardHeader>
          <CardTitle>Đơn hàng của bạn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mounted ? <CartTotals lines={lines} showFreeShippingHint={false} /> : null}
          {serverError ? (
            <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {serverError}
            </p>
          ) : null}
          <Button type="submit" size="lg" className="w-full" disabled={submitting || !mounted}>
            {submitting ? "Đang đặt hàng..." : "Đặt hàng"}
          </Button>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Đây là cửa hàng demo: đơn hàng chỉ được lưu trong bộ nhớ của server, không phát sinh giao dịch thật.
          </p>
        </CardContent>
      </Card>
    </form>
  );
}
