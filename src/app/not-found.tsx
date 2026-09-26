import Link from "next/link";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <p className="text-5xl">🧭</p>
      <h1 className="text-2xl font-bold">Không tìm thấy trang</h1>
      <p className="max-w-md text-zinc-600 dark:text-zinc-300">
        Đường dẫn bạn mở không tồn tại hoặc sản phẩm đã ngừng bán.
      </p>
      <div className="flex gap-3">
        <Link href="/" className={buttonClass()}>
          Về trang chủ
        </Link>
        <Link href="/products" className={buttonClass({ variant: "outline" })}>
          Xem sản phẩm
        </Link>
      </div>
    </div>
  );
}
