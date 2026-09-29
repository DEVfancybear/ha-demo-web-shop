import { NextResponse } from "next/server";
import { defaultVariant, findVariant, getProductById } from "@/data/catalog";
import type { PricedLine } from "@/lib/pricing";
import { publicVouchers, quoteVoucher } from "@/lib/vouchers";

const noStore = { "Cache-Control": "no-store" };

/** Danh sách mã đang chạy để trang giỏ hàng gợi ý cho khách. */
export function GET() {
  return NextResponse.json({ vouchers: publicVouchers() }, { headers: noStore });
}

/**
 * Kiểm tra mã giảm giá. Client gửi lên đúng các dòng hàng trong giỏ (`productId` + `variantId` + số lượng),
 * server tự tra giá từ catalog rồi tính mức giảm — không nhận giá hay mức giảm từ client.
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Body phải là JSON hợp lệ." }, { status: 400, headers: noStore });
  }

  const body = (payload ?? {}) as { code?: unknown; items?: unknown };
  const lines: PricedLine[] = [];

  if (Array.isArray(body.items)) {
    for (const raw of body.items) {
      const item = raw as { productId?: unknown; variantId?: unknown; quantity?: unknown };
      const product = getProductById(String(item?.productId ?? ""));
      if (!product) continue;

      const variant =
        typeof item?.variantId === "string" && item.variantId
          ? findVariant(product, item.variantId)
          : defaultVariant(product);
      if (!variant) continue;

      const requested = Number(item?.quantity ?? 0);
      const quantity = Number.isInteger(requested) && requested > 0 ? requested : 1;
      lines.push({ price: product.salePrice ?? product.price, quantity });
    }
  }

  const quote = quoteVoucher(String(body.code ?? ""), lines);
  return NextResponse.json(quote, { status: quote.ok ? 200 : 422, headers: noStore });
}
