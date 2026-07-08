import type { Product } from "./types";

const TEST_COLOR_VARIANTS = [
  { name: "Natural", swatch: "#D4C4A8", productId: "TEST" },
  { name: "Blue", swatch: "#2563EB", productId: "TEST2" },
];

export const TEST_BAG_PRODUCT: Product = {
  id: "TEST",
  category: "mini-bags",
  collection: "Mini Bag Collection",
  name: "Test Bag (Payment)",
  price: 1,
  originalPrice: 5,
  discountPercent: 80,
  currency: "INR",
  description:
    "A ₹1 test bag for verifying UPI / GPay checkout. Includes the same product page experience as our regular bags — gallery, colour options, size, and add to cart.",
  material: "Premium cotton-blend crochet yarn",
  dimensions: "16 × 12 × 10 cm",
  care: "Spot clean only. Store in a dry place away from direct sunlight.",
  colors: ["Natural"],
  colorVariants: TEST_COLOR_VARIANTS,
  sizes: ["One Size"],
  rating: 4.8,
  reviewCount: 12,
  quantity: 99,
  inStock: true,
  deliveryDays: "3–5 business days",
  media: [
    {
      type: "image",
      src: "/images/B1_minibag%20(1).png",
      label: "Front View",
    },
    {
      type: "image",
      src: "/images/B1_minibag%20(2).png",
      label: "Back View",
    },
    {
      type: "image",
      src: "/images/B1_minibag%20(3).png",
      label: "Left Side",
    },
    {
      type: "image",
      src: "/images/B1_minibag%20(4).png",
      label: "Right Side",
    },
  ],
};

export const TEST_BAG_PRODUCT_BLUE: Product = {
  id: "TEST2",
  category: "mini-bags",
  collection: "Mini Bag Collection",
  name: "Test Bag (Payment) — Blue",
  price: 1,
  originalPrice: 5,
  discountPercent: 80,
  currency: "INR",
  description:
    "Blue colour variant of our ₹1 payment test bag. Use this to try the full checkout flow with a dynamic UPI QR code.",
  material: "Premium cotton-blend crochet yarn",
  dimensions: "16 × 12 × 10 cm",
  care: "Spot clean only. Store in a dry place away from direct sunlight.",
  colors: ["Blue"],
  colorVariants: TEST_COLOR_VARIANTS,
  sizes: ["One Size"],
  rating: 4.8,
  reviewCount: 12,
  quantity: 99,
  inStock: true,
  deliveryDays: "3–5 business days",
  media: [
    {
      type: "image",
      src: "/images/B2_minibag%20(1).png",
      label: "Front View",
    },
    {
      type: "image",
      src: "/images/B2_minibag%20(2).png",
      label: "Back View",
    },
    {
      type: "image",
      src: "/images/B2_minibag%20(3).png",
      label: "Left Side",
    },
    {
      type: "image",
      src: "/images/B2_minibag%20(4).png",
      label: "Right Side",
    },
  ],
};

export const TEST_BAG_PRODUCTS = [TEST_BAG_PRODUCT, TEST_BAG_PRODUCT_BLUE];
