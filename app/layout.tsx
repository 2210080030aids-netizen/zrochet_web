import type { Metadata } from "next";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
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
  title: "Zrochet — Handcrafted Crochet Creations",
  description: "Premium handcrafted crochet bags, purses, and gifts made with love.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const footerSettings = await getSiteSettings();

  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen flex flex-col">
        <Providers>
          <LayoutShell footerSettings={footerSettings}>{children}</LayoutShell>
        </Providers>
      </body>
    </html>
  );
}
