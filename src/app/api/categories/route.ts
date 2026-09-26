import { NextResponse } from "next/server";
import { getBrands, getCategories, priceBounds } from "@/data/catalog";

export function GET() {
  return NextResponse.json({
    categories: getCategories(),
    brands: getBrands(),
    priceRange: priceBounds(),
  });
}
