
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
async function waitCards(page) {
  await page.waitForSelector('article', { timeout: 20000 });
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
    const homeResp = await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
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

    // ---------- C. Filters & sorting ----------
    // Reset search first: category change keeps ?q=, so we start from the full list.
    await page.goto(BASE + '/products', { waitUntil: 'domcontentloaded' });
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
    await page.goto(BASE + '/products', { waitUntil: 'domcontentloaded' });
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
    await page.goto(BASE + '/products/dien-thoai-saigon-x9-pro', { waitUntil: 'domcontentloaded' });
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
    check('D7 cart persisted in localStorage', st1.length === 1 && st1[0].productId === 'p01' && st1[0].quantity === 3 && st1[0].price === 18990000,
      JSON.stringify(st1));

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
    check('E10 remaining cart line is p01 x2', st2.length === 1 && st2[0].productId === 'p01' && st2[0].quantity === 2, JSON.stringify(st2));
    const subAfter = await totalRow(page, 'Tạm tính');
    check('E11 totals recomputed after removal', digits(subAfter) === '37980000', subAfter);

    // reload keeps cart (persistence)
    await page.reload({ waitUntil: 'domcontentloaded' });
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
    const orderApi = await (await fetch(`${BASE}/api/orders/${orderId}`)).json();
    check('F12 order API total matches UI',
      orderApi.total === 34182000 && orderApi.subtotal === 37980000 && orderApi.discount === 3798000 && orderApi.shippingFee === 0,
      JSON.stringify({ subtotal: orderApi.subtotal, discount: orderApi.discount, shipping: orderApi.shippingFee, total: orderApi.total }));
    check('F13 order API stores customer + momo', orderApi.customer.paymentMethod === 'momo' && orderApi.customer.phone === '0912345678', JSON.stringify(orderApi.customer));
    check('F14 order API items', orderApi.items.length === 1 && orderApi.items[0].quantity === 2 && orderApi.items[0].productId === 'p01', JSON.stringify(orderApi.items));

    // ---------- G. Orders list ----------
    await page.getByRole('link', { name: 'Đơn hàng' }).first().click();
    await page.waitForURL(/\/orders$/, { timeout: 15000 });
    await page.waitForSelector('main ul li', { timeout: 15000 });
    if (orderCode) await page.waitForSelector(`text=${orderCode}`, { timeout: 15000 });
    const ordersBody = await page.locator('body').innerText();
    check('G1 new order listed', orderCode ? ordersBody.includes(orderCode) : false, orderCode);
    check('G2 order card shows status + total', /Chờ xác nhận/.test(ordersBody) && ordersBody.includes('34.182.000'), null);
    const ordersApi = await (await fetch(`${BASE}/api/orders`)).json();
    check('G3 orders API count matches list', ordersApi.orders.length >= 1, ordersApi.orders.length);

    // ---------- H. Empty states & 404 ----------
    await page.goto(BASE + '/cart', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=Giỏ hàng đang trống', { timeout: 15000 });
    check('H1 empty cart state', true, null);
    await page.goto(BASE + '/checkout', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=Chưa có sản phẩm để đặt', { timeout: 15000 });
    check('H2 checkout blocked when cart empty', true, null);
    const nf = await page.goto(BASE + '/products/khong-ton-tai', { waitUntil: 'domcontentloaded' });
    check('H3 unknown product returns 404', nf.status() === 404, nf.status());
    check('H4 not-found copy renders', /Không tìm thấy trang/.test(await page.locator('body').innerText()), null);
    const nfApi = await (await fetch(BASE + '/api/products/khong-ton-tai')).status;
    check('H5 unknown product API returns 404', nfApi === 404, nfApi);

    // ---------- I. Mobile layout ----------
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await waitCards(page);
    const overflowHome = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check('I1 no horizontal overflow on home (390px)', overflowHome <= 1, overflowHome);
    await page.goto(BASE + '/products', { waitUntil: 'domcontentloaded' });
    await waitCards(page);
    const overflowProducts = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check('I2 no horizontal overflow on products (390px)', overflowProducts <= 1, overflowProducts);
    await page.goto(BASE + '/products/dien-thoai-saigon-x9-pro', { waitUntil: 'domcontentloaded' });
    const overflowDetail = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check('I3 no horizontal overflow on detail (390px)', overflowDetail <= 1, overflowDetail);

    // Card action buttons: label must stay on one line and inside the card, also on the narrow
    // 4-column layout (1280px+) where "Thêm vào giỏ" + "Chi tiết" do not fit side by side.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE + '/products', { waitUntil: 'domcontentloaded' });
    await waitCards(page);
    const cardActions = await page.evaluate(() => {
      const card = document.querySelector('article');
      const btn = card.querySelector('button');
      const label = Array.from(btn.childNodes).find((n) => n.nodeType === 3 && n.textContent.trim());
      const range = document.createRange();
      range.selectNode(label);
      const detail = Array.from(card.querySelectorAll('a')).find((a) => a.textContent.trim() === 'Chi tiết');
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
