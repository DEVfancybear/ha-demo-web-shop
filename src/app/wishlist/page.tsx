import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { WishlistView } from "@/components/wishlist/wishlist-view";

export const metadata = {
  title: "Sản phẩm yêu thích",
  description: "Danh sách sản phẩm bạn đã lưu để xem lại sau.",
  alternates: { canonical: "/wishlist" },
  // Danh sách nằm trong localStorage của từng người, không có nội dung cho máy tìm kiếm.
  robots: { index: false, follow: true },
};

export default function WishlistPage() {
  return (
    <div>
      <Breadcrumbs items={[{ href: "/", label: "Trang chủ" }, { label: "Yêu thích" }]} />
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Sản phẩm yêu thích</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Danh sách được lưu trong trình duyệt này (localStorage), không cần đăng nhập.
        </p>
      </header>
      <WishlistView />
    </div>
  );
}
