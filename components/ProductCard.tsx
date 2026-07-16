import Link from "next/link";
import type { Product } from "@/lib/types";
import ProductImage from "@/components/ProductImage";
import { formatOriginalPrice, formatPrice, getCoverImage } from "@/lib/catalog";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const original = formatOriginalPrice(product);

  return (
    <Link
      href={`/${product.category}/${product.id}`}
      className="group overflow-hidden rounded-2xl bg-white luxury-shadow transition-all duration-300 hover:-translate-y-1.5 hover:luxury-shadow-lg"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-beige">
        <ProductImage
          src={getCoverImage(product)}
          alt={product.name}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 33vw"
        />
        {product.discountPercent > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-gold px-2.5 py-1 text-[10px] font-semibold text-brown-dark">
            -{product.discountPercent}%
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="text-[10px] font-medium uppercase tracking-wider text-gold">
          {product.collection}
        </p>
        <h3 className="font-display mt-1 text-lg font-semibold text-brown-dark line-clamp-2">
          {product.name}
        </h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-semibold text-brown-dark">{formatPrice(product)}</span>
          {original && (
            <span className="text-sm text-text-muted line-through">{original}</span>
          )}
        </div>
        <div className="mt-2 flex items-center gap-1">
          <svg className="h-3.5 w-3.5 text-gold" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292Z" />
          </svg>
          <span className="text-xs text-text-muted">
            {product.rating} ({product.reviewCount})
          </span>
        </div>
        <span className="mt-3 inline-block text-sm font-medium text-brown transition group-hover:text-brown-dark">
          View details →
        </span>
      </div>
    </Link>
  );
}
