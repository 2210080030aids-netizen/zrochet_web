import type { Metadata } from "next";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import "./globals.css";
import LayoutShell from "@/components/LayoutShell";
import { getSiteSettings } from "@/lib/catalog";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-display",
});

const body = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://zrochetweb-production.up.railway.app"
  ),
  title: "Zrochet — Handcrafted Crochet Creations",
  description: "Premium handcrafted crochet bags, purses, and gifts made with love.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const footerSettings = await getSiteSettings();

  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen flex flex-col">
        <LayoutShell footerSettings={footerSettings}>{children}</LayoutShell>
      </body>
    </html>
  );
}
