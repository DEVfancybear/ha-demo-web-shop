import { NextResponse } from "next/server";
import { getProductBySlug, getRelatedProducts, withEffectiveStock } from "@/data/catalog";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return NextResponse.json({ message: "Không tìm thấy sản phẩm." }, { status: 404 });
  }

  return NextResponse.json({
    product: withEffectiveStock(product),
    related: getRelatedProducts(slug).map(withEffectiveStock),
  });
}
