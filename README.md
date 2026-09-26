# ShopHA — demo shop (Next.js 15)

Cửa hàng demo đồ công nghệ: điện thoại, laptop, tai nghe, đồng hồ và phụ kiện.
Toàn bộ dữ liệu là giả lập, **không có giao dịch thật**.

## Chạy dự án

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # build production
npm run lint       # eslint
```

## Kiến trúc

| Lớp | Vị trí | Ghi chú |
|---|---|---|
| Trang | `src/app/**/page.tsx` | App Router, server component cho danh mục & chi tiết |
| Mock API | `src/app/api/*/route.ts` | `products`, `products/[slug]`, `categories`, `orders`, `orders/[id]` |
| Dữ liệu | `src/data/catalog.ts` | 16 sản phẩm, 5 danh mục, hàm lọc/sắp xếp/phân trang |
| Đơn hàng | `src/lib/orders.ts` | Lưu trong bộ nhớ server, tính giá/phí/giảm giá ở phía server |
| Giỏ hàng | `src/stores/cart-store.ts` | Zustand + persist vào `localStorage` |
| UI | `src/components/**` | shadcn-style: button, card, badge, field, layout, product, cart, checkout |

## Luồng mua sắm

1. Trang chủ → chọn danh mục.
2. `/products` lọc theo danh mục, thương hiệu, giá tối đa, từ khoá, sắp xếp, phân trang (đồng bộ qua URL).
3. `/products/[slug]` xem chi tiết, chọn số lượng, thêm vào giỏ.
4. `/cart` sửa số lượng, xoá, xem tạm tính/phí vận chuyển/giảm giá.
5. `/checkout` nhập thông tin (có validate), chọn phương thức thanh toán, gửi `POST /api/orders`.
6. `/checkout/success?orderId=...` xem kết quả, `/orders` xem toàn bộ đơn trong phiên chạy.

## Quy tắc tính tiền

- Miễn phí vận chuyển cho đơn từ 500.000₫, dưới mức đó phí 30.000₫.
- Giảm 10% cho đơn từ 5.000.000₫.
- Server tính lại toàn bộ tiền từ giá trong `catalog.ts` và kiểm tra tồn kho trước khi tạo đơn.

## Kiểm thử

Bộ kiểm thử E2E (Playwright, chạy trên Edge có sẵn của máy) gồm 74 kiểm tra:
trang chủ, tìm kiếm, lọc theo danh mục/thương hiệu/giá, sắp xếp, phân trang,
chi tiết sản phẩm, giỏ hàng, thanh toán, danh sách đơn, trạng thái rỗng/404,
layout mobile 390px và log console. Mọi so sánh danh sách đều đối chiếu với mock API.

```bash
npm run dev -- --port 3210     # cửa sổ 1: server đang chạy
npm run test:e2e               # cửa sổ 2: chạy kiểm thử
```

- Mặc định test gọi `http://127.0.0.1:3210`; đổi bằng `BASE_URL=http://localhost:3000 npm run test:e2e`.
- Dùng `PW_CHANNEL=chrome` nếu máy không có Edge.
- Script nằm ở `tests/e2e.cjs`, in ra JSON `{ total, passed, failed, checks }` và trả mã lỗi 1 khi có kiểm tra hỏng.

## Biến môi trường

Không bắt buộc. Xem `.env.example` nếu muốn đổi tên site, hotline, phí vận chuyển
(các giá trị hiện nằm trong `src/lib/config.ts`).

## Hạn chế đã biết

- Đơn hàng chỉ nằm trong bộ nhớ server: restart là mất.
- Ảnh sản phẩm là gradient + emoji thay cho ảnh thật (chạy được khi không có mạng).
- Không có đăng nhập, không có thanh toán thật.
- Đơn hàng nằm trong `globalThis.__shopHaOrders` (Map của tiến trình server) nên page và API dùng chung dữ liệu; restart server là mất đơn.
