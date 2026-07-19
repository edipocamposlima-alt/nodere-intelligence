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
    if (session) return NextResponse.redirect(new URL("/dashboard", request.url));
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  if (isPublic) return NextResponse.next();

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
