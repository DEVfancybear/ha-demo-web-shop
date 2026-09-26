export default function Loading() {
  return (
    <div aria-busy className="space-y-4">
      <div className="h-8 w-52 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((item) => (
          <div key={item} className="h-80 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
        ))}
      </div>
    </div>
  );
}
