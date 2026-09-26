"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/field";
import { sortOptions } from "@/data/catalog";

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-zinc-500">Sắp xếp</span>
      <Select
        aria-label="Sắp xếp sản phẩm"
        className="h-10 w-52 py-0"
        value={params.get("sort") ?? "newest"}
        onChange={(event) => {
          const next = new URLSearchParams(params.toString());
          next.set("sort", event.target.value);
          next.delete("page");
          router.push(`${pathname}?${next.toString()}`);
        }}
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </label>
  );
}
