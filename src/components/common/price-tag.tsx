import { discountPercent, finalPrice, formatVND } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PriceTag({
  price,
  salePrice,
  size = "md",
  className,
}: {
  price: number;
  salePrice?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const discount = discountPercent(price, salePrice);
  return (
    <div className={cn("flex flex-wrap items-baseline gap-2", className)}>
      <span
        className={cn(
          "font-semibold text-zinc-900 dark:text-zinc-50",
          size === "sm" && "text-sm",
          size === "md" && "text-base",
          size === "lg" && "text-2xl",
        )}
      >
        {formatVND(finalPrice({ price, salePrice }))}
      </span>
      {discount > 0 ? (
        <>
          <span className={cn("text-zinc-400 line-through", size === "lg" ? "text-base" : "text-xs")}>
            {formatVND(price)}
          </span>
          <span className={cn("font-semibold text-red-600", size === "lg" ? "text-sm" : "text-xs")}>
            -{discount}%
          </span>
        </>
      ) : null}
    </div>
  );
}
