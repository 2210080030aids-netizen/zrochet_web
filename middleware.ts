import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_COOKIE = "zrochet_admin";

async function getExpectedToken(): Promise<string> {
  const secret = process.env.ADMIN_PASSWORD || "zrochet-admin-change-me";
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode("zrochet-admin-session")
  );
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function clearAdminCookie(response: NextResponse) {
  response.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
    sameSite: "lax",
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminUi = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");

  // Visiting the storefront UI ends the admin session.
  // Do not clear on public API calls (media, products, etc.).
  if (!isAdminUi && !isAdminApi) {
    if (pathname.startsWith("/api/") || pathname.startsWith("/_next/")) {
      return NextResponse.next();
    }
    const response = NextResponse.next();
    if (request.cookies.get(ADMIN_COOKIE)) {
      clearAdminCookie(response);
    }
    return response;
  }

  if (!isAdminUi) {
    return NextResponse.next();
  }

  // Always allow the login page itself (no auto bounce — avoids logout/login loops).
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const expected = await getExpectedToken();
  const token = request.cookies.get(ADMIN_COOKIE)?.value;

  if (token !== expected) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
