import { Star } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Rating({
  value,
  reviewCount,
  size = 14,
  className,
}: {
  value: number;
  reviewCount?: number;
  size?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300", className)}>
      <span className="flex items-center" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            width={size}
            height={size}
            className={i <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-zinc-300 dark:text-zinc-600"}
          />
        ))}
      </span>
      <span className="font-medium">{value.toFixed(1)}</span>
      {typeof reviewCount === "number" ? <span className="text-zinc-400">({formatNumber(reviewCount)})</span> : null}
      <span className="sr-only">
        Đánh giá {value.toFixed(1)} trên 5
        {typeof reviewCount === "number" ? ` với ${reviewCount} lượt nhận xét` : ""}
      </span>
    </div>
  );
}
