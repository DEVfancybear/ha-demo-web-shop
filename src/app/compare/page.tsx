import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { CompareView } from "@/components/compare/compare-view";
import { getProductById } from "@/data/catalog";
import { COMPARE_MAX, parseCompareIdsParam } from "@/lib/compare";

export const metadata = {
  title: "So sánh sản phẩm",
  description: "Đặt tối đa 4 sản phẩm cạnh nhau để so sánh giá, thông số và tồn kho.",
  alternates: { canonical: "/compare" },
  // Trang theo lựa chọn của từng người, không cần cho máy tìm kiếm.
  robots: { index: false, follow: true },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ComparePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const raw = params.ids;
  const value = Array.isArray(raw) ? raw[0] : raw;
  // `/compare?ids=p01,p02` là liên kết chia sẻ: lọc id lạ TRƯỚC rồi mới cắt về tối đa 4,
  // để link có id hỏng vẫn hiện đủ số sản phẩm còn hợp lệ.
  const requestedIds = parseCompareIdsParam(value);
  const sharedIds = requestedIds.filter((id) => getProductById(id)).slice(0, COMPARE_MAX);
  const shareBroken = requestedIds.length > 0 && sharedIds.length === 0;

  return (
    <div>
      <Breadcrumbs items={[{ href: "/", label: "Trang chủ" }, { label: "So sánh" }]} />
      <header className="mb-6">
        <h1 className="text-2xl font-bold">So sánh sản phẩm</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Chọn tối đa {COMPARE_MAX} sản phẩm bằng nút so sánh trên thẻ sản phẩm, rồi xem cạnh nhau ở đây.
        </p>
      </header>
      <CompareView sharedIds={sharedIds.length > 0 ? sharedIds : null} shareBroken={shareBroken} />
    </div>
  );
}
