import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatPrice, getCoverImage } from "@/lib/catalog";

interface RelatedProductsProps {
  products: Product[];
  category: string;
}

export default function RelatedProducts({ products, category }: RelatedProductsProps) {
  return (
    <section>
      <h2 className="font-display text-xl font-semibold text-brown-dark">
        You may also like
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/${category}/${product.id}`}
            className="group overflow-hidden rounded-xl bg-white luxury-shadow transition hover:-translate-y-1 hover:luxury-shadow-lg"
          >
            <div className="relative aspect-square overflow-hidden">
              <Image
                src={getCoverImage(product)}
                alt={product.name}
                fill
                className="object-cover transition duration-500 group-hover:scale-105"
                sizes="200px"
              />
            </div>
            <div className="p-3">
              <p className="line-clamp-2 text-sm font-medium text-brown-dark">{product.name}</p>
              <p className="mt-1 text-sm font-semibold text-gold">{formatPrice(product)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
