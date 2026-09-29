import { ImageResponse } from "next/og";
import { getProductBySlug, products } from "@/data/catalog";
import { finalPrice, formatNumber } from "@/lib/format";

/**
 * Font mặc định của `next/og` không có ký hiệu "₫" nên satori phải tải font động và thất bại;
 * dùng "đ" (có sẵn trong font) để ảnh không bị ô trống.
 */
function imagePrice(value: number) {
  return `${formatNumber(value)} đ`;
}

/**
 * Ảnh OG sinh động cho từng sản phẩm (1200x630) — không cần file ảnh thật trong repo.
 * Sinh sẵn cho toàn bộ slug trong catalog nên trang chi tiết tĩnh vẫn có ảnh.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Ảnh chia sẻ sản phẩm ShopHA";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export default async function ProductOpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "linear-gradient(135deg, #18181b 0%, #3f3f46 100%)",
          color: "#fafafa",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 32, letterSpacing: 4, textTransform: "uppercase" }}>
          ShopHA · {product ? product.brand : "Sản phẩm"}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", fontSize: 68, fontWeight: 700, lineHeight: 1.15 }}>
            {product ? product.name : "Không tìm thấy sản phẩm"}
          </div>
          {product ? (
            <div style={{ display: "flex", alignItems: "center", gap: 24, fontSize: 44 }}>
              <span style={{ color: "#4ade80" }}>{imagePrice(finalPrice(product))}</span>
              <span style={{ fontSize: 30, color: "#d4d4d8" }}>Còn {product.stock} sản phẩm</span>
            </div>
          ) : null}
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#d4d4d8" }}>
          Điện thoại · Laptop · Tai nghe · Đồng hồ · Phụ kiện
        </div>
      </div>
    ),
    size,
  );
}
