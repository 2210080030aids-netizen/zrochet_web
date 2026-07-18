-- AlterTable: add structured delivery address fields to Order
ALTER TABLE "Order" ADD COLUMN "country" TEXT NOT NULL DEFAULT 'India';
ALTER TABLE "Order" ADD COLUMN "addressLine1" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Order" ADD COLUMN "addressLine2" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Order" ADD COLUMN "city" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Order" ADD COLUMN "state" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Order" ADD COLUMN "pinCode" TEXT NOT NULL DEFAULT '';
