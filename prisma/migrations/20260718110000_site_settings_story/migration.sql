-- AlterTable: add editable "Our Story" homepage section fields
ALTER TABLE "SiteSettings" ADD COLUMN "storyImage" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteSettings" ADD COLUMN "storyTitle" TEXT NOT NULL DEFAULT 'The Heart of Zrochet';
ALTER TABLE "SiteSettings" ADD COLUMN "storyText" TEXT NOT NULL DEFAULT E'Zrochet began with a simple belief: that everyday objects deserve the warmth of human hands. What started as a quiet hobby at the kitchen table has blossomed into a boutique studio dedicated to slow, intentional craftsmanship.\n\nEvery stitch is placed with purpose. We source soft, premium yarns in earthy tones and transform them into bags, purses, and gifts that carry a piece of our story — and soon, a piece of yours.';
ALTER TABLE "SiteSettings" ADD COLUMN "storyPoint1" TEXT NOT NULL DEFAULT '100% handmade, never mass-produced';
ALTER TABLE "SiteSettings" ADD COLUMN "storyPoint2" TEXT NOT NULL DEFAULT 'Eco-conscious yarn & packaging';
ALTER TABLE "SiteSettings" ADD COLUMN "storyPoint3" TEXT NOT NULL DEFAULT 'Custom orders welcome';
