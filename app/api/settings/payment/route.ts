import { NextResponse } from "next/server";
import { fetchSiteSettings } from "@/lib/catalog-db";

export async function GET() {
  const settings = await fetchSiteSettings();
  return NextResponse.json({
    upiId: settings.upiId,
    upiPayeeName: settings.upiPayeeName,
  });
}
