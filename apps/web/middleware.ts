import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  const protectedStandaloneRoutes = ["/catalog", "/proposals"];
  const isProtectedStandaloneRoute = protectedStandaloneRoutes.some((path) => (
    req.nextUrl.pathname === path || req.nextUrl.pathname.startsWith(`${path}/`)
  ));
  const isAppRoute = req.nextUrl.pathname.startsWith("/app");
  const isAuthRoute = [
    "/app/login",
    "/app/register",
    "/app/forgot-password",
    "/app/reset-password",
    "/app/accept-invite"
  ].includes(req.nextUrl.pathname);

  if ((isAppRoute || isProtectedStandaloneRoute) && !isAuthRoute && !session) {
    return NextResponse.redirect(new URL("/app/login", req.url));
  }

  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/app/dashboard", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/app/:path*", "/catalog/:path*", "/proposals/:path*"]
};
