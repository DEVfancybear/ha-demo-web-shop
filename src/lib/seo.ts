import { siteConfig } from "@/lib/config";
import { finalPrice } from "@/lib/format";
import type { Product, Variant } from "@/types";

const currency = siteConfig.currency;

export function absoluteUrl(path: string) {
  return `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`;
}

export const siteUrl = siteConfig.url;

export function productPath(product: Pick<Product, "slug">) {
  return `/products/${product.slug}`;
}

function variantName(variant: Variant) {
  return [variant.color, variant.size].filter(Boolean).join(" · ") || variant.id;
}

/**
 * JSON-LD cho trang chi tiết sản phẩm: Product + giá + tình trạng còn hàng + điểm đánh giá.
 * `offers` lấy giá cuối cùng (đã áp khuyến mãi) để khớp với giá hiển thị trên trang.
 */
export function productJsonLd(product: Product, categoryName?: string) {
  const url = absoluteUrl(productPath(product));
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.id,
    brand: { "@type": "Brand", name: product.brand },
    ...(categoryName ? { category: categoryName } : {}),
    image: [absoluteUrl(`${productPath(product)}/opengraph-image`)],
    url,
    offers: {
      "@type": "Offer",
      url,
      price: finalPrice(product),
      priceCurrency: currency,
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
      bestRating: 5,
      worstRating: 1,
    },
    hasVariant: product.variants.map((variant) => ({
      "@type": "Product",
      name: variantName(variant),
      sku: variant.id,
      offers: {
        "@type": "Offer",
        url,
        price: finalPrice(product),
        priceCurrency: currency,
        availability: variant.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      },
    })),
  };
}

/** JSON-LD BreadcrumbList: đường dẫn hiển thị và đường dẫn trong dữ liệu luôn khớp nhau. */
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
