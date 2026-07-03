-- AlterTable
ALTER TABLE "Order" ADD COLUMN "paymentMethod" TEXT DEFAULT 'upi';
ALTER TABLE "Order" ADD COLUMN "paidAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "approvedAt" TIMESTAMP(3);
