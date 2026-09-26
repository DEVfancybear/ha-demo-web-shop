import { ProductCard } from "@/components/product/product-card";
import { EmptyState } from "@/components/common/empty-state";
import type { Product } from "@/types";

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon="🔍"
        title="Không tìm thấy sản phẩm"
        description="Thử từ khoá khác hoặc bỏ bộ lọc danh mục, thương hiệu và khoảng giá."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
