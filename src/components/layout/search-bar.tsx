"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import Form from "next/form";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CornerDownLeft, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/field";
import { formatVND } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SearchSuggestion } from "@/types";

/** Trùng với `SUGGEST_MIN_LENGTH` ở server: ngắn hơn thì không gọi API. */
const SUGGEST_MIN_LENGTH = 2;
const DEBOUNCE_MS = 200;

/**
 * Ô tìm kiếm dùng `<Form>` của next/form:
 * - vẫn chạy khi JS chưa hydrate (submit native vẫn mang `name="q"`),
 * - `key` theo `q` để ô nhập không giữ từ khoá cũ sau khi đổi bộ lọc.
 */
export function SearchBar({ className }: { className?: string }) {
  const params = useSearchParams();
  const keyword = params.get("q") ?? "";
  return <SearchCombobox key={keyword} keyword={keyword} className={className} />;
}

/**
 * Lớp gợi ý (combobox) phủ lên form gốc: gọi `/api/search/suggest` sau khi ngừng gõ 200ms,
 * điều hướng bằng ↓/↑ + Enter, Esc để đóng. Mặc định không chọn mục nào nên Enter vẫn submit form
 * như trước (giữ được hành vi tìm kiếm khi chưa có gợi ý hoặc khi API lỗi).
 *
 * Chỉ gọi API sau khi người dùng thật sự chạm vào ô (focus/gõ), để trang `/products?q=...`
 * không tự bật popup khi vừa tải.
 */
function SearchCombobox({ keyword, className }: { keyword: string; className?: string }) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  /** Từ khoá người dùng đã chủ động đóng popup; response về muộn không được mở lại. */
  const dismissedForRef = useRef<string | null>(null);
  const listId = useId();
  const [term, setTerm] = useState(keyword);
  const [interacted, setInteracted] = useState(false);
  const [items, setItems] = useState<SearchSuggestion[]>([]);
  const [total, setTotal] = useState(0);
  /** Từ khoá mà lần gọi API gần nhất đã thất bại; phân biệt "lỗi mạng" với "không có kết quả". */
  const [failedFor, setFailedFor] = useState<string | null>(null);
  /** Từ khoá của request đang bay; `null` = không có request nào. */
  const [pending, setPending] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const trimmed = term.trim();
  const loading = pending !== null && pending === trimmed;
  const showList = open && trimmed.length >= SUGGEST_MIN_LENGTH;
  const hasListbox = showList && items.length > 0;
  /** Lời nhắc trong popup khi chưa có mục nào: đang tải, lỗi mạng, hay thật sự không khớp. */
  const emptyMessage = loading
    ? "Đang tìm gợi ý…"
    : failedFor === trimmed
      ? `Không tải được gợi ý cho “${trimmed}”. Nhấn Enter để tìm toàn bộ.`
      : `Không có gợi ý cho “${trimmed}”. Nhấn Enter để tìm toàn bộ.`;

  // Gọi API gợi ý sau khi ngừng gõ; đổi từ khoá thì huỷ request cũ.
  useEffect(() => {
    const value = term.trim();
    if (!interacted || value.length < SUGGEST_MIN_LENGTH) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      // Bỏ gợi ý của từ khoá trước để "Xem tất cả N kết quả" không ghép số cũ với từ khoá mới.
      setItems([]);
      setTotal(0);
      setFailedFor(null);
      setPending(value);
      fetch(`/api/search/suggest?q=${encodeURIComponent(value)}`, { signal: controller.signal })
        .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
        .then((data: { query?: string; items?: SearchSuggestion[]; total?: number }) => {
          // Response về muộn của từ khoá đã đổi thì bỏ, tránh ghi đè kết quả mới.
          if ((data.query ?? value) !== value) return;
          setItems(Array.isArray(data.items) ? data.items : []);
          setTotal(typeof data.total === "number" ? data.total : 0);
          setFailedFor(null);
          setActive(-1);
          // Người dùng đã chủ động đóng (Esc/bấm ra ngoài) thì không tự mở lại.
          setOpen(dismissedForRef.current !== value);
        })
        .catch(() => {
          // API lỗi thì vẫn còn form gốc (Enter là submit form như trước), nhưng phải nói đúng
          // nguyên nhân: "không tải được gợi ý" khác với "không có gợi ý nào khớp".
          if (!controller.signal.aborted) {
            setItems([]);
            setTotal(0);
            setFailedFor(value);
            setOpen(dismissedForRef.current !== value);
          }
        })
        .finally(() => {
          // Chỉ xoá cờ đang tải nếu nó vẫn thuộc request này (request cũ bị abort không xoá cờ của request mới).
          setPending((current) => (current === value ? null : current));
        });
    }, DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [term, interacted]);

  // Bấm ra ngoài thì đóng gợi ý (không chặn cú click đó).
  useEffect(() => {
    if (!showList) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        dismissedForRef.current = trimmed;
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [showList, trimmed]);

  const go = (href: string) => {
    setOpen(false);
    setActive(-1);
    router.push(href);
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (items.length === 0) return;
      event.preventDefault();
      setOpen(true);
      setActive((current) => {
        if (!hasListbox) return 0;
        if (event.key === "ArrowDown") return current >= items.length - 1 ? 0 : current + 1;
        return current <= 0 ? items.length - 1 : current - 1;
      });
      return;
    }
    if (event.key === "Escape") {
      dismissedForRef.current = trimmed;
      setOpen(false);
      setActive(-1);
      return;
    }
    if (event.key === "Enter" && hasListbox && active >= 0 && items[active]) {
      // Có mục đang chọn: đi tới gợi ý; không chọn gì thì để form submit như bình thường.
      event.preventDefault();
      go(items[active].href);
    }
  };

  return (
    <Form
      action="/products"
      role="search"
      className={className}
      onSubmit={() => {
        setOpen(false);
        setActive(-1);
      }}
    >
      <div
        ref={rootRef}
        className="relative"
        // Rời khỏi cả ô nhập lẫn popup (ví dụ Tab đi tiếp) thì đóng gợi ý.
        onBlur={(event) => {
          if (!rootRef.current?.contains(event.relatedTarget as Node | null)) {
            dismissedForRef.current = trimmed;
            setOpen(false);
          }
        }}
      >
        <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400" aria-hidden />
        <Input
          name="q"
          value={term}
          onChange={(event) => {
            setInteracted(true);
            dismissedForRef.current = null;
            setTerm(event.target.value);
            setActive(-1);
          }}
          onKeyDown={onKeyDown}
          onFocus={() => {
            // Người dùng chủ động quay lại ô nhập: mở lại gợi ý (Esc/bấm ra ngoài chỉ đóng tạm thời).
            setInteracted(true);
            dismissedForRef.current = null;
            if (trimmed.length >= SUGGEST_MIN_LENGTH) setOpen(true);
          }}
          placeholder="Tìm điện thoại, laptop, tai nghe..."
          aria-label="Tìm sản phẩm"
          role="combobox"
          aria-expanded={hasListbox}
          aria-controls={hasListbox ? listId : undefined}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-activedescendant={hasListbox && active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          className="pr-9 pl-9"
        />
        {loading ? (
          <Loader2
            size={16}
            className="absolute top-1/2 right-3 -translate-y-1/2 animate-spin text-zinc-400"
            aria-hidden
          />
        ) : null}

        {showList ? (
          <div className="absolute top-full left-0 z-50 mt-2 w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
            {items.length === 0 ? (
              <p className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400" role="status">
                {emptyMessage}
              </p>
            ) : (
              <>
                <ul id={listId} role="listbox" aria-label="Gợi ý tìm kiếm" className="max-h-80 overflow-y-auto py-1">
                  {items.map((item, index) => (
                    <li
                      key={`${item.type}-${item.href}`}
                      id={`${listId}-${index}`}
                      role="option"
                      aria-selected={index === active}
                      data-suggestion-type={item.type}
                      onMouseEnter={() => setActive(index)}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => go(item.href)}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 px-3 py-2 text-sm",
                        index === active
                          ? "bg-zinc-100 dark:bg-zinc-800"
                          : "hover:bg-zinc-50 dark:hover:bg-zinc-800/60",
                      )}
                    >
                      <span aria-hidden className="text-base">
                        {item.emoji ?? "🔎"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{item.label}</span>
                        {item.meta ? <span className="block truncate text-xs text-zinc-500">{item.meta}</span> : null}
                      </span>
                      {typeof item.price === "number" ? (
                        <span className="text-xs font-semibold whitespace-nowrap">
                          {formatVND(item.salePrice ?? item.price)}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-400">Xem</span>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="border-t border-zinc-100 px-3 py-2 dark:border-zinc-800">
                  {/* tabIndex -1: popup không nằm trong thứ tự Tab, giống mẫu combobox của APG. */}
                  <Link
                    href={`/products?q=${encodeURIComponent(trimmed)}`}
                    tabIndex={-1}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:underline dark:text-zinc-300"
                  >
                    <CornerDownLeft size={12} aria-hidden />
                    Xem tất cả {total} kết quả cho “{trimmed}”
                  </Link>
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>
    </Form>
  );
}
