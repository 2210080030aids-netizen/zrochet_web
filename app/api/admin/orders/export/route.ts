import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { buildOrdersCsv } from "@/lib/orders-export";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" } });
  const csv = buildOrdersCsv(orders);
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="zrochet-orders-${date}.csv"`,
    },
  });
}
