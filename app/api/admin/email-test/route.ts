import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getEmailConfigStatus, sendTestEmail } from "@/lib/email";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = getEmailConfigStatus();
  return NextResponse.json({
    ...status,
    runtime: process.env.RAILWAY_ENVIRONMENT ? "railway" : "local",
  });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const to = typeof body.to === "string" ? body.to.trim() : "";

  if (!to || !to.includes("@")) {
    return NextResponse.json({ error: "Valid email address required" }, { status: 400 });
  }

  const status = getEmailConfigStatus();
  if (!status.configured) {
    return NextResponse.json(
      { sent: false, error: status.hint, status },
      { status: 400 }
    );
  }

  const result = await sendTestEmail(to);
  return NextResponse.json({ ...result, status });
}
