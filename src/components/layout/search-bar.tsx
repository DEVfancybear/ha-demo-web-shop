"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/field";

export function SearchBar({ className }: { className?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");

  return (
    <form
      role="search"
      className={className}
      onSubmit={(event) => {
        event.preventDefault();
        const next = new URLSearchParams();
        if (value.trim()) next.set("q", value.trim());
        router.push(`/products${next.size ? `?${next.toString()}` : ""}`);
      }}
    >
      <div className="relative">
        <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400" aria-hidden />
        <Input
          name="q"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Tìm điện thoại, laptop, tai nghe..."
          aria-label="Tìm sản phẩm"
          className="pl-9"
        />
      </div>
    </form>
  );
}
