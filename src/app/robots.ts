import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Giỏ hàng/thanh toán là luồng riêng của từng khách, không cần cho bot.
        disallow: ["/api/", "/cart", "/checkout"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
