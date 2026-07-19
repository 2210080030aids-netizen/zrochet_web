import { NextResponse } from "next/server";
import { ADMIN_COOKIE, getAdminLoginKey } from "@/lib/admin-auth";

function clearCookie(response: NextResponse) {
  response.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
    sameSite: "lax",
  });
}

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const wantsJson =
    request.headers.get("accept")?.includes("application/json") ||
    request.headers.get("x-requested-with") === "XMLHttpRequest";

  if (wantsJson) {
    const response = NextResponse.json({ ok: true });
    clearCookie(response);
    return response;
  }

  const loginUrl = new URL("/admin/login", origin);
  loginUrl.searchParams.set("key", getAdminLoginKey());
  // 303 forces the browser to GET the login page after the POST logout.
  const response = NextResponse.redirect(loginUrl, 303);
  clearCookie(response);
  return response;
}
