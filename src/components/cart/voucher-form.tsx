"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { normalizeVoucherCode } from "@/data/vouchers";
import { formatVND } from "@/lib/format";
import type { ResolvedCartLine } from "@/lib/cart";
import { useCartStore } from "@/stores/cart-store";

/**
 * Áp dụng mã giảm giá: server (`POST /api/vouchers`) kiểm tra mã trên đúng các dòng hàng
 * trong giỏ rồi trả về mức giảm; mã chỉ được lưu vào store sau khi server xác nhận.
 */
export function VoucherForm({ lines }: { lines: ResolvedCartLine[] }) {
  const voucherCode = useCartStore((state) => state.voucherCode);
  const setVoucher = useCartStore((state) => state.setVoucher);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setNotice(null);
    setError(null);
    try {
      const response = await fetch("/api/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: draft,
          items: lines.map((line) => ({
            productId: line.product.id,
            variantId: line.variant.id,
            quantity: line.quantity,
          })),
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; code?: string; label?: string; discount?: number; message?: string }
        | null;

      if (!response.ok || !payload?.ok || !payload.code) {
        setError(payload?.message ?? "Không kiểm tra được mã giảm giá.");
        return;
      }

      setVoucher(payload.code);
      setDraft(normalizeVoucherCode(payload.code));
      setNotice(`Đã áp dụng ${payload.code} · ${payload.label} · -${formatVND(payload.discount ?? 0)}`);
    } catch {
      setError("Không kết nối được tới server để kiểm tra mã.");
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <Label htmlFor="voucher-code">Mã giảm giá</Label>
      <div className="flex gap-2">
        <Input
          id="voucher-code"
          name="voucher"
          value={draft}
          onChange={(event) => setDraft(event.target.value.toUpperCase())}
          placeholder="SALE10"
          autoComplete="off"
        />
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Đang kiểm tra…" : "Áp dụng"}
        </Button>
      </div>
      {voucherCode ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Đang dùng mã <strong>{voucherCode}</strong>.{" "}
          <button
            type="button"
            className="font-medium text-blue-600 hover:underline"
            onClick={() => {
              setVoucher(null);
              setNotice(null);
              setError(null);
            }}
          >
            Bỏ mã
          </button>
        </p>
      ) : (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Thử SALE10, HA100K, FREESHIP hoặc VIP20.</p>
      )}
      {notice ? <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">{notice}</p> : null}
      {error ? (
        <p role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </form>
  );
}
