-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "upiId" TEXT NOT NULL DEFAULT 'sarathbhushan04@oksbi';
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "upiPayeeName" TEXT NOT NULL DEFAULT 'Zrochet';
