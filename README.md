# ShopHA — demo shop (Next.js 16)

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
npm run typecheck  # tsc --noEmit (TypeScript 7)
```

## TypeScript

The project runs the native TypeScript 7 compiler, but the toolchain still needs the TypeScript 6 API:

- `@typescript/native` (an alias of `typescript@7`) provides the `tsc` binary, so `npm run typecheck` uses TypeScript 7.
- The `typescript` package name is aliased to `@typescript/typescript6`, because `typescript-eslint` and the Next.js build load the compiler API — TypeScript 7 does not ship one yet.
- `next build` type-checks through the project-local CLI (`experimental.useTypeScriptCli` is on by default in Next.js 16).

## React Compiler

The project runs the React Compiler (stable in Next.js 16), so components and hooks are memoized
automatically and the code does not use `useMemo`, `useCallback` or `React.memo` by hand.

- `reactCompiler: true` in `next.config.ts`; Next.js only compiles the client graph, server components are skipped.
- `babel-plugin-react-compiler` (devDependency) is required — Next.js declares it as an optional peer dependency and fails the build with `Failed to load the \`babel-plugin-react-compiler\`` when it is missing, so keep devDependencies installed wherever the build runs.
- The defaults are kept: `compilationMode: "infer"` (components and hooks only) and `panicThreshold: "none"` (a component the compiler cannot analyze is skipped instead of failing the build).
- `eslint-config-next` 16 already enables the compiler-aware `react-hooks` rules (for example `react-hooks/set-state-in-effect`), so `npm run lint` blocks code the compiler would have to skip.
- To confirm the compiler really ran, download a client chunk from a running dev server and search it for `react.memo_cache_sentinel` — the compiler emits that marker in every memoized component.

## Architecture

| Layer | Location | Notes |
| --- | --- | --- |
| Pages | `src/app/**/page.tsx` | App Router; server components for the catalog and the product detail |
| Mock API | `src/app/api/*/route.ts` | `products`, `products/[slug]`, `products/[slug]/reviews`, `categories`, `orders`, `orders/[id]` (GET + PATCH), `vouchers` |
| Data | `src/data/catalog.ts`, `src/data/vouchers.ts` | 16 products with variants, 5 categories, filter/sort/pagination helpers, voucher list |
| Orders + stock | `src/lib/orders.ts`, `src/lib/db.ts` | SQLite via `node:sqlite`: orders, order items, per-variant stock; the server recomputes prices, reserves stock and looks orders up by phone |
| Cart | `src/stores/cart-store.ts` | Zustand + persist to `localStorage` (key `shop-ha-cart`); stores only `productId` + `variantId` + `quantity` |
| Pricing + vouchers | `src/lib/pricing.ts`, `src/lib/vouchers.ts` | One source of truth for the subtotal, the shipping fee, the bulk discount and the voucher discount (cart + server) |
| Reviews | `src/lib/reviews.ts` | zod-validated reviews in SQLite; the displayed rating blends the catalog seed with real reviews |
| SEO | `src/lib/seo.ts`, `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/**/opengraph-image.tsx` | JSON-LD (Product + BreadcrumbList), sitemap, robots and OG images generated with `next/og` |
| UI | `src/components/**` | shadcn-style: button, card, badge, field, layout, product, cart, checkout |

## Shopping flow

1. Home → pick a category.
2. `/products` filters by category, brand, max price and keyword, then sorts and paginates (the state lives in the URL).
3. `/products/[slug]` shows the product detail; pick a colour/size variant, choose a quantity and add it to the cart. A product with two variants can sit on two cart lines.
4. `/cart` edits quantities per variant, removes items, applies a voucher code and shows the subtotal, the shipping fee, the bulk discount and the voucher discount.
5. `/checkout` takes the customer details (validated) and the payment method, then sends `POST /api/orders`; the server checks the remaining stock of each variant, reserves it and recomputes every amount.
6. `/checkout/success?orderId=...&phone=...` shows the result; `/orders` looks orders up by the phone number used at checkout (plus an optional order code), returns only that phone's orders and can move an order one step forward (`pending → confirmed → shipping → done`).

## Pricing rules

- Free shipping from 500,000₫; below that the fee is 30,000₫.
- 10% discount on orders from 5,000,000₫.
- Vouchers (declared in `src/data/vouchers.ts`, checked by `POST /api/vouchers`): `SALE10` (10%, min 2,000,000₫, max 500,000₫), `HA100K` (100,000₫, min 1,000,000₫), `FREESHIP` (waives the shipping fee) and `VIP20` (20%, min 10,000,000₫, max 2,000,000₫). Total discount = bulk discount + voucher discount, and the total can never go below zero.
- The server recomputes every amount from the prices in `catalog.ts`, and reserves stock per variant when it creates an order (`409` with the remaining quantity when the stock is not enough).
- The cart only keeps `productId` + `variantId` + `quantity`; the name, the variant label, the unit price and the stock limit are always resolved from `catalog.ts`, so editing `localStorage` cannot change the amount.

## Data and SQLite

Orders, per-variant stock and reviews live in SQLite, opened with `node:sqlite` (built into Node 22+, so there is no native dependency to compile).

| Table | Holds |
| --- | --- |
| `orders` | one row per order: code, timestamps, status, money breakdown, voucher, customer snapshot |
| `order_items` | the lines of an order with the variant label and the price frozen at checkout |
| `variant_stock` | the real per-variant stock; a row is seeded from the catalog on the first order and decremented inside the same transaction |
| `reviews` | reviews posted on a product page |

- The file defaults to `.data/shop.db` (gitignored); change it with `SHOP_DB_PATH`.
- Creating an order runs in one `BEGIN IMMEDIATE` transaction: `UPDATE variant_stock SET stock = stock - ? WHERE variant_id = ? AND stock >= ?` is the final guard, so two orders in a row cannot oversell.
- `catalog.ts` stays the fallback seed; the API and the product pages re-read the table before rendering, so stock survives a restart.
- The client cannot see the table, so the cart clamps against the catalog numbers while the server re-validates against SQLite — the server always wins.
- To start over: stop the server and delete the file (`Remove-Item .data/shop.db` on Windows, `rm .data/shop.db` elsewhere).

## Tests

The E2E suite (Playwright, running on the machine's built-in Edge) has 143 checks: home page, search (including Vietnamese without diacritics and by category name), category/brand/price filters, sorting, pagination (including decimal `page`/`perPage` and `maxPrice=abc`), product detail, variants (picking a variant, two variants on two cart lines, per-variant stock), cart, cart tampering through `localStorage`, voucher codes (valid, unknown, under the minimum, ignored client price), checkout, per-variant stock reservation, order lookup by phone, the `PATCH /api/orders/[id]` status flow, product reviews through the API and the form, SEO (sitemap, robots, JSON-LD, OG image), empty and 404 states, the 390px mobile layout and console logs. Every list assertion is compared against the mock API.

```bash
# window 1 — dev server on a throwaway database
$env:SHOP_DB_PATH="$PWD\.tmp\e2e-shop.db"      # PowerShell (bash: SHOP_DB_PATH=./.tmp/e2e-shop.db)
Remove-Item .tmp\e2e-shop.db -ErrorAction SilentlyContinue
npm run dev -- --port 3210

# window 2
npm run test:e2e
```

- By default the tests call `http://127.0.0.1:3210`; change it with `BASE_URL=http://localhost:3000 npm run test:e2e`.
- The suite creates orders, consumes stock and writes reviews, so start it against a fresh database (delete the file while the server is stopped, then start the server). Running it twice against the same file will fail the "both variants are still in stock" precondition.
- The dev server allows `127.0.0.1` through `allowedDevOrigins` in `next.config.ts`; Next.js 16 blocks cross-origin dev requests by default, so pages would render without hydrating without that entry.
- Use `PW_CHANNEL=chrome` if the machine has no Edge.
- Next.js hydrates after the HTML is visible, so the suite waits for `html[data-hydrated="true"]` (set by the cart button in the header) before it clicks; otherwise a click can land before the handlers are attached.
- The script lives in `tests/e2e.cjs`; it prints JSON `{ total, passed, failed, checks }` and exits with code 1 when a check fails.

## Environment variables

Optional. See `.env.example` to change the site name or the hotline (the defaults live in `src/lib/config.ts`).

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_NAME` | `ShopHA` | Site name shown in the UI |
| `NEXT_PUBLIC_HOTLINE` | `1900 0000` | Hotline shown in the header and the footer |
| `SHOP_DB_PATH` | `.data/shop.db` | SQLite file for orders, variant stock and reviews |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Public URL used by canonical links, JSON-LD, `robots.txt` and `sitemap.xml` |

## Known limitations

- Orders, variant stock and reviews live in SQLite (`SHOP_DB_PATH`, default `.data/shop.db`), so they survive a restart; deleting that file resets the demo. There is still no migration or backup story — this is a demo store, not a real shop.
- `next/og` renders the share cards with its built-in font, which has no `₫` glyph, so the OG image prints prices as `18.990.000 đ`.
- Product images are gradients plus emoji instead of real photos (works offline).
- Product detail pages are statically generated in production, so their stock line can lag behind the database; the server re-reads SQLite (and reserves stock inside a transaction) whenever an order is created.
- Reviews are fetched by a client component so a static product page can still show new ones; the header rating stays the catalog seed.
- No authentication and no real payment: order lookup only proves ownership of a phone number, and the cart clamps quantities against the catalog stock while the server stays the source of truth.

> The UI text is Vietnamese; only the documentation is bilingual.
