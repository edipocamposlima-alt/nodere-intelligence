import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/reset-password",
  "/forgot-password",
  "/planos",
  "/precos",
  "/plans",
  "/solucoes",
  "/blog",
  "/contato",
  "/terms",
  "/privacy",
  "/termos",
  "/privacidade",
  "/pagina",
  "/manual",
  "/index.html",
  "/app/login",
  "/app/register",
  "/api/admin",
  "/api/content",
  "/api/auth",
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
    return NextResponse.next();
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
