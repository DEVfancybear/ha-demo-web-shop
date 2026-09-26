# ShopHA — demo shop (Next.js 15)

**English** · [Tiếng Việt](README.vi.md)

A demo storefront for tech gear: phones, laptops, headphones, watches and accessories.
All data is mock data — **no real transactions**.

## Run the project

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run start      # serve the production build
npm run lint       # eslint
```

## Architecture

| Layer | Location | Notes |
| --- | --- | --- |
| Pages | `src/app/**/page.tsx` | App Router; server components for the catalog and the product detail |
| Mock API | `src/app/api/*/route.ts` | `products`, `products/[slug]`, `categories`, `orders`, `orders/[id]` |
| Data | `src/data/catalog.ts` | 16 products, 5 categories, filter/sort/pagination helpers |
| Orders | `src/lib/orders.ts` | In-memory server store; the server recomputes prices, fees and discounts |
| Cart | `src/stores/cart-store.ts` | Zustand + persist to `localStorage` (key `shop-ha-cart`) |
| UI | `src/components/**` | shadcn-style: button, card, badge, field, layout, product, cart, checkout |

## Shopping flow

1. Home → pick a category.
2. `/products` filters by category, brand, max price and keyword, then sorts and paginates (the state lives in the URL).
3. `/products/[slug]` shows the product detail; choose a quantity and add it to the cart.
4. `/cart` edits quantities, removes items and shows the subtotal, the shipping fee and the discount.
5. `/checkout` takes the customer details (validated) and the payment method, then sends `POST /api/orders`.
6. `/checkout/success?orderId=...` shows the result; `/orders` lists every order created during the current server run.

## Pricing rules

- Free shipping from 500,000₫; below that the fee is 30,000₫.
- 10% discount on orders from 5,000,000₫.
- The server recomputes every amount from the prices in `catalog.ts` and checks stock before it creates an order.

## Tests

The E2E suite (Playwright, running on the machine's built-in Edge) has 74 checks: home page, search, category/brand/price filters, sorting, pagination, product detail, cart, checkout, order list, empty and 404 states, the 390px mobile layout and console logs. Every list assertion is compared against the mock API.

```bash
npm run dev -- --port 3210     # window 1: server
npm run test:e2e               # window 2: run the tests
```

- By default the tests call `http://127.0.0.1:3210`; change it with `BASE_URL=http://localhost:3000 npm run test:e2e`.
- Use `PW_CHANNEL=chrome` if the machine has no Edge.
- The script lives in `tests/e2e.cjs`; it prints JSON `{ total, passed, failed, checks }` and exits with code 1 when a check fails.

## Environment variables

Optional. See `.env.example` to change the site name or the hotline (the defaults live in `src/lib/config.ts`).

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_NAME` | `ShopHA` | Site name shown in the UI |
| `NEXT_PUBLIC_HOTLINE` | `1900 0000` | Hotline shown in the header and the footer |

## Known limitations

- Orders live in server memory only, inside `globalThis.__shopHaOrders` (a Map of the server process), so pages and API routes share the data; restarting the server clears every order.
- Product images are gradients plus emoji instead of real photos (works offline).
- No authentication and no real payment.

> The UI text is Vietnamese; only the documentation is bilingual.
