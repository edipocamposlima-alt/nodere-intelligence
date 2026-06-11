import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/apiBase";

const COOKIE_NAMES = ["nodere_session", "nodere-session"];

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

async function proxyAdmin(request: NextRequest, context: RouteContext) {
  const { path = [] } = await context.params;
  const tokenFromHeader = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  const tokenFromCookie = COOKIE_NAMES.map((name) => request.cookies.get(name)?.value).find(Boolean);
  const token = tokenFromHeader || tokenFromCookie;

  if (!token) {
    return NextResponse.json({ message: "Sessão ausente. Faça login para continuar." }, { status: 401 });
  }

  const search = request.nextUrl.search || "";
  const target = `${getApiBaseUrl()}/admin/${path.map(encodeURIComponent).join("/")}${search}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`
  };

  const contentType = request.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType;

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store"
  };

  if (!["GET", "HEAD"].includes(request.method)) {
    init.body = await request.text();
  }

  try {
    const response = await fetch(target, init);
    const text = await response.text();
    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", response.headers.get("content-type") || "application/json");
    return new NextResponse(text, { status: response.status, headers: responseHeaders });
  } catch {
    return NextResponse.json(
      { message: "Não foi possível conectar ao backend administrativo agora." },
      { status: 502 }
    );
  }
}

export const GET = proxyAdmin;
export const POST = proxyAdmin;
export const PATCH = proxyAdmin;
export const DELETE = proxyAdmin;
