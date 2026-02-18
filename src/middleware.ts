import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check for access token in cookie (set by auth provider)
  const hasToken = req.cookies.get("lexsuite_access_token")?.value;

  // Protected routes: redirect to login if no token
  const protectedPrefixes = ["/dashboard", "/matters", "/calendar", "/notifications", "/admin"];
  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (isProtected && !hasToken) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Auth routes: redirect to dashboard if already logged in
  if ((pathname === "/login" || pathname === "/register") && hasToken) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/matters/:path*", "/calendar/:path*", "/notifications/:path*", "/admin/:path*", "/login", "/register"],
};
