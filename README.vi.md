# ShopHA — cửa hàng demo (Next.js 16)

[English](README.md) · **Tiếng Việt**

Cửa hàng demo đồ công nghệ: điện thoại, laptop, tai nghe, đồng hồ và phụ kiện.
Toàn bộ dữ liệu là giả lập, **không có giao dịch thật**.

## Chạy dự án

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # build production
npm run start      # chạy bản production đã build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit (TypeScript 7)
```

## TypeScript

Dự án chạy compiler TypeScript 7 (bản native), nhưng toolchain vẫn cần API của TypeScript 6:

- `@typescript/native` (alias của `typescript@7`) cung cấp binary `tsc`, nên `npm run typecheck` dùng TypeScript 7.
- Tên package `typescript` được alias sang `@typescript/typescript6` vì `typescript-eslint` và bước build của Next.js cần compiler API — TypeScript 7 chưa có API này.
- `next build` kiểm tra type qua CLI của dự án (`experimental.useTypeScriptCli` mặc định bật ở Next.js 16).

## React Compiler

Dự án bật React Compiler (đã ổn định ở Next.js 16), nên component và hook được memo hoá tự động;
mã nguồn không dùng `useMemo`, `useCallback` hay `React.memo` bằng tay.

- `reactCompiler: true` trong `next.config.ts`; Next.js chỉ biên dịch phần client, server component bị bỏ qua.
- Cần `babel-plugin-react-compiler` (devDependency) — Next.js khai báo nó là optional peer dependency và build sẽ báo lỗi `Failed to load the \`babel-plugin-react-compiler\`` nếu thiếu, nên nơi chạy build phải cài cả devDependencies.
- Giữ mặc định: `compilationMode: "infer"` (chỉ component và hook) và `panicThreshold: "none"` (component mà compiler không phân tích được sẽ bị bỏ qua thay vì làm hỏng build).
- `eslint-config-next` 16 đã bật sẵn các rule `react-hooks` dựa trên compiler (ví dụ `react-hooks/set-state-in-effect`), nên `npm run lint` chặn sẵn những đoạn code mà compiler phải bỏ qua.
- Muốn kiểm tra compiler có chạy thật không, tải một chunk phía client từ dev server đang chạy và tìm chuỗi `react.memo_cache_sentinel` — compiler chèn marker này vào mọi component được memo hoá.

## Kiến trúc

| Lớp | Vị trí | Ghi chú |
| --- | --- | --- |
| Trang | `src/app/**/page.tsx` | App Router, server component cho danh mục và chi tiết |
| Mock API | `src/app/api/*/route.ts` | `products`, `products/[slug]`, `products/[slug]/reviews`, `categories`, `orders`, `orders/[id]` (GET + PATCH), `vouchers` |
| Dữ liệu | `src/data/catalog.ts`, `src/data/vouchers.ts` | 16 sản phẩm kèm biến thể, 5 danh mục, hàm lọc/sắp xếp/phân trang, danh sách mã giảm giá |
| Đơn hàng + tồn kho | `src/lib/orders.ts`, `src/lib/db.ts` | SQLite qua `node:sqlite`: đơn, dòng đơn, tồn kho theo biến thể; server tính lại giá, giữ chỗ tồn kho và tra cứu theo SĐT |
| Giỏ hàng | `src/stores/cart-store.ts` | Zustand + persist vào `localStorage` (khoá `shop-ha-cart`); chỉ lưu `productId` + `variantId` + `quantity` |
| Tính tiền + voucher | `src/lib/pricing.ts`, `src/lib/vouchers.ts` | Một nguồn luật duy nhất cho tạm tính, phí vận chuyển, giảm giá đơn lớn và giảm giá theo mã (giỏ + server) |
| Đánh giá | `src/lib/reviews.ts` | Đánh giá validate bằng zod, lưu trong SQLite; điểm hiển thị = số cứng trong catalog + đánh giá thật |
| SEO | `src/lib/seo.ts`, `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/**/opengraph-image.tsx` | JSON-LD (Product + BreadcrumbList), sitemap, robots và ảnh OG sinh bằng `next/og` |
| UI | `src/components/**` | shadcn-style: button, card, badge, field, layout, product, cart, checkout |

## Luồng mua sắm

1. Trang chủ → chọn danh mục.
2. `/products` lọc theo danh mục, thương hiệu, giá tối đa, từ khoá, sắp xếp, phân trang (đồng bộ qua URL).
3. `/products/[slug]` xem chi tiết, chọn phân loại (màu/phiên bản), chọn số lượng, thêm vào giỏ. Một sản phẩm có hai biến thể có thể nằm ở hai dòng giỏ khác nhau.
4. `/cart` sửa số lượng theo từng biến thể, xoá, nhập mã giảm giá, xem tạm tính/phí vận chuyển/giảm giá đơn lớn/giảm giá theo mã.
5. `/checkout` nhập thông tin (có validate), chọn phương thức thanh toán, gửi `POST /api/orders`; server kiểm tra tồn kho còn lại của từng biến thể, giữ chỗ và tính lại toàn bộ tiền.
6. `/checkout/success?orderId=...&phone=...` xem kết quả, `/orders` tra cứu theo số điện thoại đã đặt (kèm mã đơn nếu muốn), chỉ trả về đơn của SĐT đó và có thể đẩy trạng thái đơn tiến một bước (`pending → confirmed → shipping → done`).

## Quy tắc tính tiền

- Miễn phí vận chuyển cho đơn từ 500.000₫, dưới mức đó phí 30.000₫.
- Giảm 10% cho đơn từ 5.000.000₫.
- Mã giảm giá (khai báo trong `src/data/vouchers.ts`, kiểm tra bằng `POST /api/vouchers`): `SALE10` (10%, đơn từ 2.000.000₫, tối đa 500.000₫), `HA100K` (100.000₫, đơn từ 1.000.000₫), `FREESHIP` (miễn phí vận chuyển) và `VIP20` (20%, đơn từ 10.000.000₫, tối đa 2.000.000₫). Tổng giảm = giảm đơn lớn + giảm theo mã, và tổng tiền không bao giờ âm.
- Server tính lại toàn bộ tiền từ giá trong `catalog.ts` và trừ tồn kho theo từng biến thể khi tạo đơn (trả `409` kèm số còn lại nếu không đủ hàng).
- Giỏ chỉ giữ `productId` + `variantId` + `quantity`; tên, nhãn biến thể, đơn giá và giới hạn tồn kho luôn suy từ `catalog.ts` nên sửa `localStorage` không đổi được số tiền.

## Dữ liệu và SQLite

Đơn hàng, tồn kho theo biến thể và đánh giá nằm trong SQLite, mở bằng `node:sqlite` (có sẵn trong Node 22+ nên không phải build native dependency).

| Bảng | Nội dung |
| --- | --- |
| `orders` | mỗi đơn một dòng: mã, mốc thời gian, trạng thái, các khoản tiền, mã giảm giá, thông tin người nhận |
| `order_items` | dòng của đơn, giữ nhãn biến thể và đơn giá tại thời điểm đặt |
| `variant_stock` | tồn kho thật theo biến thể; dòng được seed từ catalog ngay lần đặt đầu và trừ trong cùng transaction |
| `reviews` | đánh giá gửi từ trang chi tiết sản phẩm |

- Mặc định lưu ở `.data/shop.db` (đã gitignore); đổi bằng `SHOP_DB_PATH`.
- Tạo đơn chạy trong một transaction `BEGIN IMMEDIATE`: `UPDATE variant_stock SET stock = stock - ? WHERE variant_id = ? AND stock >= ?` là chốt cuối, nên hai đơn liên tiếp không thể bán vượt kho.
- `catalog.ts` vẫn là số gốc; API và trang chi tiết đọc lại bảng trước khi render nên tồn kho còn nguyên sau khi restart.
- Client không thấy được bảng, nên giỏ kẹp theo số trong catalog còn server kiểm tra lại bằng SQLite — server luôn là bên quyết định.
- Muốn xoá dữ liệu demo: dừng server rồi xoá file (`Remove-Item .data/shop.db` trên Windows, `rm .data/shop.db` trên máy khác).

## Kiểm thử

Bộ kiểm thử E2E (Playwright, chạy trên Edge có sẵn của máy) gồm 143 kiểm tra:
trang chủ, tìm kiếm (kể cả tiếng Việt không dấu và theo tên danh mục), lọc theo
danh mục/thương hiệu/giá, sắp xếp, phân trang (kể cả `page`/`perPage` thập phân và
`maxPrice=abc`), chi tiết sản phẩm, biến thể (chọn phân loại, hai biến thể thành hai
dòng giỏ, tồn kho theo biến thể), giỏ hàng, sửa `localStorage` để gian giá, mã giảm
giá (mã đúng, mã lạ, chưa đủ giá trị tối thiểu, giá client gửi lên bị bỏ qua), thanh
toán, giữ chỗ tồn kho theo biến thể, tra cứu đơn theo SĐT, luồng `PATCH /api/orders/[id]`,
đánh giá sản phẩm (API + form), SEO (sitemap, robots, JSON-LD, ảnh OG), trạng thái
rỗng/404, layout mobile 390px và log console. Mọi so sánh danh sách đều đối chiếu với mock API.

```bash
# cửa sổ 1 — dev server dùng database tạm
$env:SHOP_DB_PATH="$PWD\.tmp\e2e-shop.db"      # PowerShell (bash: SHOP_DB_PATH=./.tmp/e2e-shop.db)
Remove-Item .tmp\e2e-shop.db -ErrorAction SilentlyContinue
npm run dev -- --port 3210

# cửa sổ 2
npm run test:e2e
```

- Mặc định test gọi `http://127.0.0.1:3210`; đổi bằng `BASE_URL=http://localhost:3000 npm run test:e2e`.
- Bộ test tạo đơn, trừ tồn kho và ghi đánh giá, nên phải chạy trên database mới (xoá file khi server đã dừng rồi khởi động lại). Chạy lần hai trên cùng file sẽ đỏ ở điều kiện "cả hai biến thể còn hàng".
- Dev server cho phép `127.0.0.1` qua `allowedDevOrigins` trong `next.config.ts`; Next.js 16 chặn request cross-origin ở chế độ dev theo mặc định, nên thiếu entry đó thì trang vẫn render nhưng không hydrate.
- Dùng `PW_CHANNEL=chrome` nếu máy không có Edge.
- Next hydrate sau khi HTML đã hiện, nên bộ test chờ `html[data-hydrated="true"]` (do nút giỏ hàng ở header đặt) trước khi click; nếu không, click có thể rơi vào lúc chưa gắn handler.
- Script nằm ở `tests/e2e.cjs`, in ra JSON `{ total, passed, failed, checks }` và trả mã lỗi 1 khi có kiểm tra hỏng.

## Biến môi trường

Không bắt buộc. Xem `.env.example` nếu muốn đổi tên site hoặc hotline
(các giá trị mặc định nằm trong `src/lib/config.ts`).

| Biến | Mặc định | Ý nghĩa |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_NAME` | `ShopHA` | Tên cửa hàng hiển thị trên UI |
| `NEXT_PUBLIC_HOTLINE` | `1900 0000` | Hotline ở header và footer |
| `SHOP_DB_PATH` | `.data/shop.db` | File SQLite cho đơn hàng, tồn kho biến thể và đánh giá |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | URL công khai dùng cho canonical, JSON-LD, `robots.txt` và `sitemap.xml` |

## Hạn chế đã biết

- Đơn hàng, tồn kho biến thể và đánh giá nằm trong SQLite (`SHOP_DB_PATH`, mặc định `.data/shop.db`) nên còn sau khi restart; xoá file là reset demo. Chưa có migration/sao lưu — đây vẫn là cửa hàng demo, không phải shop thật.
- `next/og` vẽ ảnh chia sẻ bằng font có sẵn và font này không có ký tự `₫`, nên ảnh OG in giá dạng `18.990.000 đ`.
- Ảnh sản phẩm là gradient + emoji thay cho ảnh thật (chạy được khi không có mạng).
- Trang chi tiết sản phẩm ở production là static nên dòng tồn kho có thể cũ hơn database; server đọc lại SQLite (và trừ kho trong transaction) mỗi khi tạo đơn.
- Đánh giá được tải bằng client component để trang tĩnh vẫn hiện được đánh giá mới; điểm ở phần đầu trang vẫn là số cứng trong catalog.
- Không có đăng nhập, không có thanh toán thật: tra cứu đơn chỉ xác thực bằng số điện thoại, và giỏ kẹp số lượng theo tồn kho trong catalog còn server vẫn là nguồn đúng cuối cùng.

> Phần giao diện dùng tiếng Việt; chỉ tài liệu là song ngữ.
