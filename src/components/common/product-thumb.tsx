import { cn } from "@/lib/utils";

/** Ảnh placeholder dạng gradient + emoji để demo chạy được khi không có mạng. */
export function ProductThumb({
  emoji,
  tone,
  className,
  emojiClassName,
}: {
  emoji: string;
  tone: string;
  className?: string;
  emojiClassName?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "flex items-center justify-center bg-gradient-to-br text-5xl select-none",
        tone,
        className,
      )}
    >
      <span className={cn("drop-shadow-sm", emojiClassName)}>{emoji}</span>
    </div>
  );
}
