import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/config";

/** Ảnh OG mặc định cho trang chủ và các trang không có ảnh riêng. */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${siteConfig.name} — đồ công nghệ chính hãng (demo)`;

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 24,
          padding: 72,
          background: "linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)",
          color: "#f8fafc",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 40, letterSpacing: 6 }}>{siteConfig.name.toUpperCase()}</div>
        <div style={{ display: "flex", fontSize: 76, fontWeight: 700, lineHeight: 1.1 }}>
          Đồ công nghệ chính hãng
        </div>
        <div style={{ display: "flex", fontSize: 34, color: "#cbd5e1" }}>
          Điện thoại · Laptop · Tai nghe · Đồng hồ · Phụ kiện
        </div>
      </div>
    ),
    size,
  );
}
