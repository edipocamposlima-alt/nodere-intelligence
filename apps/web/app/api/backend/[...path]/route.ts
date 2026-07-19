import { NextRequest, NextResponse } from "next/server";
import { getDirectApiBaseUrl } from "@/lib/apiBase";

const COOKIE_NAMES = ["nodere_session", "nodere-session"];
type RouteContext = { params: Promise<{ path?: string[] }> };

async function proxyBackend(request: NextRequest, context: RouteContext) {
  const { path = [] } = await context.params;
  const token = COOKIE_NAMES.map((name) => request.cookies.get(name)?.value).find(Boolean);
  if (!token) {
    return NextResponse.json({ message: "Sessão ausente. Faça login para continuar." }, { status: 401 });
  }

  const target = `${getDirectApiBaseUrl()}/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;
  const requestBody = ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer();
  const callBackend = (activeToken: string) => {
    const headers = new Headers({ Authorization: `Bearer ${activeToken}` });
    for (const name of ["accept", "content-type"]) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }
    return fetch(target, {
      method: request.method,
      headers,
      body: requestBody,
      cache: "no-store"
    });
  };

  try {
    let activeToken = token;
    let upstream = await callBackend(activeToken);
    if (upstream.status === 401) {
      const refresh = await fetch(`${getDirectApiBaseUrl()}/admin/session/refresh`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store"
      });
      if (refresh.ok) {
        const payload = await refresh.json().catch(() => ({}));
        if (typeof payload.token === "string" && payload.token) {
          activeToken = payload.token;
          upstream = await callBackend(activeToken);
        }
      }
    }

    const responseHeaders = new Headers();
    for (const name of ["content-type", "content-disposition", "cache-control"]) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    const response = new NextResponse(await upstream.arrayBuffer(), { status: upstream.status, headers: responseHeaders });
    if (activeToken !== token) {
      for (const name of COOKIE_NAMES) {
        response.cookies.set(name, activeToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7
        });
      }
    }
    return response;
  } catch {
    return NextResponse.json({ message: "Não foi possível conectar ao backend agora." }, { status: 502 });
  }
}

export const GET = proxyBackend;
export const POST = proxyBackend;
export const PUT = proxyBackend;
export const PATCH = proxyBackend;
export const DELETE = proxyBackend;
