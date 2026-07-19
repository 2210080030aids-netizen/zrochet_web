import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  createAdminSessionToken,
  isAllowedAdminEmail,
  verifyAdminPassword,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  // Only allowlisted emails with the correct password may sign in.
  if (!isAllowedAdminEmail(email) || !verifyAdminPassword(password)) {
    // Drop any existing session so a rejected attempt cannot ride on a
    // previously authorized cookie.
    const denied = NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    denied.cookies.set(ADMIN_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
    return denied;
  }

  const response = NextResponse.json({ ok: true });
  // Session cookie only — never persist login across browser restarts.
  response.cookies.set(ADMIN_COOKIE, createAdminSessionToken(email), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return response;
}
