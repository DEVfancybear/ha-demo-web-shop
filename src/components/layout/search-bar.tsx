"use client";

import Form from "next/form";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/field";

/**
 * Ô tìm kiếm dùng `<Form>` của next/form:
 * - vẫn chạy khi JS chưa hydrate (trước đây submit native làm mất từ khoá),
 * - `key` theo `q` để ô nhập không giữ từ khoá cũ sau khi đổi bộ lọc.
 */
export function SearchBar({ className }: { className?: string }) {
  const params = useSearchParams();
  const keyword = params.get("q") ?? "";

  return (
    <Form key={keyword} action="/products" role="search" className={className}>
      <div className="relative">
        <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400" aria-hidden />
        <Input
          name="q"
          defaultValue={keyword}
          placeholder="Tìm điện thoại, laptop, tai nghe..."
          aria-label="Tìm sản phẩm"
          className="pl-9"
        />
      </div>
    </Form>
  );
}
