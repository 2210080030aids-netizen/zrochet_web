import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_COOKIE = "zrochet_admin";

export function middleware(request: NextRequest) {
  // Forward the ?key=... value to the admin dashboard layout via a request
  // header so it can enforce the secret key on every admin route. If even one
  // letter is off, the layout renders our styled "page not found".
  const urlKey = request.nextUrl.searchParams.get("key") ?? "";
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-admin-url-key", urlKey);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // Landing on the login page always starts a fresh session, so a stale cookie
  // from a previous login can never keep the admin area open for a different email.
  if (request.nextUrl.pathname === "/admin/login") {
    response.cookies.set(ADMIN_COOKIE, "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
