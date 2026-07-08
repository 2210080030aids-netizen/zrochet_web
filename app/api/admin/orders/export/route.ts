import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { buildOrdersCsv } from "@/lib/orders-export";
import { buildOrderWhereClause, parseOrderFilters } from "@/lib/order-filters";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filters = parseOrderFilters({
    status: searchParams.get("status") ?? undefined,
    q: searchParams.get("q") ?? undefined,
  });
  const where = buildOrderWhereClause(filters);

  const orders = await prisma.order.findMany({ where, orderBy: { createdAt: "desc" } });
  const csv = buildOrdersCsv(orders);
  const date = new Date().toISOString().slice(0, 10);
  const suffix = filters.status ? `-${filters.status}` : "";

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="zrochet-orders${suffix}-${date}.csv"`,
    },
  });
}
