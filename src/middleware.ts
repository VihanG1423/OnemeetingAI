import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SITE_PASSWORD = "Onemeetingxgateway";
const AUTH_COOKIE = "site-auth";

export function middleware(request: NextRequest) {
  // Allow the password API route through
  if (request.nextUrl.pathname === "/api/auth/password") {
    return NextResponse.next();
  }

  // Allow static assets and Next.js internals through
  if (
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/favicon") ||
    request.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  // Check for auth cookie
  const authCookie = request.cookies.get(AUTH_COOKIE);
  if (authCookie?.value === SITE_PASSWORD) {
    return NextResponse.next();
  }

  // For API routes, return 401
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // For page routes, rewrite to the password page
  const url = request.nextUrl.clone();
  url.pathname = "/password";
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
