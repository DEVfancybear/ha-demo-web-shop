"use client";

import { cn } from "@/lib/utils";
import type { Variant } from "@/types";

function distinct(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

/**
 * Chọn biến thể theo màu/kích cỡ. Chỉ hiện nhóm có nhiều hơn một lựa chọn,
 * và biến thể hết hàng vẫn hiện nhưng bị khoá để khách biết.
 */
export function VariantPicker({
  variants,
  value,
  onChange,
}: {
  variants: Variant[];
  value: string;
  onChange: (variantId: string) => void;
}) {
  const selected = variants.find((variant) => variant.id === value) ?? variants[0];
  const colors = distinct(variants.map((variant) => variant.color));
  const sizes = distinct(variants.map((variant) => variant.size));

  const pick = (next: { color?: string; size?: string }) => {
    const color = next.color ?? selected?.color ?? colors[0] ?? "";
    const size = next.size ?? selected?.size ?? sizes[0] ?? "";
    const match =
      variants.find((variant) => variant.color === color && variant.size === size) ??
      variants.find((variant) => variant.color === color) ??
      variants.find((variant) => variant.size === size) ??
      variants[0];
    if (match) onChange(match.id);
  };

  if (!selected) return null;

  const groups: { key: "color" | "size"; label: string; options: string[] }[] = [
    { key: "color", label: "Màu", options: colors },
    { key: "size", label: "Phiên bản", options: sizes },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        Phân loại: <span className="font-medium text-zinc-900 dark:text-zinc-100">{selected.color}</span>
        {selected.size ? <span className="font-medium text-zinc-900 dark:text-zinc-100"> · {selected.size}</span> : null}
      </p>
      {groups
        .filter((group) => group.options.length > 1)
        .map((group) => (
          <div key={group.key} className="space-y-1.5">
            <p className="text-xs font-medium text-zinc-500 uppercase dark:text-zinc-400">{group.label}</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label={group.label}>
              {group.options.map((option) => {
                const isActive = selected[group.key] === option;
                const optionVariants = variants.filter((variant) => variant[group.key] === option);
                const soldOut = optionVariants.every((variant) => variant.stock <= 0);
                return (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={isActive}
                    disabled={soldOut}
                    onClick={() => pick({ [group.key]: option })}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                        : "border-zinc-300 text-zinc-700 hover:border-zinc-900 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-300",
                      soldOut ? "cursor-not-allowed line-through opacity-50" : "",
                    )}
                  >
                    {option}
                    {soldOut ? <span className="sr-only"> (hết hàng)</span> : null}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
    </div>
  );
}
