"use client";

import { Minus, Plus } from "lucide-react";

export function QuantityStepper({
  value,
  max = 99,
  onChange,
  size = "md",
}: {
  value: number;
  max?: number;
  onChange: (next: number) => void;
  size?: "sm" | "md";
}) {
  const clamp = (next: number) => Math.min(Math.max(1, next), Math.max(1, max));
  const button = size === "sm" ? "h-8 w-8" : "h-10 w-10";

  return (
    <div className="inline-flex items-center rounded-full border border-zinc-300 dark:border-zinc-700">
      <button
        type="button"
        aria-label="Giảm số lượng"
        className={`${button} grid place-items-center rounded-l-full hover:bg-zinc-100 disabled:opacity-40 dark:hover:bg-zinc-800`}
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= 1}
      >
        <Minus size={14} />
      </button>
      <span aria-live="polite" className="w-10 text-center text-sm font-semibold">
        {value}
      </span>
      <button
        type="button"
        aria-label="Tăng số lượng"
        className={`${button} grid place-items-center rounded-r-full hover:bg-zinc-100 disabled:opacity-40 dark:hover:bg-zinc-800`}
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= max}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
