
let chromium;
try {
  ({ chromium } = require('playwright-core'));
} catch {
  ({ chromium } = require('playwright'));
}

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3210';
const checks = [];
function check(name, ok, detail) {
  checks.push({ name, ok: !!ok, detail: detail === undefined ? null : detail });
}
/** "51.273.000 ₫" / "-5.697.000 ₫" -> "51273000" / "5697000" */
function digits(value) {
  return String(value).replace(/[^0-9]/g, '');
}
function vnd(n) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);
}
async function apiProducts(params) {
  const qs = new URLSearchParams(params).toString();
  const r = await fetch(`${BASE}/api/products?${qs}`);
  if (!r.ok) throw new Error('api products ' + r.status);
  return r.json();
}
async function titles(page) {
  return page.$$eval('article h3', (els) => els.map((e) => e.textContent.trim().replace(/\s+/g, ' ')));
}
/** Nhãn biến thể giống `variantLabel()` trong src/data/catalog.ts. */
function variantLabelOf(variant) {
  return [variant.color, variant.size].filter(Boolean).join(' · ');
}

async function waitCards(page) {
  await page.waitForSelector('article', { timeout: 20000 });
}
/**
 * Next hydrate sau khi HTML đã hiện, nên click sớm có thể bị "rơi" mất (không có handler).
 * CartButton đặt `data-hydrated` khi đã mount — chờ dấu hiệu đó trước khi tương tác.
 */
async function waitHydrated(page) {
  await page.waitForSelector('html[data-hydrated="true"]', { timeout: 30000 });
}
async function openPage(page, url) {
  const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
  await waitHydrated(page);
  return response;
}
async function totalRow(page, label) {
  const row = page.locator('dl > div', { hasText: label }).first();
  return (await row.locator('dd').innerText()).trim();
}
async function cartState(page) {
  return page.evaluate(() => {
    const raw = localStorage.getItem('shop-ha-cart');
    return raw ? JSON.parse(raw).state.items : [];
  });
}
async function wishlistState(page) {
  return page.evaluate(() => {
    const raw = localStorage.getItem('shop-ha-wishlist');
    return raw ? JSON.parse(raw).state.ids : [];
  });
}
async function compareState(page) {
  return page.evaluate(() => {
    const raw = localStorage.getItem('shop-ha-compare');
    return raw ? JSON.parse(raw).state.ids : [];
  });
}
/** Tên sản phẩm trên thẻ thứ `index`, chuẩn hoá khoảng trắng giống `titles()`. */
async function cardName(page, index) {
  return page
    .locator('article')
    .nth(index)
    .locator('h3')
    .evaluate((el) => el.textContent.trim().replace(/\s+/g, ' '));
}

(async () => {
  const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'msedge' });
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: 'vi-VN' });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const badResponses = [];
  // H3/H5 deliberately request an unknown product, so the browser logs a 404 for it. Ignore that probe only.
  const INTENTIONAL_404 = 'khong-ton-tai';
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const where = (m.location() && m.location().url) || '';
    if (where.includes(INTENTIONAL_404)) return;
    consoleErrors.push((where ? where + ' :: ' : '') + m.text().slice(0, 300));
  });
  page.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 300)));
  page.on('response', (r) => { if (r.status() >= 500) badResponses.push(r.status() + ' ' + r.url()); });

  try {
    // ---------- A. Home ----------
    const homeResp = await openPage(page, BASE + '/');
    check('A1 home HTTP 200', homeResp.status() === 200, homeResp.status());
    await waitCards(page);
    const homeTitles = await titles(page);
    const homeH1 = (await page.locator('h1').first().innerText()).trim();
    check('A2 home renders hero heading', homeH1.length > 5, homeH1);
    check('A3 home shows featured products', homeTitles.length >= 4, homeTitles.length + ' cards');
    const title = await page.title();
    check('A4 home has document title', /ShopHA|HA/i.test(title) || title.length > 3, title);
    // header nav
    const navLinks = await page.$$eval('nav[aria-label="Điều hướng chính"] a', (a) => a.map((x) => x.textContent.trim()));
    check('A5 main nav', navLinks.length === 3 && navLinks.includes('Sản phẩm'), navLinks.join('|'));
    const catChips = await page.$$eval('header a[href^="/products?category="]', (a) => a.length);
    check('A6 category chips in header', catChips === 5, catChips);

    const cats = await (await fetch(`${BASE}/api/categories`)).json();
    check('A7 categories API returns 5 categories', Array.isArray(cats.categories) && cats.categories.length === 5,
      JSON.stringify(cats.categories ? cats.categories.length : cats));

    // ---------- B. Search ----------
    await page.locator('form[role="search"] input[name="q"]').first().fill('laptop');
    await page.locator('form[role="search"] input[name="q"]').first().press('Enter');
    await page.waitForURL(/\/products\?.*q=laptop/, { timeout: 15000 });
    await waitCards(page);
    const searchTitles = await titles(page);
    const apiSearch = await apiProducts({ q: 'laptop', perPage: 50 });
    check('B1 search url carries q', page.url().includes('q=laptop'), page.url());
    check('B2 search result count matches data', searchTitles.length === apiSearch.total,
      `dom=${searchTitles.length} api=${apiSearch.total}`);
    check('B3 search result order matches data',
      JSON.stringify(searchTitles) === JSON.stringify(apiSearch.items.map((p) => p.name.trim())),
      JSON.stringify({ dom: searchTitles, api: apiSearch.items.map((p) => p.name) }));
    const headerLine = (await page.locator('header + * p, main p').first().innerText().catch(() => '')).trim();
    check('B4 summary line mentions found count', /Tìm thấy\s+\d+\s+sản phẩm/.test(await page.locator('body').innerText()),
      headerLine.slice(0, 80));

    // B5: tìm tiếng Việt phải bỏ dấu và khớp cả tên danh mục ("điện thoại" -> 3 máy).
    for (const query of ['điện thoại', 'dien thoai', 'ĐIỆN THOẠI']) {
      const apiVi = await apiProducts({ q: query, perPage: 50 });
      await openPage(page, `${BASE}/products?q=${encodeURIComponent(query)}`);
      await waitCards(page);
      const domVi = await titles(page);
      check(`B5 search "${query}" finds the 3 phones`, apiVi.total === 3 && domVi.length === 3,
        `dom=${domVi.length} api=${apiVi.total}`);
    }

    // ---------- C. Filters & sorting ----------
    // Reset search first: category change keeps ?q=, so we start from the full list.
    await openPage(page, BASE + '/products');
    await waitCards(page);
    check('C0 products page lists all categories', (await titles(page)).length === 8, (await titles(page)).length);
    await page.locator('aside button', { hasText: 'Điện thoại' }).first().click();
    await page.waitForURL(/category=dien-thoai/, { timeout: 15000 });
    await waitCards(page);
    const catTitles = await titles(page);
    const apiCat = await apiProducts({ category: 'dien-thoai', perPage: 50 });
    check('C1 category filter url', page.url().includes('category=dien-thoai'), page.url());
    check('C2 category filter list matches data (sorted newest)',
      JSON.stringify(catTitles) === JSON.stringify(apiCat.items.map((p) => p.name.trim())),
      JSON.stringify({ dom: catTitles, api: apiCat.items.map((p) => p.name) }));
    const pressed = await page.locator('aside button[aria-pressed="true"]').first().innerText();
    check('C3 active category is highlighted', pressed.includes('Điện thoại'), pressed.replace(/\s+/g, ' '));

    await page.getByLabel('Sắp xếp sản phẩm').selectOption('price-asc');
    await page.waitForURL(/sort=price-asc/, { timeout: 15000 });
    await waitCards(page);
    const ascTitles = await titles(page);
    const apiAsc = await apiProducts({ category: 'dien-thoai', sort: 'price-asc', perPage: 50 });
    check('C4 sort price-asc matches data',
      JSON.stringify(ascTitles) === JSON.stringify(apiAsc.items.map((p) => p.name.trim())),
      JSON.stringify({ dom: ascTitles, api: apiAsc.items.map((p) => p.name) }));
    check('C5 sort filter preserved in url', page.url().includes('sort=price-asc') && page.url().includes('category=dien-thoai'), page.url());

    await page.locator('aside button', { hasText: '≤ 10tr' }).first().click();
    await page.waitForURL(/maxPrice=10000000/, { timeout: 15000 });
    await waitCards(page);
    const priceTitles = await titles(page);
    const apiPrice = await apiProducts({ category: 'dien-thoai', sort: 'price-asc', maxPrice: 10000000, perPage: 50 });
    check('C6 max price filter matches data',
      JSON.stringify(priceTitles) === JSON.stringify(apiPrice.items.map((p) => p.name.trim())),
      JSON.stringify({ dom: priceTitles, api: apiPrice.items.map((p) => p.name) }));

    // brand filter (radio) — click it the way a user does
    await openPage(page, BASE + '/products');
    await waitCards(page);
    const brandNames = await page.$$eval('aside label', (els) =>
      els.filter((e) => e.querySelector('input[name="brand"]')).map((e) => e.textContent.trim()));
    let brandIndex = -1;
    let apiBrand = null;
    for (let i = 0; i < brandNames.length; i += 1) {
      const probe = await apiProducts({ brand: brandNames[i], perPage: 8 });
      if (probe.total > 0) { brandIndex = i; apiBrand = probe; break; }
    }
    check('C6b brand filter offers a brand with products', brandIndex >= 0, JSON.stringify(brandNames));
    if (brandIndex >= 0) {
      const brand = brandNames[brandIndex];
      await page.locator('aside input[name="brand"]').nth(brandIndex).click();
      await page.waitForURL(/brand=/, { timeout: 15000 });
      await waitCards(page);
      const brandTitles = await titles(page);
      check('C6c brand filter url', new URL(page.url()).searchParams.get('brand') === brand, page.url());
      check('C6d brand filter list matches data',
        JSON.stringify(brandTitles) === JSON.stringify(apiBrand.items.map((p) => p.name.trim())),
        JSON.stringify({ dom: brandTitles, api: apiBrand.items.map((p) => p.name) }));
      const checkedBrand = await page.locator('aside input[name="brand"]:checked').inputValue().catch(() => '');
      check('C6e brand radio shows checked state', checkedBrand === brand, checkedBrand);

      await page.locator('aside button', { hasText: 'Bỏ chọn thương hiệu' }).first().click();
      await page.waitForURL((u) => !u.searchParams.get('brand'), { timeout: 15000 });
      check('C6f unselect brand removes it from url', !new URL(page.url()).searchParams.get('brand'), page.url());
    }

    // price slider (range) — click on the track like a user
    await page.getByLabel('Giá tối đa').click({ position: { x: 40, y: 6 } });
    await page.waitForURL(/maxPrice=/, { timeout: 15000 });
    await waitCards(page);
    const sliderMax = new URL(page.url()).searchParams.get('maxPrice');
    const sliderTitles = await titles(page);
    const apiSlider = await apiProducts({ maxPrice: sliderMax, perPage: 8 });
    check('C6g price slider sets maxPrice in url', Boolean(sliderMax), page.url());
    check('C6h price slider list matches data',
      JSON.stringify(sliderTitles) === JSON.stringify(apiSlider.items.map((p) => p.name.trim())),
      JSON.stringify({ dom: sliderTitles, api: apiSlider.items.map((p) => p.name), sliderMax }));

    await page.locator('aside button', { hasText: 'Xoá hết' }).first().click();
    await page.waitForURL((u) => u.pathname === '/products' && !u.search, { timeout: 15000 });
    await waitCards(page);
    const allTitles = await titles(page);
    check('C7 clear filters resets to all products (page 1 of 8)', allTitles.length === 8, allTitles.length);

    // C9/C10: page/perPage phải được làm tròn xuống số nguyên.
    const decPerPage = await apiProducts({ perPage: 0.5 });
    check('C9 perPage=0.5 is floored to 1', Number.isInteger(decPerPage.perPage) && decPerPage.perPage === 1
      && decPerPage.items.length === 1 && decPerPage.totalPages === 16,
      JSON.stringify({ perPage: decPerPage.perPage, items: decPerPage.items.length, totalPages: decPerPage.totalPages }));
    const decPage = await apiProducts({ page: 1.5 });
    check('C10 page=1.5 is floored to page 1', decPage.page === 1, JSON.stringify({ page: decPage.page }));

    // C11: `maxPrice` rác / dưới mốc nhỏ nhất / lệch bước giá đều không được vỡ UI và nhãn phải khớp `input.value`.
    for (const badMax of ['abc', '100', '1234567']) {
      await openPage(page, `${BASE}/products?maxPrice=${badMax}`);
      await waitCards(page);
      const sliderState = await page.evaluate(() => {
        const range = document.querySelector('aside input[type="range"]');
        const label = Array.from(document.querySelectorAll('aside p')).map((p) => p.textContent.trim()).find((t) => t.startsWith('Dưới')) || '';
        return { value: range ? Number(range.value) : null, min: range ? Number(range.min) : null, max: range ? Number(range.max) : null, label };
      });
      check(`C11 maxPrice=${badMax} renders a real bound, not NaN`,
        !/NaN/.test(sliderState.label) && Number.isFinite(sliderState.value)
          && sliderState.value >= sliderState.min && sliderState.value <= sliderState.max,
        JSON.stringify(sliderState));
      check(`C11b maxPrice=${badMax} label matches the slider value`, digits(sliderState.label) === String(sliderState.value),
        JSON.stringify(sliderState));
    }
    await openPage(page, BASE + '/products');
    await waitCards(page);

    // pagination
    const page2 = await apiProducts({ page: 2 });
    if (page2.totalPages > 1) {
      await page.locator('nav[aria-label="Phân trang"] a', { hasText: 'Sau' }).first().click();
      await page.waitForURL(/page=2/, { timeout: 15000 });
      await waitCards(page);
      const p2Titles = await titles(page);
      check('C8 pagination page 2 matches data',
        JSON.stringify(p2Titles) === JSON.stringify(page2.items.map((p) => p.name.trim())),
        JSON.stringify({ dom: p2Titles, api: page2.items.map((p) => p.name) }));
    } else {
      check('C8 pagination present', false, 'totalPages=' + page2.totalPages);
    }

    // ---------- D. Product detail + add to cart ----------
    await openPage(page, BASE + '/products/dien-thoai-saigon-x9-pro');
    // Biến thể mặc định = biến thể còn hàng đầu tiên trong catalog (server chốt theo tồn kho thật).
    const p01Ssr = (await (await fetch(`${BASE}/api/products/dien-thoai-saigon-x9-pro`)).json()).product;
    const expectedDefaultVariant = (p01Ssr.variants.find((variant) => variant.stock > 0) || p01Ssr.variants[0]).id;
    // Bài dưới đặt 3 sản phẩm của biến thể mặc định. Chạy lại E2E trên cùng một file DB sẽ bào mòn tồn kho
    // (mỗi lần 3 chiếc) và tới lúc nút "+" bị khoá vì hết hàng; báo rõ thay vì timeout 30s khó hiểu.
    check('D0 database còn đủ tồn kho cho bài kiểm tra (mỗi lần chạy cần file DB mới)',
      Math.max(...p01Ssr.variants.map((variant) => variant.stock)) >= 3,
      JSON.stringify(p01Ssr.variants.map((variant) => `${variant.id}:${variant.stock}`)));
    // Next.js 16 streams the page shell first: the header shows up before the product body.
    // Wait for the quantity stepper so the assertions below read a fully rendered page.
    await page.waitForSelector('button[aria-label="Tăng số lượng"]', { timeout: 20000 });
    const detailBody = await page.locator('body').innerText();
    check('D1 detail heading', /Saigon X9 Pro 256GB/.test(detailBody), detailBody.split('\n').slice(0, 3).join(' / '));
    check('D2 detail shows sale price 18.990.000', detailBody.includes(vnd(18990000).replace(/\s/g, ' ')) || detailBody.includes('18.990.000'), vnd(18990000));
    check('D3 detail shows -13% badge', detailBody.includes('-13%'), null);
    check('D4 detail shows stock line', /Còn\s+\d+\s+sản phẩm/.test(detailBody), null);
    await page.locator('button[aria-label="Tăng số lượng"]').first().click();
    await page.locator('button[aria-label="Tăng số lượng"]').first().click();
    const stepperValue = (await page.locator('button[aria-label="Giảm số lượng"]').first().locator('xpath=following-sibling::span[1]').innerText()).trim();
    check('D5 quantity stepper works', stepperValue === '3', stepperValue);
    await page.getByRole('button', { name: 'Thêm vào giỏ hàng' }).click();
    await page.waitForFunction(() => document.querySelector('header a[aria-label^="Giỏ hàng"]').getAttribute('aria-label').includes('3'), null, { timeout: 10000 })
      .catch(() => {});
    const badge = await page.locator('header a[aria-label^="Giỏ hàng"]').getAttribute('aria-label');
    check('D6 header cart badge counts 3', badge.includes('3'), badge);
    const st1 = await cartState(page);
    check('D7 cart stores productId + variantId + quantity only',
      st1.length === 1 && st1[0].productId === 'p01' && st1[0].quantity === 3
        && st1[0].variantId === expectedDefaultVariant
        && Object.keys(st1[0]).sort().join(',') === 'productId,quantity,variantId',
      JSON.stringify({ cart: st1, expectedDefaultVariant }));

    // ---------- E. Cart page ----------
    await page.locator('header a[aria-label^="Giỏ hàng"]').click();
    await page.waitForURL(/\/cart$/, { timeout: 15000 });
    await page.waitForSelector('li span[aria-live="polite"]', { timeout: 15000 });
    const qty3 = (await page.locator('li span[aria-live="polite"]').first().innerText()).trim();
    check('E1 cart line quantity 3', qty3 === '3', qty3);
    const sub3 = await totalRow(page, 'Tạm tính');
    check('E2 subtotal = 3 x 18.990.000', digits(sub3) === '56970000', sub3);
    const disc3 = await totalRow(page, 'Giảm giá đơn lớn');
    check('E3 bulk discount 10%', digits(disc3) === '5697000', disc3);
    const ship3 = await totalRow(page, 'Phí vận chuyển');
    check('E4 free shipping applied', ship3 === 'Miễn phí', ship3);
    const tot3 = await totalRow(page, 'Tổng cộng');
    check('E5 total = 51.273.000', digits(tot3) === '51273000', tot3);

    await page.locator('button[aria-label="Giảm số lượng"]').first().click();
    await page.waitForFunction(() => {
      const el = document.querySelector('li span[aria-live="polite"]');
      return el && el.textContent.trim() === '2';
    }, null, { timeout: 10000 });
    const sub2 = await totalRow(page, 'Tạm tính');
    const tot2 = await totalRow(page, 'Tổng cộng');
    check('E6 decreasing quantity updates totals',
      digits(sub2) === '37980000' && digits(tot2) === '34182000', JSON.stringify({ sub2, tot2 }));

    // add a second product from the grid
    await page.getByRole('link', { name: 'Tiếp tục mua sắm' }).first().click();
    await page.waitForURL(/\/products/, { timeout: 15000 });
    await waitCards(page);
    const firstCardTitle = (await page.locator('article h3').first().innerText()).trim();
    await page.locator('article button', { hasText: 'Thêm vào giỏ' }).first().click();
    await page.waitForFunction(() => {
      const a = document.querySelector('header a[aria-label^="Giỏ hàng"]');
      return a && a.getAttribute('aria-label').includes('3');
    }, null, { timeout: 10000 }).catch(() => {});
    const badge2 = await page.locator('header a[aria-label^="Giỏ hàng"]').getAttribute('aria-label');
    check('E7 adding from grid updates badge', badge2.includes('3'), badge2 + ' | ' + firstCardTitle);

    await page.locator('header a[aria-label^="Giỏ hàng"]').click();
    await page.waitForURL(/\/cart$/, { timeout: 15000 });
    await page.waitForSelector('li span[aria-live="polite"]', { timeout: 15000 });
    const lines2 = await page.locator('ul li a[href^="/products/"]').count();
    check('E8 cart has 2 different products', lines2 === 2, lines2);
    await page.locator('li button[aria-label^="Xoá"]').last().click();
    await page.waitForFunction(() => document.querySelectorAll('li span[aria-live="polite"]').length === 1, null, { timeout: 10000 });
    check('E9 removing a line leaves 1 product', true, null);
    const st2 = await cartState(page);
    check('E10 remaining cart line is p01 x2 (variantId, no price/name from localStorage)',
      st2.length === 1 && st2[0].productId === 'p01' && st2[0].quantity === 2
        && st2[0].variantId === expectedDefaultVariant && st2[0].price === undefined && st2[0].name === undefined,
      JSON.stringify(st2));
    const subAfter = await totalRow(page, 'Tạm tính');
    check('E11 totals recomputed after removal', digits(subAfter) === '37980000', subAfter);

    // reload keeps cart (persistence)
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitHydrated(page);
    await page.waitForSelector('li span[aria-live="polite"]', { timeout: 15000 });
    const qtyAfterReload = (await page.locator('li span[aria-live="polite"]').first().innerText()).trim();
    check('E12 cart survives reload', qtyAfterReload === '2', qtyAfterReload);

    // ---------- F. Checkout ----------
    await page.getByRole('link', { name: 'Tiến hành đặt hàng' }).click();
    await page.waitForURL(/\/checkout$/, { timeout: 15000 });
    await page.waitForSelector('button[type="submit"]', { timeout: 15000 });
    await page.getByRole('button', { name: 'Đặt hàng' }).click();
    await page.waitForTimeout(400);
    const errText = await page.locator('body').innerText();
    check('F1 empty submit blocked with name error', /Vui lòng nhập họ tên/.test(errText), null);
    check('F2 phone error shown', /Số điện thoại phải bắt đầu bằng 0/.test(errText), null);
    check('F3 address error shown', /Địa chỉ cần chi tiết hơn/.test(errText), null);
    check('F4 still on checkout page', page.url().endsWith('/checkout'), page.url());

    await page.fill('#name', 'Nguyễn Văn Test');
    await page.fill('#phone', '0912345678');
    await page.fill('#email', 'test@shopha.demo');
    await page.fill('#address', '123 Nguyễn Huệ, Quận 1, TP. HCM');
    await page.fill('#note', 'Giao ngoài giờ hành chính');
    await page.getByRole('radio').nth(2).check();
    const subtotalBefore = await totalRow(page, 'Tạm tính');
    check('F5 checkout summary shows cart subtotal', digits(subtotalBefore) === '37980000', subtotalBefore);
    await page.getByRole('button', { name: 'Đặt hàng' }).click();
    await page.waitForURL(/\/checkout\/success\?orderId=/, { timeout: 20000 });
    await page.waitForSelector('text=Đặt hàng thành công', { timeout: 15000 });
    await page.waitForSelector('text=Mã đơn', { timeout: 15000 });
    await page.waitForSelector('text=Giao tới', { timeout: 15000 });
    const successBody = await page.locator('body').innerText();
    const codeMatch = successBody.match(/Mã đơn\s*:?\s*(HA-[A-Z0-9]+)/);
    const orderCode = codeMatch ? codeMatch[1].trim() : null;
    check('F6 success page shown with order code', Boolean(orderCode), JSON.stringify(successBody.split('\n').slice(0, 14)).slice(0, 300));
    check('F7 success page shows payment method', /Momo|Ví điện tử/.test(successBody), null);
    check('F8 success page shows delivery info', /Nguyễn Văn Test/.test(successBody) && /0912345678/.test(successBody) && /Giao ngoài giờ hành chính/.test(successBody), null);
    const succSub = await totalRow(page, 'Tạm tính');
    const succDisc = await totalRow(page, 'Giảm giá');
    check('F9 success page shows subtotal + discount rows',
      digits(succSub) === '37980000' && digits(succDisc) === '3798000', JSON.stringify({ succSub, succDisc }));
    const succTotal = await totalRow(page, 'Tổng cộng');
    check('F10 success total = 34.182.000', digits(succTotal) === '34182000', succTotal);
    const badgeAfterOrder = await page.locator('header a[aria-label^="Giỏ hàng"]').getAttribute('aria-label');
    check('F11 cart cleared after order', badgeAfterOrder.trim() === 'Giỏ hàng', badgeAfterOrder);

    // order detail via API cross-check
    const orderId = new URL(page.url()).searchParams.get('orderId');
    const orderApi = await (await fetch(`${BASE}/api/orders/${orderId}?phone=0912345678`)).json();
    check('F12 order API total matches UI',
      orderApi.total === 34182000 && orderApi.subtotal === 37980000 && orderApi.discount === 3798000 && orderApi.shippingFee === 0,
      JSON.stringify({ subtotal: orderApi.subtotal, discount: orderApi.discount, shipping: orderApi.shippingFee, total: orderApi.total }));
    check('F13 order API stores customer + momo', orderApi.customer.paymentMethod === 'momo' && orderApi.customer.phone === '0912345678', JSON.stringify(orderApi.customer));
    check('F14 order API items', orderApi.items.length === 1 && orderApi.items[0].quantity === 2 && orderApi.items[0].productId === 'p01', JSON.stringify(orderApi.items));
    const orderNoPhone = await fetch(`${BASE}/api/orders/${orderId}`);
    check('F15 order detail without phone is refused', orderNoPhone.status === 404, orderNoPhone.status);

    // ---------- G. Order lookup by phone (no public dump of other customers) ----------
    await page.getByRole('link', { name: 'Đơn hàng' }).first().click();
    await page.waitForURL(/\/orders$/, { timeout: 15000 });
    await page.waitForSelector('#lookup-phone', { timeout: 15000 });
    const ordersBefore = await page.locator('body').innerText();
    check('G1 orders page shows nothing before a lookup',
      !ordersBefore.includes('Nguyễn Văn Test') && !ordersBefore.includes('0912345678'), ordersBefore.replace(/\n+/g, ' | ').slice(0, 120));

    await page.fill('#lookup-phone', '0900000000');
    await page.getByRole('button', { name: /Tra cứu/ }).click();
    await page.waitForSelector('text=Không tìm thấy đơn hàng nào', { timeout: 15000 });
    check('G2 another phone shows no orders', !(await page.locator('body').innerText()).includes(orderCode || 'HA-'), null);

    await page.fill('#lookup-phone', '0912345678');
    await page.getByRole('button', { name: /Tra cứu/ }).click();
    await page.waitForSelector(`text=${orderCode}`, { timeout: 15000 });
    const ordersBody = await page.locator('body').innerText();
    check('G3 own phone lists the order', ordersBody.includes('34.182.000'), null);
    check('G4 order card shows the status label', /Chờ xác nhận/.test(ordersBody), null);
    const noPhoneStatus = (await fetch(`${BASE}/api/orders`)).status;
    check('G5 orders API without phone is refused', noPhoneStatus === 400, noPhoneStatus);
    const ordersApi = await (await fetch(`${BASE}/api/orders?phone=0912345678`)).json();
    check('G6 orders API only returns orders of that phone',
      ordersApi.orders.length >= 1 && ordersApi.orders.every((o) => o.customer.phone === '0912345678'),
      ordersApi.orders.length);

    // ---------- H. Empty states & 404 ----------
    await openPage(page, BASE + '/cart');
    await page.waitForSelector('text=Giỏ hàng đang trống', { timeout: 15000 });
    check('H1 empty cart state', true, null);
    await openPage(page, BASE + '/checkout');
    await page.waitForSelector('text=Chưa có sản phẩm để đặt', { timeout: 15000 });
    check('H2 checkout blocked when cart empty', true, null);
    const nf = await openPage(page, BASE + '/products/khong-ton-tai');
    check('H3 unknown product returns 404', nf.status() === 404, nf.status());
    check('H4 not-found copy renders', /Không tìm thấy trang/.test(await page.locator('body').innerText()), null);
    const nfApi = await (await fetch(BASE + '/api/products/khong-ton-tai')).status;
    check('H5 unknown product API returns 404', nfApi === 404, nfApi);

    // ---------- I. Mobile layout ----------
    await page.setViewportSize({ width: 390, height: 844 });
    await openPage(page, BASE + '/');
    await waitCards(page);
    const overflowHome = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check('I1 no horizontal overflow on home (390px)', overflowHome <= 1, overflowHome);
    await openPage(page, BASE + '/products');
    await waitCards(page);
    const overflowProducts = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check('I2 no horizontal overflow on products (390px)', overflowProducts <= 1, overflowProducts);
    await openPage(page, BASE + '/products/dien-thoai-saigon-x9-pro');
    const overflowDetail = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check('I3 no horizontal overflow on detail (390px)', overflowDetail <= 1, overflowDetail);

    // Card action buttons: label must stay on one line and inside the card, also on the narrow
    // 4-column layout (1280px+) where "Thêm vào giỏ" + "Chi tiết" do not fit side by side.
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, BASE + '/products');
    await waitCards(page);
    const cardActions = await page.evaluate(() => {
      const card = document.querySelector('article');
      // Thẻ giờ có thêm nút trái tim/so sánh ở ảnh nên phải chọn đúng nút "Thêm vào giỏ".
      const buttons = Array.from(card.querySelectorAll('button'));
      const btn = buttons.find((b) => b.textContent.includes('Thêm vào giỏ')) || buttons.at(-1);
      const detail = Array.from(card.querySelectorAll('a')).find((a) => a.textContent.trim() === 'Chi tiết');
      if (!btn || !detail) return { missing: true };
      const label = Array.from(btn.childNodes).find((n) => n.nodeType === 3 && n.textContent.trim());
      const range = document.createRange();
      range.selectNode(label);
      const cardRect = card.getBoundingClientRect();
      const boxes = [btn, detail].map((el) => el.getBoundingClientRect());
      return {
        labelLines: range.getClientRects().length,
        overflowsBox: btn.scrollHeight > btn.clientHeight || btn.scrollWidth > btn.clientWidth,
        spill: Math.max(...boxes.map((b) => b.bottom - cardRect.bottom), ...boxes.map((b) => b.right - cardRect.right)),
        widestButton: Math.max(...boxes.map((b) => b.width)),
        cardWidth: cardRect.width,
      };
    });
    check('I4 card button label stays on one line (1440px)', cardActions.labelLines === 1, cardActions.labelLines);
    check(
      'I5 card buttons fit inside the card (1440px)',
      !cardActions.overflowsBox && cardActions.spill <= 1 && cardActions.widestButton <= cardActions.cardWidth,
      JSON.stringify(cardActions),
    );

    // ---------- K. Cart integrity: sửa localStorage không đổi được giá/số lượng ----------
    await page.setViewportSize({ width: 1366, height: 900 });
    await openPage(page, BASE + '/cart');
    await page.evaluate(() => {
      localStorage.setItem('shop-ha-cart', JSON.stringify({
        state: {
          items: [{
            productId: 'p01', slug: 'hang-gia', name: 'Hàng giả', price: 1000000,
            emoji: '📱', tone: 'from-sky-200 to-indigo-300', quantity: 200,
          }],
        },
        version: 1,
      }));
    });
    await openPage(page, BASE + '/cart');
    await page.waitForSelector('li span[aria-live="polite"]', { timeout: 15000 });
    const tamperedLine = (await page.locator('li').first().innerText()).replace(/\n+/g, ' | ');
    const tamperedQty = (await page.locator('li span[aria-live="polite"]').first().innerText()).trim();
    const tamperedSub = await totalRow(page, 'Tạm tính');
    const tamperedStockHint = (tamperedLine.match(/(\d+)\s+sản phẩm trong kho/) || [])[1] || null;
    check('K1 quantity is clamped to the stock of the resolved variant (200 -> catalog stock)',
      Number(tamperedQty) > 0 && Number(tamperedQty) < 200 && Number(tamperedQty) === Number(tamperedStockHint),
      JSON.stringify({ tamperedQty, tamperedStockHint }));
    check('K2 cart shows the catalog product, not the localStorage name/price',
      tamperedLine.includes('Saigon X9 Pro 256GB') && !tamperedLine.includes('Hàng giả') && !tamperedLine.includes('1.000.000'),
      tamperedLine.slice(0, 160));
    check('K3 subtotal uses the catalog price x clamped quantity',
      digits(tamperedSub) === String(Number(tamperedQty) * 18990000), JSON.stringify({ tamperedQty, tamperedSub }));
    check('K4 stepper is disabled at the stock limit',
      await page.locator('li button[aria-label="Tăng số lượng"]').first().isDisabled(), null);
    const tamperedStored = await cartState(page);
    check('K5 store rewrites localStorage with the migrated variant + clamped quantity',
      tamperedStored.length === 1
        && Object.keys(tamperedStored[0]).sort().join(',') === 'productId,quantity,variantId'
        && tamperedStored[0].variantId === 'p01-den-256gb'
        && tamperedStored[0].quantity === Number(tamperedQty),
      JSON.stringify(tamperedStored));
    await page.evaluate(() => localStorage.removeItem('shop-ha-cart'));

    // ---------- L. Mobile 390px: ô tìm kiếm + bộ lọc thu gọn ----------
    await page.setViewportSize({ width: 390, height: 844 });
    await openPage(page, BASE + '/');
    await waitCards(page);
    const visibleSearch = await page.locator('form[role="search"] input[name="q"]:visible').count();
    check('L1 mobile shows a search box', visibleSearch >= 1, visibleSearch);
    await page.locator('form[role="search"] input[name="q"]:visible').first().fill('tai nghe');
    await page.locator('form[role="search"] input[name="q"]:visible').first().press('Enter');
    await page.waitForURL(/q=tai/, { timeout: 15000 });
    await waitCards(page);
    const mobileTitles = await titles(page);
    const apiMobile = await apiProducts({ q: 'tai nghe', perPage: 50 });
    check('L2 mobile search returns the same list as the API',
      mobileTitles.length > 0 && JSON.stringify(mobileTitles) === JSON.stringify(apiMobile.items.map((p) => p.name.trim())),
      JSON.stringify({ dom: mobileTitles, api: apiMobile.items.map((p) => p.name) }));

    await openPage(page, BASE + '/products');
    await waitCards(page);
    check('L3 filter panel starts collapsed on mobile',
      (await page.locator('aside input[type="range"]:visible').count()) === 0, null);
    const firstCardBox = await page.locator('article').first().boundingBox();
    check('L4 products start within the first screen on mobile', firstCardBox.y < 700, Math.round(firstCardBox.y));
    await page.locator('aside button[aria-expanded]').first().click();
    await page.waitForSelector('aside input[type="range"]:visible', { timeout: 10000 });
    check('L5 "Mở lọc" reveals the filters', true, null);
    await page.locator('aside button', { hasText: 'Laptop' }).first().click();
    await page.waitForURL(/category=laptop/, { timeout: 15000 });
    await waitCards(page);
    check('L6 category filter still works on mobile',
      new URL(page.url()).searchParams.get('category') === 'laptop', page.url());

    // ---------- M. Trừ tồn kho theo biến thể khi tạo đơn ----------
    // Chọn biến thể còn hàng ít nhất (đọc từ API) để chạy lại được trên server đang giữ trạng thái.
    const stockList = (await (await fetch(`${BASE}/api/products?perPage=50`)).json()).items;
    const candidates = stockList.flatMap((item) => item.variants.map((variant) => ({ product: item, variant })));
    const target = candidates.filter((entry) => entry.variant.stock > 0).sort((a, b) => a.variant.stock - b.variant.stock)[0];
    check('M0 there is a variant left in stock to order', Boolean(target),
      JSON.stringify(stockList.map((item) => `${item.id}:${item.stock}`)));
    const stockBefore = target ? target.variant.stock : 0;
    const orderPayload = (quantity) => JSON.stringify({
      items: target ? [{ productId: target.product.id, variantId: target.variant.id, quantity }] : [],
      customer: { name: 'Trần Kho', phone: '0987654321', email: '', address: '456 Lê Lợi, Quận 3, TP. HCM', paymentMethod: 'cod' },
    });
    const firstOrder = await fetch(`${BASE}/api/orders`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: orderPayload(stockBefore),
    });
    check('M1 order for the whole stock of one variant is accepted', firstOrder.status === 201, firstOrder.status);
    const productAfter = (await (await fetch(`${BASE}/api/products/${target.product.slug}`)).json()).product;
    const variantAfter = productAfter.variants.find((variant) => variant.id === target.variant.id);
    check('M2 that variant is at 0 and the product total drops by the ordered quantity',
      stockBefore > 0 && variantAfter.stock === 0 && productAfter.stock === target.product.stock - stockBefore,
      JSON.stringify({ variant: target.variant.id, stockBefore, variantAfter: variantAfter.stock }));
    const secondOrder = await fetch(`${BASE}/api/orders`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: orderPayload(1),
    });
    const secondBody = await secondOrder.json();
    check('M3 second order is rejected with 409', secondOrder.status === 409, secondOrder.status);
    check('M3b 409 message names the remaining stock', /chỉ còn 0 sản phẩm/.test(secondBody.message || ''), secondBody.message);

    const fallback = stockList.find((item) => item.stock > 0 && item.variants.some((variant) => variant.stock > 0));
    const fallbackVariant = fallback ? fallback.variants.find((variant) => variant.stock > 0) : null;
    const fallbackOrder = await fetch(`${BASE}/api/orders`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ productId: fallback ? fallback.id : 'p01', quantity: 1 }],
        customer: { name: 'Trần Kho', phone: '0987654321', email: '', address: '456 Lê Lợi, Quận 3, TP. HCM', paymentMethod: 'cod' },
      }),
    });
    const fallbackOrderBody = await fallbackOrder.json();
    check('M4 a line without variantId falls back to the first in-stock variant',
      Boolean(fallback) && fallbackOrder.status === 201 && fallbackOrderBody.items[0].variantId === fallbackVariant.id
        && Boolean(fallbackOrderBody.items[0].variantLabel),
      JSON.stringify({ status: fallbackOrder.status, item: fallbackOrderBody.items && fallbackOrderBody.items[0] }));

    // ---------- N. Không lộ đơn của người khác ----------
    const nakedSuccess = await openPage(page, `${BASE}/checkout/success?orderId=${orderId}`);
    const nakedBody = await page.locator('body').innerText();
    check('N1 success page without phone does not reveal the order',
      nakedSuccess.status() === 200 && /Chưa tra được đơn hàng/.test(nakedBody) && !/0912345678/.test(nakedBody),
      nakedBody.replace(/\n+/g, ' | ').slice(0, 160));
    const wrongPhone = await (await fetch(`${BASE}/api/orders/${orderId}?phone=0900000000`)).status;
    check('N2 order detail API rejects a wrong phone', wrongPhone === 404, wrongPhone);
    await page.setViewportSize({ width: 1366, height: 900 });

    // ---------- O. SEO: sitemap, robots, JSON-LD, ảnh OG ----------
    const sitemapRes = await fetch(`${BASE}/sitemap.xml`);
    const sitemapXml = await sitemapRes.text();
    const sitemapCount = (sitemapXml.match(/<url>/g) || []).length;
    check('O1 sitemap lists product + category URLs from the catalog',
      sitemapRes.status === 200 && sitemapXml.includes('/products/dien-thoai-saigon-x9-pro')
        && sitemapXml.includes('/products?category=dien-thoai') && sitemapCount >= 20,
      sitemapCount);

    const robotsRes = await fetch(`${BASE}/robots.txt`);
    const robotsTxt = await robotsRes.text();
    check('O2 robots points at the sitemap and keeps /api/ out of the index',
      robotsRes.status === 200 && /Sitemap:\s*https?:\/\/\S+\/sitemap\.xml/.test(robotsTxt) && /Disallow:\s*\/api\//.test(robotsTxt),
      robotsTxt.replace(/\n/g, ' | ').slice(0, 160));

    await openPage(page, BASE + '/products/dien-thoai-saigon-x9-pro');
    // JSON-LD là thẻ <script> nên không "visible" — chỉ cần có trong DOM.
    await page.waitForSelector('#product-json-ld', { state: 'attached', timeout: 20000 });
    const productLd = JSON.parse(await page.locator('#product-json-ld').textContent());
    const breadcrumbLd = JSON.parse(await page.locator('#breadcrumb-json-ld').textContent());
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    const ogImageMeta = await page.locator('meta[property="og:image"]').getAttribute('content');
    check('O3 Product JSON-LD has name, price and availability',
      productLd['@type'] === 'Product' && productLd.name === 'Saigon X9 Pro 256GB'
        && productLd.offers.price === 18990000 && productLd.offers.priceCurrency === 'VND'
        && productLd.offers.availability.endsWith('InStock') && productLd.sku === 'p01',
      JSON.stringify({ name: productLd.name, offers: productLd.offers }));
    check('O4 Product JSON-LD carries rating + variants',
      productLd.aggregateRating.reviewCount === 214 && productLd.aggregateRating.ratingValue === 4.8
        && productLd.hasVariant.length === 2 && productLd.hasVariant[0].sku === 'p01-den-256gb',
      JSON.stringify({ rating: productLd.aggregateRating, variants: productLd.hasVariant.map((v) => v.sku) }));
    check('O5 Breadcrumb JSON-LD has 4 levels ending at the product',
      breadcrumbLd['@type'] === 'BreadcrumbList' && breadcrumbLd.itemListElement.length === 4
        && breadcrumbLd.itemListElement[0].name === 'Trang chủ'
        && breadcrumbLd.itemListElement[3].name === 'Saigon X9 Pro 256GB'
        && breadcrumbLd.itemListElement[3].item.endsWith('/products/dien-thoai-saigon-x9-pro'),
      JSON.stringify(breadcrumbLd.itemListElement.map((item) => item.name)));
    check('O6 canonical + og:image point at the product page',
      canonical.endsWith('/products/dien-thoai-saigon-x9-pro') && ogImageMeta.endsWith('/products/dien-thoai-saigon-x9-pro/opengraph-image'),
      JSON.stringify({ canonical, ogImageMeta }));

    const ogRes = await fetch(`${BASE}/products/dien-thoai-saigon-x9-pro/opengraph-image`);
    const ogBuffer = Buffer.from(await ogRes.arrayBuffer());
    check('O7 OG image is served as a real PNG',
      ogRes.status === 200 && ogRes.headers.get('content-type') === 'image/png'
        && ogBuffer.length > 5000 && ogBuffer.subarray(1, 4).toString() === 'PNG',
      `${ogRes.status} ${ogRes.headers.get('content-type')} ${ogBuffer.length}`);

    // ---------- P. Voucher: server tính mức giảm, mã không hợp lệ bị từ chối ----------
    const voucherApi = async (body) => {
      const res = await fetch(`${BASE}/api/vouchers`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      return { status: res.status, body: await res.json() };
    };
    const p01Line = [{ productId: 'p01', variantId: 'p01-den-256gb', quantity: 1 }];
    const saleVoucher = await voucherApi({ code: 'sale10', items: p01Line });
    check('P1 SALE10 is accepted (case-insensitive) and capped at 500.000',
      saleVoucher.status === 200 && saleVoucher.body.ok && saleVoucher.body.discount === 500000,
      JSON.stringify(saleVoucher.body));
    const amountVoucher = await voucherApi({ code: 'HA100K', items: p01Line });
    check('P2 HA100K gives a flat 100.000', amountVoucher.status === 200 && amountVoucher.body.discount === 100000,
      JSON.stringify(amountVoucher.body));
    const unknownVoucher = await voucherApi({ code: 'KHONGCOTOI', items: p01Line });
    check('P3 unknown code is refused with a Vietnamese message',
      unknownVoucher.status === 422 && /không tồn tại/.test(unknownVoucher.body.message),
      JSON.stringify(unknownVoucher.body));
    const smallCart = await voucherApi({ code: 'VIP20', items: [{ productId: 'p15', variantId: 'p15-trang-1.5m', quantity: 1 }] });
    check('P4 min-subtotal code is refused on a small cart',
      smallCart.status === 422 && /từ/.test(smallCart.body.message), JSON.stringify(smallCart.body));
    const shippingVoucher = await voucherApi({ code: 'FREESHIP', items: [{ productId: 'p15', variantId: 'p15-trang-1.5m', quantity: 1 }] });
    check('P5 FREESHIP equals the shipping fee of a small order',
      shippingVoucher.status === 200 && shippingVoucher.body.discount === 30000, JSON.stringify(shippingVoucher.body));
    const fakePrice = await voucherApi({
      code: 'SALE10',
      items: [{ productId: 'p01', variantId: 'p01-den-256gb', quantity: 1, price: 1000 }],
    });
    check('P6 a price sent from the client is ignored (server uses the catalog)',
      fakePrice.status === 200 && fakePrice.body.discount === 500000, JSON.stringify(fakePrice.body));

    // Áp mã trong giỏ hàng thật: thêm p01 (biến thể mặc định) rồi nhập SALE10.
    await openPage(page, BASE + '/products/dien-thoai-saigon-x9-pro');
    await page.waitForSelector('button[aria-label="Tăng số lượng"]', { timeout: 20000 });
    await page.getByRole('button', { name: 'Thêm vào giỏ hàng' }).click();
    await openPage(page, BASE + '/cart');
    await page.waitForSelector('#voucher-code', { timeout: 15000 });
    await page.fill('#voucher-code', 'SALE10');
    await page.getByRole('button', { name: 'Áp dụng' }).click();
    await page.waitForSelector('text=Đã áp dụng SALE10', { timeout: 15000 });
    const voucherRow = await totalRow(page, 'Mã giảm giá SALE10');
    const totalWithVoucher = await totalRow(page, 'Tổng cộng');
    check('P7 the cart shows the voucher row and the new total',
      digits(voucherRow) === '500000' && digits(totalWithVoucher) === '16591000',
      JSON.stringify({ voucherRow, totalWithVoucher }));

    await page.getByRole('link', { name: 'Tiến hành đặt hàng' }).click();
    await page.waitForURL(/\/checkout$/, { timeout: 15000 });
    await page.fill('#name', 'Nguyễn Văn Test');
    await page.fill('#phone', '0912345678');
    await page.fill('#email', 'test@shopha.demo');
    await page.fill('#address', '123 Nguyễn Huệ, Quận 1, TP. HCM');
    await page.waitForSelector('text=Mã giảm giá SALE10', { timeout: 15000 });
    await page.getByRole('button', { name: 'Đặt hàng' }).click();
    await page.waitForURL(/\/checkout\/success\?orderId=/, { timeout: 20000 });
    await page.waitForSelector('text=Đặt hàng thành công', { timeout: 15000 });
    const voucherOrderId = new URL(page.url()).searchParams.get('orderId');
    const voucherOrder = await (await fetch(`${BASE}/api/orders/${voucherOrderId}?phone=0912345678`)).json();
    check('P8 the order stores the voucher and keeps bulk + voucher discounts separate',
      voucherOrder.voucherCode === 'SALE10' && voucherOrder.voucherDiscount === 500000
        && voucherOrder.bulkDiscount === 1899000 && voucherOrder.discount === 2399000 && voucherOrder.total === 16591000,
      JSON.stringify({ voucherCode: voucherOrder.voucherCode, voucherDiscount: voucherOrder.voucherDiscount, bulk: voucherOrder.bulkDiscount, total: voucherOrder.total }));
    check('P9 the success page shows the voucher row',
      digits(await totalRow(page, 'Mã giảm giá SALE10')) === '500000', null);

    // ---------- Q. Đánh giá sản phẩm: validate bằng zod, lưu thật, hiện trên trang ----------
    const reviewSlug = 'dien-thoai-saigon-x9-pro';
    const reviewAuthor = `QA ${Date.now()}`;
    const reviewPost = (body) => fetch(`${BASE}/api/products/${reviewSlug}/reviews`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const badReview = await reviewPost({ author: 'X', rating: 9, body: 'ngắn' });
    const badReviewBody = await badReview.json();
    check('Q1 an invalid review is refused with a Vietnamese message',
      badReview.status === 422 && /ít nhất|từ 1 đến 5/.test(badReviewBody.message || ''), JSON.stringify(badReviewBody));
    const goodReview = await reviewPost({ author: reviewAuthor, rating: 5, title: 'Đúng mô tả', body: 'Đóng gói kỹ, máy chạy êm sau một tuần dùng thử.' });
    const goodReviewBody = await goodReview.json();
    check('Q2 a valid review is stored and folded into the summary',
      goodReview.status === 201 && goodReviewBody.review.author === reviewAuthor
        && goodReviewBody.summary.count >= 215 && goodReviewBody.summary.stored >= 1 && goodReviewBody.summary.average > 4,
      JSON.stringify(goodReviewBody.summary));
    const dupReview = await reviewPost({ author: reviewAuthor.toUpperCase(), rating: 4, body: 'Gửi lại lần hai với cùng tên để kiểm tra chặn trùng.' });
    check('Q3 the same author cannot review one product twice', dupReview.status === 409, dupReview.status);
    const missingProductReview = await fetch(`${BASE}/api/products/khong-ton-tai/reviews`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author: 'QA 2', rating: 5, body: 'Sản phẩm này không tồn tại trong catalog.' }),
    });
    check('Q4 reviews of an unknown product return 404', missingProductReview.status === 404, missingProductReview.status);

    await openPage(page, `${BASE}/products/${reviewSlug}`);
    await page.waitForSelector('#danh-gia', { state: 'attached', timeout: 20000 });
    await page.waitForSelector(`text=${reviewAuthor}`, { timeout: 15000 });
    check('Q5 the stored review shows up in the product page section', true, null);
    const uiReviewAuthor = `UI ${Date.now()}`;
    await page.fill('#review-author', uiReviewAuthor);
    await page.getByRole('radio', { name: '4 sao' }).click();
    await page.fill('#review-body', 'Hàng đúng mô tả, giao nhanh, sẽ mua thêm phụ kiện cho máy.');
    await page.getByRole('button', { name: 'Gửi đánh giá' }).click();
    await page.waitForSelector('text=Cảm ơn bạn đã đánh giá sản phẩm!', { timeout: 15000 });
    check('Q6 the form posts a review and shows it without a reload',
      (await page.locator('body').innerText()).includes(uiReviewAuthor), uiReviewAuthor);

    // ---------- R. Trạng thái đơn: PATCH có kiểm tra chủ đơn + đọc lại từ store ----------
    const patchStatus = (id, body) => fetch(`${BASE}/api/orders/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const skipStep = await patchStatus(orderId, { phone: '0912345678', status: 'done' });
    check('R1 skipping a status step is refused with 409', skipStep.status === 409, skipStep.status);
    const confirmStep = await patchStatus(orderId, { phone: '0912345678', status: 'confirmed' });
    const confirmBody = await confirmStep.json();
    check('R2 PATCH moves the order pending -> confirmed',
      confirmStep.status === 200 && confirmBody.status === 'confirmed' && confirmBody.updatedAt !== confirmBody.createdAt,
      JSON.stringify({ status: confirmBody.status, updatedAt: confirmBody.updatedAt }));
    const rereadOrder = await (await fetch(`${BASE}/api/orders/${orderId}?phone=0912345678`)).json();
    check('R3 the new status is read back after a fresh request', rereadOrder.status === 'confirmed',
      rereadOrder.status);
    const wrongPhonePatch = await patchStatus(orderId, { phone: '0900000000', status: 'shipping' });
    check('R4 another phone cannot change the status', wrongPhonePatch.status === 404, wrongPhonePatch.status);
    const badStatus = await patchStatus(orderId, { phone: '0912345678', status: 'đang-giao' });
    check('R5 an unknown status value is refused with 422', badStatus.status === 422, badStatus.status);

    await openPage(page, BASE + '/orders');
    await page.waitForSelector('#lookup-phone', { timeout: 15000 });
    await page.fill('#lookup-phone', '0912345678');
    await page.getByRole('button', { name: /Tra cứu/ }).click();
    await page.waitForSelector(`text=${orderCode}`, { timeout: 15000 });
    await page.getByRole('button', { name: /Chuyển sang "Đang giao"/ }).first().click();
    await page.waitForSelector(`text=Đang giao`, { timeout: 15000 });
    const afterUiPatch = await (await fetch(`${BASE}/api/orders/${orderId}?phone=0912345678`)).json();
    check('R6 the status button in the lookup page updates the order',
      afterUiPatch.status === 'shipping' && afterUiPatch.updatedAt !== afterUiPatch.createdAt,
      JSON.stringify({ status: afterUiPatch.status, updatedAt: afterUiPatch.updatedAt }));

    // ---------- S. Biến thể: chọn phân loại, giỏ tách dòng theo biến thể ----------
    const p01Api = (await (await fetch(`${BASE}/api/products/dien-thoai-saigon-x9-pro`)).json()).product;
    check('S1 API exposes variants and the product stock equals their sum',
      p01Api.variants.length === 2 && p01Api.variants.every((variant) => typeof variant.id === 'string' && variant.stock >= 0)
        && p01Api.stock === p01Api.variants.reduce((sum, variant) => sum + variant.stock, 0),
      JSON.stringify(p01Api.variants));
    const inStockVariants = p01Api.variants.filter((variant) => variant.stock > 0);
    const firstPick = inStockVariants[0] || p01Api.variants[0];
    const secondPick = inStockVariants.find((variant) => variant.id !== firstPick.id);
    check('S1b both variants are still in stock (chạy suite trên DB mới)',
      inStockVariants.length === 2, JSON.stringify(p01Api.variants.map((variant) => `${variant.id}:${variant.stock}`)));

    const variantOrder = await fetch(`${BASE}/api/orders`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ productId: 'p01', variantId: secondPick.id, quantity: 1 }],
        customer: { name: 'Lê Biến Thể', phone: '0977000111', email: '', address: '99 Pasteur, Quận 1, TP. HCM', paymentMethod: 'cod' },
      }),
    });
    const variantOrderBody = await variantOrder.json();
    const p01AfterVariantOrder = (await (await fetch(`${BASE}/api/products/dien-thoai-saigon-x9-pro`)).json()).product;
    const pickedAfter = p01AfterVariantOrder.variants.find((variant) => variant.id === secondPick.id);
    check('S2 ordering one variant only touches that variant',
      variantOrder.status === 201 && variantOrderBody.items[0].variantId === secondPick.id
        && variantOrderBody.items[0].variantLabel === variantLabelOf(secondPick)
        && pickedAfter.stock === secondPick.stock - 1
        && p01AfterVariantOrder.variants.find((variant) => variant.id === firstPick.id).stock === firstPick.stock,
      JSON.stringify({ status: variantOrder.status, item: variantOrderBody.items && variantOrderBody.items[0], before: secondPick.stock, after: pickedAfter.stock }));

    await openPage(page, BASE + '/products/dien-thoai-saigon-x9-pro');
    await page.waitForSelector('button[aria-label="Tăng số lượng"]', { timeout: 20000 });
    await page.getByRole('button', { name: secondPick.color, exact: true }).click();
    const pickedLabel = await page.locator('text=Phân loại:').first().innerText();
    check('S3 the variant picker switches the selected phân loại',
      pickedLabel.includes(secondPick.color)
        && (await page.getByRole('button', { name: secondPick.color, exact: true }).getAttribute('aria-pressed')) === 'true',
      pickedLabel);
    await page.getByRole('button', { name: 'Thêm vào giỏ hàng' }).click();
    await page.getByRole('button', { name: firstPick.color, exact: true }).click();
    await page.getByRole('button', { name: 'Thêm vào giỏ hàng' }).click();
    await openPage(page, BASE + '/cart');
    await page.waitForSelector('li span[aria-live="polite"]', { timeout: 15000 });
    const cartLines = await cartState(page);
    const cartText = await page.locator('body').innerText();
    check('S4 two variants of one product stay on two cart lines',
      cartLines.length === 2
        && cartLines.map((line) => line.variantId).sort().join(',') === [firstPick.id, secondPick.id].sort().join(',')
        && cartText.includes(variantLabelOf(firstPick)) && cartText.includes(variantLabelOf(secondPick)),
      JSON.stringify({ cartLines, labels: [variantLabelOf(firstPick), variantLabelOf(secondPick)] }));
    await page.evaluate(() => localStorage.removeItem('shop-ha-cart'));

    // ---------- T. Autocomplete tìm kiếm ----------
    await page.setViewportSize({ width: 1366, height: 900 });
    const suggestApi = async (params) => {
      const response = await fetch(`${BASE}/api/search/suggest?${new URLSearchParams(params)}`);
      if (!response.ok) throw new Error(`api suggest ${response.status}`);
      return response.json();
    };
    const apiLap = await apiProducts({ q: 'lap', perPage: 50 });
    const suggestLap = await suggestApi({ q: 'lap' });
    check('T1 API gợi ý khớp đúng danh sách của /api/products',
      suggestLap.total === apiLap.total
        && suggestLap.items.filter((item) => item.type === 'product').map((item) => item.label).join('|') === apiLap.items.map((p) => p.name).join('|')
        && suggestLap.items.every((item) => item.href.startsWith('/') && item.label.length > 0),
      JSON.stringify({ total: suggestLap.total, items: suggestLap.items.map((item) => `${item.type}:${item.label}`) }));

    const suggestVi = await suggestApi({ q: 'dien thoai' });
    check('T2 gợi ý hiểu tiếng Việt không dấu và có cả gợi ý danh mục',
      suggestVi.total === 3 && suggestVi.items.some((item) => item.type === 'category' && item.href === '/products?category=dien-thoai'),
      JSON.stringify(suggestVi.items.map((item) => `${item.type}:${item.label}`)));

    const suggestShort = await suggestApi({ q: 'd' });
    const suggestBlank = await suggestApi({ q: '   ' });
    const suggestLimit2 = await suggestApi({ q: 'dien thoai', limit: '2' });
    const suggestLimit0 = await suggestApi({ q: 'dien thoai', limit: '0' });
    const suggestLimit99 = await suggestApi({ q: 'dien thoai', limit: '99' });
    check('T3 chặn từ khoá dưới 2 ký tự và kẹp limit trong khoảng 1..8',
      suggestShort.items.length === 0 && suggestBlank.items.length === 0
        && suggestLimit2.items.length === 2 && suggestLimit0.items.length === 1
        && suggestLimit99.items.length > 2 && suggestLimit99.items.length <= 8,
      JSON.stringify({ short: suggestShort.items.length, blank: suggestBlank.items.length, limit2: suggestLimit2.items.length, limit0: suggestLimit0.items.length, limit99: suggestLimit99.items.length }));

    await openPage(page, BASE + '/');
    await waitCards(page);
    const searchBox = page.locator('form[role="search"] input[name="q"]:visible').first();
    await searchBox.click();
    await searchBox.fill('halio');
    await page.waitForSelector('form[role="search"] li[role="option"]', { timeout: 15000 });
    const suggestOptions = await page.$$eval('form[role="search"] li[role="option"]', (els) =>
      els.map((el) => ({
        label: (el.querySelector('.font-medium') || el).textContent.trim(),
        type: el.getAttribute('data-suggestion-type'),
      })));
    const suggestExpanded = await searchBox.getAttribute('aria-expanded');
    const firstOptionText = await page.locator('form[role="search"] li[role="option"]').first().innerText();
    check('T4 gõ 2+ ký tự hiện listbox đúng ARIA, có giá tiền và loại gợi ý',
      suggestOptions.length >= 2 && suggestExpanded === 'true'
        && suggestOptions.some((option) => option.type === 'product') && /₫/.test(firstOptionText),
      JSON.stringify({ expanded: suggestExpanded, options: suggestOptions, firstOption: firstOptionText.replace(/\n/g, ' / ') }));

    await searchBox.press('ArrowDown');
    const activeOptionId = await searchBox.getAttribute('aria-activedescendant');
    const activeOptionText = activeOptionId
      ? await page.locator(`li[id="${activeOptionId}"]`).innerText().catch(() => '')
      : '';
    await searchBox.press('Enter');
    await page.waitForURL(/\/products\/laptop-halio-air-14$/, { timeout: 15000 });
    check('T5 ↓ chọn gợi ý đầu rồi Enter đi thẳng tới trang chi tiết',
      Boolean(activeOptionId) && /Halio Air 14/.test(activeOptionText) && page.url().endsWith('/products/laptop-halio-air-14'),
      JSON.stringify({ activeOptionId, activeOptionText: activeOptionText.split('\n')[0], url: page.url() }));

    await openPage(page, BASE + '/');
    await waitCards(page);
    const searchBoxEscape = page.locator('form[role="search"] input[name="q"]:visible').first();
    await searchBoxEscape.fill('tai nghe');
    await page.waitForSelector('form[role="search"] li[role="option"]', { timeout: 15000 });
    await searchBoxEscape.press('Escape');
    await page.waitForFunction(() => document.querySelectorAll('form[role="search"] ul[role="listbox"]').length === 0, null, { timeout: 10000 });
    const keptValue = await searchBoxEscape.inputValue();
    await searchBoxEscape.press('Enter');
    await page.waitForURL(/\/products\?.*q=tai/, { timeout: 15000 });
    await waitCards(page);
    const valueOnProducts = await page.locator('form[role="search"] input[name="q"]').first().inputValue();
    check('T6 Esc đóng gợi ý nhưng giữ từ khoá, Enter vẫn gửi form tìm kiếm',
      keptValue === 'tai nghe' && valueOnProducts === 'tai nghe' && /q=tai/.test(page.url()),
      JSON.stringify({ keptValue, valueOnProducts, url: page.url() }));

    await openPage(page, BASE + '/');
    await waitCards(page);
    const searchBoxCategory = page.locator('form[role="search"] input[name="q"]:visible').first();
    await searchBoxCategory.fill('dien thoai');
    await page.waitForSelector('form[role="search"] li[data-suggestion-type="category"]', { timeout: 15000 });
    await page.locator('form[role="search"] li[data-suggestion-type="category"]').first().click();
    await page.waitForURL(/\/products\?category=dien-thoai/, { timeout: 15000 });
    await waitCards(page);
    const categoryTitles = await titles(page);
    check('T7 bấm gợi ý danh mục đi thẳng tới danh mục đó',
      categoryTitles.length === 3 && new URL(page.url()).searchParams.get('category') === 'dien-thoai',
      JSON.stringify({ count: categoryTitles.length, url: page.url() }));

    await openPage(page, BASE + '/');
    const searchBoxShort = page.locator('form[role="search"] input[name="q"]:visible').first();
    await searchBoxShort.fill('l');
    await page.waitForTimeout(800);
    const shortListCount = await page.locator('form[role="search"] ul[role="listbox"]').count();
    check('T8 từ khoá 1 ký tự không mở gợi ý', shortListCount === 0, shortListCount);

    await openPage(page, `${BASE}/products?q=${encodeURIComponent('dien thoai')}`);
    await waitCards(page);
    await page.waitForTimeout(700);
    const autoPopup = await page.locator('form[role="search"] ul[role="listbox"]').count();
    check('T9 mở sẵn trang /products?q=... không tự bật popup gợi ý', autoPopup === 0, autoPopup);

    await openPage(page, BASE + '/');
    await waitCards(page);
    const searchBoxLate = page.locator('form[role="search"] input[name="q"]:visible').first();
    await searchBoxLate.click();
    await searchBoxLate.fill('halio');
    await page.waitForTimeout(350);
    await searchBoxLate.press('Escape');
    await page.waitForTimeout(800);
    const latePopup = await page.locator('form[role="search"] ul[role="listbox"]').count();
    check('T10 response về muộn không mở lại popup đã đóng bằng Esc', latePopup === 0, latePopup);

    await openPage(page, BASE + '/');
    const searchBoxNone = page.locator('form[role="search"] input[name="q"]:visible').first();
    await searchBoxNone.click();
    await searchBoxNone.fill('zzzz');
    await page.waitForSelector('form[role="search"] p[role="status"]', { timeout: 15000 });
    const noneExpanded = await searchBoxNone.getAttribute('aria-expanded');
    const noneControls = await searchBoxNone.getAttribute('aria-controls');
    const noResultText = await page.locator('form[role="search"] p[role="status"]').innerText();
    check('T11 không có gợi ý thì aria-expanded=false và không trỏ tới listbox không tồn tại',
      noneExpanded === 'false' && noneControls === null && /Không có gợi ý/.test(noResultText),
      JSON.stringify({ noneExpanded, noneControls, noResultText }));

    await openPage(page, BASE + '/');
    await waitCards(page);
    const searchBoxTab = page.locator('form[role="search"] input[name="q"]:visible').first();
    await searchBoxTab.click();
    await searchBoxTab.fill('halio');
    await page.waitForSelector('form[role="search"] ul[role="listbox"]', { timeout: 15000 });
    const popupLinkTabIndex = await page
      .locator('form[role="search"] a[href^="/products?q="]')
      .first()
      .getAttribute('tabindex');
    await searchBoxTab.press('Tab');
    await page.waitForTimeout(200);
    const afterTabPopup = await page.locator('form[role="search"] ul[role="listbox"]').count();
    check('T12 Tab khỏi ô tìm kiếm thì đóng popup và link "Xem tất cả" không nhận Tab',
      popupLinkTabIndex === '-1' && afterTabPopup === 0,
      JSON.stringify({ popupLinkTabIndex, afterTabPopup }));

    // T13: API gợi ý lỗi (HTTP 200 nhưng thân không phải JSON) -> popup phải nói đúng nguyên nhân
    // ("không tải được"), không được nói nhầm thành "không có gợi ý"; Enter vẫn submit form.
    await openPage(page, BASE + '/');
    await waitCards(page);
    await page.route('**/api/search/suggest*', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"items":' }));
    const searchBoxFail = page.locator('form[role="search"] input[name="q"]:visible').first();
    await searchBoxFail.click();
    await searchBoxFail.fill('halio');
    await page.waitForSelector('form[role="search"] p[role="status"]', { timeout: 15000 });
    const failText = await page.locator('form[role="search"] p[role="status"]').innerText();
    const failListboxes = await page.locator('form[role="search"] ul[role="listbox"]').count();
    await page.unroute('**/api/search/suggest*');
    await searchBoxFail.press('Enter');
    await page.waitForURL(/\/products\?.*q=halio/, { timeout: 15000 });
    check('T13 API gợi ý lỗi thì báo đúng nguyên nhân và Enter vẫn gửi form tìm kiếm',
      /Không tải được gợi ý/.test(failText) && failListboxes === 0 && /q=halio/.test(page.url()),
      JSON.stringify({ failText, failListboxes, url: page.url() }));

    // ---------- U. Wishlist ----------
    await page.evaluate(() => localStorage.removeItem('shop-ha-wishlist'));
    await openPage(page, BASE + '/products');
    await waitCards(page);
    const firstCardName = await cardName(page, 0);
    const firstCardSlug = (await page.locator('article').first().locator('h3 a').getAttribute('href')).replace('/products/', '');
    const firstCardId = (await (await fetch(`${BASE}/api/products/${firstCardSlug}`)).json()).product.id;
    const firstHeart = page.locator('article').first().locator('button[aria-label*="yêu thích"]');
    const heartBefore = await firstHeart.getAttribute('aria-pressed');
    await firstHeart.click();
    await page.waitForFunction(() => !!localStorage.getItem('shop-ha-wishlist'), null, { timeout: 10000 });
    const wishIds1 = await wishlistState(page);
    const wishBadge1 = await page.locator('header a[href="/wishlist"]').getAttribute('aria-label');
    check('U1 bấm trái tim lưu vào localStorage, đổi aria-pressed và hiện badge ở header',
      heartBefore === 'false' && (await firstHeart.getAttribute('aria-pressed')) === 'true'
        && wishIds1.length === 1 && wishIds1[0] === firstCardId && wishBadge1.includes('(1 sản phẩm)'),
      JSON.stringify({ heartBefore, wishIds1, firstCardId, wishBadge1 }));

    await openPage(page, BASE + '/wishlist');
    await page.waitForSelector('article', { timeout: 20000 });
    const wishlistTitles = await titles(page);
    const wishBadge2 = await page.locator('header a[href="/wishlist"]').getAttribute('aria-label');
    check('U2 /wishlist hiện đúng sản phẩm đã lưu và giữ sau khi tải lại trang',
      wishlistTitles.length === 1 && wishlistTitles[0] === firstCardName && wishBadge2.includes('(1 sản phẩm)'),
      JSON.stringify({ wishlistTitles, firstCardName, wishBadge2 }));

    await page.locator('button[aria-label*="yêu thích"]').first().click();
    await page.waitForSelector('text=Chưa có sản phẩm yêu thích', { timeout: 10000 });
    const wishIds3 = await wishlistState(page);
    check('U3 bỏ yêu thích ngay trên /wishlist trả về trạng thái rỗng', wishIds3.length === 0, JSON.stringify(wishIds3));

    await page.evaluate(() =>
      localStorage.setItem('shop-ha-wishlist', JSON.stringify({ state: { ids: ['p01', 'p01', 'khong-co', 'p02', 42] }, version: 1 })));
    await openPage(page, BASE + '/wishlist');
    await page.waitForSelector('article', { timeout: 20000 });
    const cleanTitles = await titles(page);
    const cleanBadge = await page.locator('header a[href="/wishlist"]').getAttribute('aria-label');
    const expectedNames = [];
    for (const slug of ['dien-thoai-saigon-x9-pro', 'dien-thoai-saigon-lite-5g']) {
      expectedNames.push((await (await fetch(`${BASE}/api/products/${slug}`)).json()).product.name.trim());
    }
    check('U4 id lạ, id trùng và giá trị không phải chuỗi bị loại khi nạp localStorage',
      cleanTitles.length === 2 && expectedNames.every((name) => cleanTitles.includes(name)) && cleanBadge.includes('(2 sản phẩm)'),
      JSON.stringify({ cleanTitles, expectedNames, cleanBadge }));

    await page.evaluate(() => localStorage.removeItem('shop-ha-wishlist'));
    await openPage(page, BASE + '/products/dien-thoai-saigon-x9-pro');
    await page.waitForSelector('button[aria-label*="yêu thích"]', { timeout: 20000 });
    const detailHeart = page.locator('button[aria-label*="yêu thích"]').first();
    const detailBefore = await detailHeart.getAttribute('aria-pressed');
    await detailHeart.click();
    await page.waitForFunction(() => document.querySelector('button[aria-label*="yêu thích"]')?.getAttribute('aria-pressed') === 'true', null, { timeout: 10000 });
    const detailLabel = await detailHeart.getAttribute('aria-label');
    check('U5 trang chi tiết có nút yêu thích và đổi trạng thái',
      detailBefore === 'false' && detailLabel.startsWith('Bỏ ') && detailLabel.endsWith('khỏi yêu thích'),
      JSON.stringify({ detailBefore, detailLabel }));
    await page.evaluate(() => localStorage.removeItem('shop-ha-wishlist'));

    // ---------- V. So sánh sản phẩm ----------
    await page.evaluate(() => localStorage.removeItem('shop-ha-compare'));
    await openPage(page, BASE + '/products');
    await waitCards(page);
    const pickedCards = [];
    for (const index of [0, 1]) {
      const card = page.locator('article').nth(index);
      pickedCards.push({ name: await cardName(page, index), href: await card.locator('h3 a').getAttribute('href') });
      await card.locator('button[aria-label*="so sánh"]').click();
    }
    await page.waitForFunction(() => {
      const raw = localStorage.getItem('shop-ha-compare');
      return raw && JSON.parse(raw).state.ids.length === 2;
    }, null, { timeout: 10000 });
    const compareIds1 = await compareState(page);
    const compareBadge = await page.locator('header a[href="/compare"]').getAttribute('aria-label');
    check('V1 bật so sánh ở 2 thẻ sản phẩm lưu 2 id và hiện badge ở header',
      compareIds1.length === 2 && compareBadge.includes('(2 sản phẩm)'),
      JSON.stringify({ compareIds1, compareBadge }));

    await openPage(page, BASE + '/compare');
    await page.waitForSelector('table', { timeout: 20000 });
    const compareColumns = await page.$$eval('[data-compare-column]', (els) => els.map((el) => el.getAttribute('data-compare-column')));
    const compareTableText = await page.locator('table').innerText();
    const diffRows = await page.$$eval('tbody tr[data-diff="true"]', (els) => els.map((el) => el.getAttribute('data-row')));
    check('V2 /compare dựng bảng đúng số cột, đủ tên sản phẩm và đánh dấu dòng khác nhau',
      compareColumns.join(',') === compareIds1.join(',')
        && pickedCards.every((card) => compareTableText.includes(card.name))
        && diffRows.includes('price'),
      JSON.stringify({ compareColumns, diffRows, pickedCards }));

    await page.getByRole('button', { name: /^Bỏ .+ khỏi so sánh$/ }).first().click();
    await page.waitForFunction(() => document.querySelectorAll('[data-compare-column]').length === 1, null, { timeout: 10000 });
    const compareIds2 = await compareState(page);
    check('V3 nút Bỏ trên bảng xoá đúng một cột khỏi store',
      compareIds2.length === 1 && !compareIds2.includes(compareIds1[0]),
      JSON.stringify({ compareIds1, compareIds2 }));

    const phuKien = await apiProducts({ category: 'phu-kien', perPage: 50 });
    const phuKienIds = phuKien.items.map((item) => item.id);
    await page.evaluate(
      (ids) => localStorage.setItem('shop-ha-compare', JSON.stringify({ state: { ids: ids.slice(0, 4) }, version: 1 })),
      phuKienIds);
    await openPage(page, BASE + '/products?category=phu-kien');
    await waitCards(page);
    const sixthCardName = await cardName(page, 4);
    const sixthCompare = page.locator('article').nth(4).locator('button[aria-label*="so sánh"]');
    const sixthDisabled = await sixthCompare.isDisabled();
    const sixthLabel = await sixthCompare.getAttribute('aria-label');
    check('V4 đã đủ 4 sản phẩm thì nút so sánh của sản phẩm khác bị khoá kèm lý do',
      phuKien.items.length >= 5 && !phuKienIds.slice(0, 4).includes(phuKien.items[4].id)
        && sixthDisabled && /Đã đủ 4 sản phẩm so sánh/.test(sixthLabel),
      JSON.stringify({ sixthCardName, sixthDisabled, sixthLabel }));

    await openPage(page, BASE + '/compare?ids=p01,p02');
    await page.waitForSelector('[data-compare-column]', { timeout: 20000 });
    const sharedColumns = await page.$$eval('[data-compare-column]', (els) => els.map((el) => el.getAttribute('data-compare-column')));
    const sharedBanner = await page.getByText('Đây là danh sách chia sẻ qua liên kết.').count();
    check('V5 /compare?ids= hiện đúng danh sách chia sẻ dù store đang giữ 4 sản phẩm khác',
      sharedColumns.join(',') === 'p01,p02' && sharedBanner === 1,
      JSON.stringify({ sharedColumns, sharedBanner }));

    await page.getByRole('button', { name: /(Lưu vào|Thay) danh sách so sánh/ }).click();
    await page.waitForURL(/\/compare$/, { timeout: 15000 });
    await page.waitForFunction(() => {
      const raw = localStorage.getItem('shop-ha-compare');
      return raw && JSON.parse(raw).state.ids.length === 2;
    }, null, { timeout: 10000 });
    const savedSharedIds = await compareState(page);
    check('V6 "Lưu vào danh sách so sánh" thay danh sách đang đầy bằng danh sách chia sẻ',
      savedSharedIds.join(',') === 'p01,p02',
      JSON.stringify(savedSharedIds));

    await openPage(page, BASE + '/compare?ids=khong-co,p03,p03');
    await page.waitForSelector('[data-compare-column]', { timeout: 20000 });
    const safeColumns = await page.$$eval('[data-compare-column]', (els) => els.map((el) => el.getAttribute('data-compare-column')));
    check('V7 id lạ và id trùng trong ?ids= bị bỏ', safeColumns.join(',') === 'p03', safeColumns.join(','));

    // Id hỏng đứng trước không được "ăn" chỗ của 4 id hợp lệ (lọc trước, cắt sau).
    await openPage(page, BASE + '/compare?ids=khong-co,p03,p01,p02,p04');
    await page.waitForSelector('[data-compare-column]', { timeout: 20000 });
    const mixedColumns = await page.$$eval('[data-compare-column]', (els) => els.map((el) => el.getAttribute('data-compare-column')));
    check('V7b vẫn hiện đủ 4 sản phẩm hợp lệ khi ?ids= có id hỏng ở đầu',
      mixedColumns.join(',') === 'p03,p01,p02,p04', mixedColumns.join(','));

    await openPage(page, BASE + '/compare?ids=khong-co,khong-co-2');
    await page.waitForSelector('text=Liên kết chia sẻ không còn sản phẩm nào', { timeout: 20000 });
    const brokenShare = await page.getByText('Liên kết chia sẻ không còn sản phẩm nào').count();
    check('V7c link chia sẻ hỏng hẳn thì báo rõ thay vì im lặng hiện danh sách của mình',
      brokenShare === 1 && (await page.$$('[data-compare-column]')).length === 0, brokenShare);

    await page.evaluate(() => localStorage.removeItem('shop-ha-compare'));
    await openPage(page, BASE + '/compare');
    await page.waitForSelector('text=Chưa chọn sản phẩm để so sánh', { timeout: 20000 });
    const emptyCompare = await page.getByText('Chưa chọn sản phẩm để so sánh').count();
    check('V8 chưa chọn gì thì /compare hiện trạng thái rỗng có hướng dẫn', emptyCompare === 1, emptyCompare);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => {
      localStorage.setItem('shop-ha-wishlist', JSON.stringify({ state: { ids: ['p01'] }, version: 1 }));
      localStorage.setItem('shop-ha-compare', JSON.stringify({ state: { ids: ['p01', 'p02'] }, version: 1 }));
    });
    await openPage(page, BASE + '/wishlist');
    await page.waitForSelector('article', { timeout: 20000 });
    const wishOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    await openPage(page, BASE + '/compare');
    await page.waitForSelector('table', { timeout: 20000 });
    const compareOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check('V9 /wishlist và /compare không tràn ngang ở 390px', wishOverflow <= 1 && compareOverflow <= 1,
      JSON.stringify({ wishOverflow, compareOverflow }));

    await page.setViewportSize({ width: 1366, height: 900 });
    await page.evaluate(() => {
      localStorage.removeItem('shop-ha-wishlist');
      localStorage.removeItem('shop-ha-compare');
    });

    // ---------- J. Console hygiene ----------
    check('J1 no page errors', pageErrors.length === 0, pageErrors.slice(0, 3));
    check('J2 no console errors', consoleErrors.length === 0, consoleErrors.slice(0, 3));
    check('J3 no 5xx responses', badResponses.length === 0, badResponses.slice(0, 3));
  } catch (error) {
    check('RUNTIME error', false, String(error && error.stack ? error.stack.split('\n').slice(0, 3).join(' | ') : error));
  } finally {
    await browser.close();
  }

  const failed = checks.filter((c) => !c.ok);
  console.log(JSON.stringify({ base: BASE, total: checks.length, passed: checks.length - failed.length, failed: failed.length, checks }, null, 1));
  process.exit(failed.length === 0 ? 0 : 1);
})();
