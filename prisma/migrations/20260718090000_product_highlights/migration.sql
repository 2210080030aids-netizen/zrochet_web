-- AlterTable
ALTER TABLE "Product"
ADD COLUMN "highlights" JSONB NOT NULL DEFAULT '["freeDelivery","secureCheckout","easyReturns"]';
