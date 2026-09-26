import Link from "next/link";

export type Crumb = { href?: string; label: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Đường dẫn" className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-2">
            {item.href ? (
              <Link href={item.href} className="hover:text-zinc-900 hover:underline dark:hover:text-zinc-100">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-medium text-zinc-900 dark:text-zinc-100">
                {item.label}
              </span>
            )}
            {index < items.length - 1 ? <span aria-hidden>/</span> : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}
