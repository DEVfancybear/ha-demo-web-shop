"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <p className="text-5xl">⚠️</p>
      <h1 className="text-2xl font-bold">Có lỗi xảy ra</h1>
      <p className="max-w-md text-sm text-zinc-600 dark:text-zinc-300">
        {error.message || "Không tải được nội dung. Vui lòng thử lại."}
      </p>
      <Button onClick={reset}>Thử lại</Button>
    </div>
  );
}
