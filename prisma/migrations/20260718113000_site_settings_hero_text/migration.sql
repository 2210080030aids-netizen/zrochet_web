-- AlterTable: add editable homepage hero text fields
ALTER TABLE "SiteSettings" ADD COLUMN "heroEyebrow" TEXT NOT NULL DEFAULT 'Artisan Made · One of a Kind';
ALTER TABLE "SiteSettings" ADD COLUMN "heroTitle" TEXT NOT NULL DEFAULT 'Handcrafted Crochet Creations';
ALTER TABLE "SiteSettings" ADD COLUMN "heroText" TEXT NOT NULL DEFAULT 'Discover beautifully handmade crochet bags, purses, and thoughtful gifts — each piece woven with care, warmth, and timeless charm.';
