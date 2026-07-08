-- AlterTable
ALTER TABLE "Product" ADD COLUMN "quantity" INTEGER NOT NULL DEFAULT 0;

UPDATE "Product"
SET "quantity" = CASE WHEN "inStock" THEN 10 ELSE 0 END;

UPDATE "Product"
SET "inStock" = ("quantity" > 0);
