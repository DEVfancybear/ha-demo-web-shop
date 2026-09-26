import type { Category, Product, ProductQuery, SortKey } from "@/types";

export const categories: Category[] = [
  { slug: "dien-thoai", name: "Điện thoại", description: "Smartphone chính hãng, bảo hành 12 tháng", emoji: "📱" },
  { slug: "laptop", name: "Laptop", description: "Laptop học tập, văn phòng và đồ hoạ", emoji: "💻" },
  { slug: "tai-nghe", name: "Tai nghe", description: "Tai nghe chụp tai, in-ear và chống ồn", emoji: "🎧" },
  { slug: "dong-ho", name: "Đồng hồ", description: "Đồng hồ thông minh và thể thao", emoji: "⌚" },
  { slug: "phu-kien", name: "Phụ kiện", description: "Sạc, pin dự phòng, chuột và bàn phím", emoji: "🔌" },
];

export const products: Product[] = [
  {
    id: "p01", slug: "dien-thoai-saigon-x9-pro", name: "Saigon X9 Pro 256GB", brand: "Saigon",
    category: "dien-thoai", price: 21900000, salePrice: 18990000, rating: 4.8, reviewCount: 214, stock: 12,
    description: "Flagship của Saigon với màn hình AMOLED 120Hz, camera 50MP chống rung quang học và pin 5000mAh sạc nhanh 65W.",
    highlights: ["Màn hình AMOLED 6.7 inch, 120Hz", "Bộ ba camera 50MP + 12MP + 8MP", "Pin 5000mAh, sạc nhanh 65W", "Kháng nước IP68"],
    specs: [{ label: "Màn hình", value: "6.7 inch AMOLED" }, { label: "Chip", value: "Snap 8 Gen 3" }, { label: "RAM/ROM", value: "12GB / 256GB" }, { label: "Pin", value: "5000mAh" }],
    emoji: "📱", tone: "from-sky-200 to-indigo-300", featured: true, createdAt: "2026-08-02",
  },
  {
    id: "p02", slug: "dien-thoai-saigon-lite-5g", name: "Saigon Lite 5G 128GB", brand: "Saigon",
    category: "dien-thoai", price: 7990000, salePrice: 6990000, rating: 4.5, reviewCount: 168, stock: 30,
    description: "Máy tầm trung hỗ trợ 5G, pin trâu 2 ngày, phù hợp học sinh sinh viên.",
    highlights: ["Hỗ trợ 5G", "Pin 6000mAh", "Sạc nhanh 33W", "Màn hình 90Hz"],
    specs: [{ label: "Màn hình", value: "6.6 inch IPS" }, { label: "RAM/ROM", value: "8GB / 128GB" }, { label: "Pin", value: "6000mAh" }],
    emoji: "📱", tone: "from-cyan-200 to-sky-300", createdAt: "2026-07-15",
  },
  {
    id: "p03", slug: "dien-thoai-nova-edge-ultra", name: "Nova Edge Ultra 512GB", brand: "Nova",
    category: "dien-thoai", price: 28990000, rating: 4.7, reviewCount: 92, stock: 6,
    description: "Camera tele 5x, khung titan, màn hình cong tràn viền cho trải nghiệm cao cấp.",
    highlights: ["Camera tele 5x", "Khung titan", "Màn hình LTPO 1-120Hz", "Sạc không dây 50W"],
    specs: [{ label: "Màn hình", value: "6.8 inch LTPO" }, { label: "RAM/ROM", value: "16GB / 512GB" }, { label: "Khối lượng", value: "221g" }],
    emoji: "📱", tone: "from-violet-200 to-purple-300", featured: true, createdAt: "2026-09-05",
  },
  {
    id: "p04", slug: "laptop-halio-air-14", name: "Halio Air 14 (2026)", brand: "Halio",
    category: "laptop", price: 26990000, salePrice: 24490000, rating: 4.9, reviewCount: 141, stock: 9,
    description: "Laptop 1.2kg, pin 16 giờ, màn hình 2.8K 90Hz — lựa chọn cho sinh viên và dân văn phòng.",
    highlights: ["Nặng chỉ 1.2kg", "Pin dùng 16 giờ", "Màn hình 2.8K 90Hz", "Sạc USB-C 65W"],
    specs: [{ label: "CPU", value: "Halio H7 8 nhân" }, { label: "RAM", value: "16GB LPDDR5" }, { label: "SSD", value: "512GB NVMe" }, { label: "Màn hình", value: "14 inch 2.8K" }],
    emoji: "💻", tone: "from-amber-200 to-orange-300", featured: true, createdAt: "2026-06-20",
  },
  {
    id: "p05", slug: "laptop-halio-pro-16-rtx", name: "Halio Pro 16 RTX", brand: "Halio",
    category: "laptop", price: 44990000, salePrice: 41990000, rating: 4.6, reviewCount: 58, stock: 4,
    description: "Laptop đồ hoạ 16 inch với GPU rời, tản nhiệt buồng hơi, màn hình 165Hz.",
    highlights: ["GPU rời 8GB", "Màn hình 16 inch 165Hz", "Tản nhiệt buồng hơi", "Bàn phím RGB"],
    specs: [{ label: "CPU", value: "Core Ultra 9" }, { label: "RAM", value: "32GB DDR5" }, { label: "SSD", value: "1TB NVMe" }, { label: "GPU", value: "RTX 8GB" }],
    emoji: "💻", tone: "from-slate-300 to-zinc-400", createdAt: "2026-05-11",
  },
  {
    id: "p06", slug: "laptop-vietbook-student-15", name: "VietBook Student 15", brand: "VietBook",
    category: "laptop", price: 12990000, salePrice: 11490000, rating: 4.3, reviewCount: 203, stock: 25,
    description: "Laptop giá rẻ cho học tập: bàn phím số đầy đủ, dễ nâng cấp RAM và SSD.",
    highlights: ["Dễ nâng cấp RAM/SSD", "Bàn phím số đầy đủ", "Pin 10 giờ", "Bảo hành 24 tháng"],
    specs: [{ label: "CPU", value: "Core i5 thế hệ 12" }, { label: "RAM", value: "16GB DDR4" }, { label: "SSD", value: "512GB" }, { label: "Màn hình", value: "15.6 inch FHD" }],
    emoji: "💻", tone: "from-lime-200 to-green-300", createdAt: "2026-04-28",
  },
  {
    id: "p07", slug: "tai-nghe-sonic-anc-900", name: "Sonic ANC 900", brand: "Sonic",
    category: "tai-nghe", price: 6490000, salePrice: 5490000, rating: 4.7, reviewCount: 312, stock: 40,
    description: "Tai nghe chụp tai chống ồn chủ động, pin 40 giờ, kết nối 2 thiết bị cùng lúc.",
    highlights: ["Chống ồn chủ động -38dB", "Pin 40 giờ", "Multipoint 2 thiết bị", "Sạc nhanh 10 phút / 5 giờ"],
    specs: [{ label: "Driver", value: "40mm" }, { label: "Chống ồn", value: "ANC -38dB" }, { label: "Pin", value: "40 giờ" }],
    emoji: "🎧", tone: "from-rose-200 to-pink-300", featured: true, createdAt: "2026-08-19",
  },
  {
    id: "p08", slug: "tai-nghe-true-air-3", name: "Sonic True Air 3", brand: "Sonic",
    category: "tai-nghe", price: 2990000, salePrice: 2490000, rating: 4.4, reviewCount: 187, stock: 55,
    description: "Tai nghe in-ear nhỏ gọn, chống nước IPX5, phù hợp tập luyện.",
    highlights: ["Chống nước IPX5", "Pin 28 giờ kèm hộp sạc", "Chống ồn chủ động", "Bluetooth 5.3"],
    specs: [{ label: "Driver", value: "12mm" }, { label: "Chuẩn", value: "Bluetooth 5.3" }, { label: "Pin", value: "7 + 21 giờ" }],
    emoji: "🎧", tone: "from-teal-200 to-emerald-300", createdAt: "2026-07-02",
  },
  {
    id: "p09", slug: "dong-ho-timefit-run-2", name: "TimeFit Run 2", brand: "TimeFit",
    category: "dong-ho", price: 4990000, salePrice: 4290000, rating: 4.5, reviewCount: 96, stock: 22,
    description: "Đồng hồ thể thao GPS, đo nhịp tim và nồng độ oxy, chống nước 5ATM.",
    highlights: ["GPS 2 băng tần", "Đo SpO2 và nhịp tim", "Chống nước 5ATM", "Pin 14 ngày"],
    specs: [{ label: "Màn hình", value: "1.43 inch AMOLED" }, { label: "Pin", value: "14 ngày" }, { label: "Chống nước", value: "5ATM" }],
    emoji: "⌚", tone: "from-blue-200 to-cyan-300", createdAt: "2026-06-06",
  },
  {
    id: "p10", slug: "dong-ho-timefit-classic", name: "TimeFit Classic Steel", brand: "TimeFit",
    category: "dong-ho", price: 7990000, rating: 4.2, reviewCount: 44, stock: 8,
    description: "Thiết kế dây thép sang trọng, mặt kính sapphire, phù hợp môi trường công sở.",
    highlights: ["Dây thép không gỉ", "Kính sapphire", "Thông báo cuộc gọi", "Pin 10 ngày"],
    specs: [{ label: "Màn hình", value: "1.32 inch AMOLED" }, { label: "Chất liệu", value: "Thép 316L" }, { label: "Pin", value: "10 ngày" }],
    emoji: "⌚", tone: "from-stone-200 to-amber-200", createdAt: "2026-03-30",
  },
  {
    id: "p11", slug: "phu-kien-pinshare-20k", name: "PinShare 20.000mAh 65W", brand: "PinShare",
    category: "phu-kien", price: 1290000, salePrice: 990000, rating: 4.6, reviewCount: 274, stock: 80,
    description: "Pin dự phòng sạc nhanh 65W, có màn hình hiển thị phần trăm và 3 cổng ra.",
    highlights: ["Công suất 65W", "Màn hình LED", "3 cổng ra", "Sạc được cho laptop"],
    specs: [{ label: "Dung lượng", value: "20.000mAh" }, { label: "Cổng", value: "2x USB-C, 1x USB-A" }, { label: "Công suất", value: "65W" }],
    emoji: "🔌", tone: "from-yellow-200 to-amber-300", createdAt: "2026-08-08",
  },
  {
    id: "p12", slug: "phu-kien-charger-gan-100w", name: "Củ sạc GaN 100W 4 cổng", brand: "Voltix",
    category: "phu-kien", price: 1690000, salePrice: 1390000, rating: 4.8, reviewCount: 121, stock: 60,
    description: "Củ sạc GaN nhỏ gọn 100W, thay thế được 4 củ sạc khi đi du lịch.",
    highlights: ["Công nghệ GaN", "4 cổng, chia công suất thông minh", "Bảo vệ quá nhiệt", "Nhỏ hơn 40%"],
    specs: [{ label: "Công suất", value: "100W" }, { label: "Cổng", value: "3x USB-C, 1x USB-A" }, { label: "Bảo hành", value: "18 tháng" }],
    emoji: "🔌", tone: "from-fuchsia-200 to-violet-300", createdAt: "2026-07-27",
  },
  {
    id: "p13", slug: "phu-kien-chuot-mouse-air", name: "Chuột Mouse Air Silent", brand: "ClickPro",
    category: "phu-kien", price: 690000, salePrice: 590000, rating: 4.3, reviewCount: 158, stock: 120,
    description: "Chuột không dây im lặng, kết nối 2.4GHz và Bluetooth, pin 18 tháng.",
    highlights: ["Nút bấm im lặng", "Kết nối 2 chế độ", "DPI 1600", "Pin 18 tháng"],
    specs: [{ label: "DPI", value: "800 / 1200 / 1600" }, { label: "Kết nối", value: "2.4GHz + Bluetooth" }, { label: "Pin", value: "18 tháng" }],
    emoji: "🖱️", tone: "from-neutral-200 to-slate-300", createdAt: "2026-05-23",
  },
  {
    id: "p14", slug: "phu-kien-ban-phim-keylite-68", name: "Bàn phím KeyLite 68", brand: "KeyLite",
    category: "phu-kien", price: 2190000, salePrice: 1890000, rating: 4.7, reviewCount: 87, stock: 35,
    description: "Bàn phím cơ 68 phím, hotswap, kết nối 3 chế độ, có đèn nền RGB.",
    highlights: ["Kết nối 3 chế độ", "Hotswap switch", "Đèn nền RGB", "Keycap PBT"],
    specs: [{ label: "Layout", value: "68 phím" }, { label: "Switch", value: "Tactile nâu" }, { label: "Pin", value: "4000mAh" }],
    emoji: "⌨️", tone: "from-indigo-200 to-blue-300", createdAt: "2026-06-14",
  },
  {
    id: "p15", slug: "phu-kien-sac-nhanh-type-c", name: "Cáp sạc Type-C 240W", brand: "Voltix",
    category: "phu-kien", price: 290000, salePrice: 199000, rating: 4.4, reviewCount: 342, stock: 200,
    description: "Cáp bện 1.5m chịu tải 240W, truyền dữ liệu 480Mbps, đầu cắm kim loại.",
    highlights: ["Chịu tải 240W", "Dài 1.5m", "Đầu cắm kim loại", "Bền 25.000 lần gập"],
    specs: [{ label: "Chiều dài", value: "1.5m" }, { label: "Công suất", value: "240W" }, { label: "Truyền dữ liệu", value: "480Mbps" }],
    emoji: "🔗", tone: "from-emerald-200 to-teal-300", createdAt: "2026-02-18",
  },
  {
    id: "p16", slug: "tai-nghe-studio-monitor-h1", name: "Studio Monitor H1", brand: "Sonic",
    category: "tai-nghe", price: 8990000, rating: 4.6, reviewCount: 39, stock: 5,
    description: "Tai nghe kiểm âm mở, âm trường rộng, dây tháo rời — dành cho người làm nhạc.",
    highlights: ["Thiết kế mở", "Dây tháo rời", "Trở kháng 250 ohm", "Đệm lót thay được"],
    specs: [{ label: "Driver", value: "50mm" }, { label: "Trở kháng", value: "250 ohm" }, { label: "Khối lượng", value: "290g" }],
    emoji: "🎙️", tone: "from-orange-200 to-red-200", createdAt: "2026-01-30",
  },
];

const sorters: Record<SortKey, (a: Product, b: Product) => number> = {
  newest: (a, b) => (a.createdAt < b.createdAt ? 1 : -1),
  "price-asc": (a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price),
  "price-desc": (a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price),
  rating: (a, b) => b.rating - a.rating,
  name: (a, b) => a.name.localeCompare(b.name, "vi"),
};

export function getCategories(): Category[] {
  return categories;
}

export function getCategory(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getBrands(): string[] {
  return Array.from(new Set(products.map((p) => p.brand))).sort((a, b) => a.localeCompare(b, "vi"));
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getFeaturedProducts(limit = 8): Product[] {
  const featured = products.filter((p) => p.featured);
  const rest = products.filter((p) => !p.featured);
  return [...featured, ...rest].slice(0, limit);
}

export function getRelatedProducts(slug: string, limit = 4): Product[] {
  const current = getProductBySlug(slug);
  if (!current) return products.slice(0, limit);
  const sameCategory = products.filter((p) => p.category === current.category && p.slug !== slug);
  const others = products.filter((p) => p.category !== current.category);
  return [...sameCategory, ...others].slice(0, limit);
}

export function filterProducts(query: ProductQuery = {}) {
  const { q, category, brand, sort = "newest", maxPrice, page = 1, perPage = 8 } = query;
  const keyword = q?.trim().toLowerCase();

  let items = products.filter((p) => {
    if (category && p.category !== category) return false;
    if (brand && p.brand !== brand) return false;
    if (maxPrice && (p.salePrice ?? p.price) > maxPrice) return false;
    if (keyword) {
      const haystack = [p.name, p.brand, p.description, p.category].join(" ").toLowerCase();
      if (!haystack.includes(keyword)) return false;
    }
    return true;
  });

  items = [...items].sort(sorters[sort]);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * perPage;

  return {
    items: items.slice(start, start + perPage),
    total,
    page: safePage,
    perPage,
    totalPages,
    brands: Array.from(new Set(items.map((p) => p.brand))).sort((a, b) => a.localeCompare(b, "vi")),
  };
}

export function priceBounds() {
  const values = products.map((p) => p.salePrice ?? p.price);
  return { min: Math.min(...values), max: Math.max(...values) };
}

export const sortOptions: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Mới nhất" },
  { value: "price-asc", label: "Giá thấp đến cao" },
  { value: "price-desc", label: "Giá cao đến thấp" },
  { value: "rating", label: "Đánh giá cao nhất" },
  { value: "name", label: "Tên A → Z" },
];
