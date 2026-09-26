import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "sale" | "new" | "outline" | "success" | "warning";

const tones: Record<Tone, string> = {
  neutral: "bg-zinc-900 text-white",
  sale: "bg-red-600 text-white",
  new: "bg-emerald-600 text-white",
  outline: "border border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-200",
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
