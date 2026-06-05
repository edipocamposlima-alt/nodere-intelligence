import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/reset-password",
  "/terms",
  "/privacy",
  "/api/auth",
  "/api/webhooks",
  "/_next",
  "/manifest.json",
  "/sw.js",
  "/favicon",
  "/icons",
  "/nodere"
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }
  const token = request.cookies.get("nodere_session")?.value;
  if (!token) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*).*)", "/manifest.json"]
};
