export interface Category {
  slug: string;
  name: string;
  label: string;
  defaultPrice?: number;
}

export interface ProductMedia {
  type: "image" | "video";
  src: string;
  label: string;
  poster?: string;
}

export interface ColorVariant {
  name: string;
  swatch: string;
  productId: string;
}

export interface Product {
  id: string;
  category: string;
  collection: string;
  name: string;
  price: number;
  originalPrice: number | null;
  discountPercent: number;
  currency: string;
  description: string;
  material: string;
  dimensions: string;
  care: string;
  colors: string[];
  colorVariants: ColorVariant[];
  sizes: string[];
  rating: number;
  reviewCount: number;
  quantity: number;
  inStock: boolean;
  deliveryDays: string;
  media: ProductMedia[];
}

export interface Catalog {
  generatedAt: string;
  categories: Category[];
  products: Product[];
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  title: string;
  body: string;
  verified: boolean;
}
