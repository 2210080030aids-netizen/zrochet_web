import Link from "next/link";
import type { SiteSettingsData } from "@/lib/catalog";
import { formatInstagramLabel } from "@/lib/instagram";

const DEFAULT_SETTINGS: SiteSettingsData = {
  email: "hello@zrochet.com",
  phone: "+91 98765 43210",
  address: "123 Artisan Lane, India",
  footerText:
    "Handcrafted crochet creations made with love, patience, and a touch of magic.",
  heroImage: "/images/welcome.png",
  upiId: "sarathbhushan04@oksbi",
  upiPayeeName: "Zrochet",
  instagramUrl: "https://www.instagram.com/zrochet_12?igsh=MWcwOTQzZzhrajh6",
  heroEyebrow: "Artisan Made · One of a Kind",
  heroTitle: "Handcrafted Crochet Creations",
  heroText:
    "Discover beautifully handmade crochet bags, purses, and thoughtful gifts — each piece woven with care, warmth, and timeless charm.",
  storyImage: "",
  storyTitle: "The Heart of Zrochet",
  storyText: "",
  storyPoint1: "",
  storyPoint2: "",
  storyPoint3: "",
};

export default function Footer({ settings = DEFAULT_SETTINGS }: { settings?: SiteSettingsData }) {
  return (
    <footer id="contact" className="border-t border-sand bg-beige py-12 lg:py-16">
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <Link href="/" className="font-display text-2xl font-bold text-brown-dark">
              Zrochet
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-text-muted">
              {settings.footerText}
            </p>
          </div>

          <div>
            <h3 className="font-display text-lg font-semibold text-brown-dark">Quick Links</h3>
            <ul className="mt-4 space-y-2 text-sm text-text-muted">
              <li><Link href="/#home" className="transition hover:text-brown-dark">Home</Link></li>
              <li><Link href="/#shop" className="transition hover:text-brown-dark">Shop</Link></li>
              <li><Link href="/#collections" className="transition hover:text-brown-dark">Collections</Link></li>
              <li><Link href="/#about" className="transition hover:text-brown-dark">About Us</Link></li>
              <li><Link href="/#contact" className="transition hover:text-brown-dark">Contact</Link></li>
              <li><Link href="/track" className="transition hover:text-brown-dark">Track Order</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-lg font-semibold text-brown-dark">Contact</h3>
            <ul className="mt-4 space-y-2 text-sm text-text-muted">
              <li>{settings.email}</li>
              <li>{settings.phone}</li>
              <li style={{ whiteSpace: "pre-line" }}>{settings.address}</li>
              {settings.instagramUrl && (
                <li>
                  <a
                    href={settings.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition hover:text-brown-dark"
                  >
                    Instagram {formatInstagramLabel(settings.instagramUrl)}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-sand pt-6 text-center text-xs text-text-muted sm:flex-row sm:text-left">
          <p>&copy; 2026 Zrochet. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="transition hover:text-brown-dark">Privacy Policy</Link>
            <Link href="#" className="transition hover:text-brown-dark">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
