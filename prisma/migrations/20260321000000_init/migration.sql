-- CreateTable
CREATE TABLE "Collection" (
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "pattern" TEXT,
    "defaultPrice" INTEGER NOT NULL DEFAULT 500,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "Product" (
    "productId" TEXT NOT NULL,
    "categorySlug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "originalPrice" INTEGER,
    "discountPercent" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "description" TEXT NOT NULL,
    "material" TEXT NOT NULL DEFAULT 'Premium cotton-blend crochet yarn',
    "dimensions" TEXT NOT NULL DEFAULT '18 × 14 × 8 cm (approx.)',
    "care" TEXT NOT NULL DEFAULT 'Spot clean only. Store in a dry place away from direct sunlight.',
    "colors" JSONB NOT NULL DEFAULT '[]',
    "colorVariants" JSONB NOT NULL DEFAULT '[]',
    "sizes" JSONB NOT NULL DEFAULT '["One Size"]',
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 4.8,
    "reviewCount" INTEGER NOT NULL DEFAULT 24,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "deliveryDays" TEXT NOT NULL DEFAULT '3–5 business days',
    "media" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("categorySlug","productId")
);

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "email" TEXT NOT NULL DEFAULT 'hello@zrochet.com',
    "phone" TEXT NOT NULL DEFAULT '+91 98765 43210',
    "address" TEXT NOT NULL DEFAULT '123 Artisan Lane, India',
    "footerText" TEXT NOT NULL DEFAULT 'Handcrafted crochet creations made with love, patience, and a touch of magic.',
    "heroImage" TEXT NOT NULL DEFAULT '/images/welcome.png',

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categorySlug_fkey" FOREIGN KEY ("categorySlug") REFERENCES "Collection"("slug") ON DELETE CASCADE ON UPDATE CASCADE;
