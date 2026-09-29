"use client";

import { Check, GitCompare } from "lucide-react";
import { COMPARE_MAX } from "@/lib/compare";
import { useIsMounted } from "@/lib/use-is-mounted";
import { cn } from "@/lib/utils";
import { useCompareStore } from "@/stores/compare-store";

/**
 * Nút bật/tắt so sánh. Danh sách đầy (`COMPARE_MAX`) thì nút bị khoá và nhãn nói rõ lý do,
 * để người dùng biết vì sao không thêm được sản phẩm thứ 5.
 */
export function CompareToggle({
  productId,
  name,
  withLabel = false,
  className,
}: {
  productId: string;
  name: string;
  withLabel?: boolean;
  className?: string;
}) {
  const selected = useCompareStore((state) => state.ids.includes(productId));
  const count = useCompareStore((state) => state.ids.length);
  const toggle = useCompareStore((state) => state.toggle);
  const mounted = useIsMounted();
  const active = mounted && selected;
  const full = mounted && !selected && count >= COMPARE_MAX;
  const label = active
    ? `Bỏ ${name} khỏi so sánh`
    : full
      ? `Đã đủ ${COMPARE_MAX} sản phẩm so sánh`
      : `Thêm ${name} vào so sánh`;

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      title={label}
      disabled={full}
      onClick={() => toggle(productId)}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        withLabel ? "h-12 px-5 text-base font-medium" : "h-10 w-10",
        active
          ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-white dark:text-zinc-900"
          : "border-zinc-200 bg-white/90 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:bg-zinc-800",
        className,
      )}
    >
      {active ? (
        <Check size={withLabel ? 18 : 16} aria-hidden />
      ) : (
        <GitCompare size={withLabel ? 18 : 16} aria-hidden />
      )}
      {withLabel ? (
        <span>{active ? "Đang so sánh" : full ? `Đã đủ ${COMPARE_MAX} sản phẩm` : "So sánh"}</span>
      ) : null}
    </button>
  );
}
