"use client";

import Link from "next/link";
import { GitCompare } from "lucide-react";
import { useIsMounted } from "@/lib/use-is-mounted";
import { cn } from "@/lib/utils";
import { useCompareStore } from "@/stores/compare-store";

/** Lối vào bảng so sánh ở header, kèm số sản phẩm đang chọn. */
export function CompareButton({ className }: { className?: string }) {
  const count = useCompareStore((state) => state.ids.length);
  const mounted = useIsMounted();

  return (
    <Link
      href="/compare"
      aria-label={`So sánh sản phẩm${mounted && count > 0 ? ` (${count} sản phẩm)` : ""}`}
      className={cn(
        "relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 text-zinc-800 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800",
        className,
      )}
    >
      <GitCompare size={18} />
      {mounted && count > 0 ? (
        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-900 px-1 text-[11px] font-semibold text-white dark:bg-white dark:text-zinc-900">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
