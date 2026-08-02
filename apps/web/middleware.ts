import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/reset-password",
  "/forgot-password",
  "/terms",
  "/privacy",
  "/termos",
  "/privacidade",
  "/index.html",
  "/app/login",
  "/api/admin",
  "/api/content",
  "/api/auth",
  "/api/backend",
  "/api/webhooks",
  "/_next",
  "/favicon.ico",
  "/favicon",
  "/favicon-",
  "/nodere",
  "/logo-nodere",
  "/android-chrome",
  "/apple-touch-icon",
  "/brand-logo-official",
  "/brand-icon-official",
  "/icon-",
  "/og-image",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.json",
  "/manifest.webmanifest",
  "/sw.js",
  "/offline.html",
  "/icons"
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get("nodere_session")?.value || request.cookies.get("nodere-session")?.value;

  if (pathname === "/app/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/app/register") {
    return NextResponse.redirect(new URL("/register", request.url));
  }

  if (pathname === "/") {
    if (session) return NextResponse.redirect(new URL("/ai", request.url));
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  if (isPublic) return NextResponse.next();

  if (!session || !hasPlausibleSessionShape(session)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("nodere_session");
    response.cookies.delete("nodere-session");
    return response;
  }

  return NextResponse.next();
}

function hasPlausibleSessionShape(value: string) {
  if (value.length < 40 || value.length > 8_192 || !/^[A-Za-z0-9._-]+$/.test(value)) return false;
  const parts = value.split(".");
  if (parts.length === 2) return parts[0].length >= 16 && parts[1].length >= 32;
  if (parts.length === 3) return parts.every((part) => part.length >= 8);
  return false;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
