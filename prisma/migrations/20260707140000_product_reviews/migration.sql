CREATE TABLE IF NOT EXISTS "ProductReview" (
  "id" TEXT NOT NULL,
  "categorySlug" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "authorName" TEXT NOT NULL,
  "rating" INTEGER NOT NULL DEFAULT 5,
  "title" TEXT,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ProductReview_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ProductReview_categorySlug_productId_createdAt_idx"
  ON "ProductReview"("categorySlug", "productId", "createdAt");

ALTER TABLE "ProductReview"
  ADD CONSTRAINT "ProductReview_categorySlug_productId_fkey"
  FOREIGN KEY ("categorySlug", "productId")
  REFERENCES "Product"("categorySlug", "productId")
  ON DELETE CASCADE ON UPDATE CASCADE;
