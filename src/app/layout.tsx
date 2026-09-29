import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — Đồ công nghệ chính hãng (demo)`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: ["đồ công nghệ", "điện thoại", "laptop", "tai nghe", "đồng hồ", "phụ kiện"],
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    locale: "vi_VN",
    title: `${siteConfig.name} — Đồ công nghệ chính hãng (demo)`,
    description: siteConfig.description,
    url: "/",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${siteConfig.name} — đồ công nghệ chính hãng` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — Đồ công nghệ chính hãng (demo)`,
    description: siteConfig.description,
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="min-h-screen antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:bg-zinc-900 focus:px-4 focus:py-2 focus:text-white"
        >
          Bỏ qua tới nội dung chính
        </a>
        <Header />
        <main id="main" className="mx-auto max-w-6xl px-4 py-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
