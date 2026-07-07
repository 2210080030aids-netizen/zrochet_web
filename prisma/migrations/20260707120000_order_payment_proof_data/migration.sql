-- Store payment screenshots in Postgres so they survive Railway redeploys
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentProofMime" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentProofData" BYTEA;
