import Link from "next/link";

export function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  const linkBase =
    "inline-flex h-10 min-w-10 items-center justify-center rounded-full border px-3 text-sm font-medium";

  return (
    <nav aria-label="Phân trang" className="mt-8 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={buildHref(page - 1)} className={`${linkBase} border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800`}>
          Trước
        </Link>
      ) : null}

      {pages.map((item) => (
        <Link
          key={item}
          href={buildHref(item)}
          aria-current={item === page ? "page" : undefined}
          className={`${linkBase} ${
            item === page
              ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
              : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          }`}
        >
          {item}
        </Link>
      ))}

      {page < totalPages ? (
        <Link href={buildHref(page + 1)} className={`${linkBase} border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800`}>
          Sau
        </Link>
      ) : null}
    </nav>
  );
}
