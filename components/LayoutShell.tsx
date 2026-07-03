"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { SiteSettingsData } from "@/lib/catalog";

export default function LayoutShell({
  children,
  footerSettings,
}: {
  children: React.ReactNode;
  footerSettings: SiteSettingsData;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer settings={footerSettings} />
    </>
  );
}
