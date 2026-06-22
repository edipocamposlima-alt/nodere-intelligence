import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/apiBase";

const COOKIE_NAMES = ["nodere_session", "nodere-session"];
type RouteContext = { params: Promise<{ path?: string[] }> };

async function proxyContent(request: NextRequest, context: RouteContext) {
  const { path = [] } = await context.params;
  const tokenFromHeader = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  const tokenFromCookie = COOKIE_NAMES.map((name) => request.cookies.get(name)?.value).find(Boolean);
  const token = tokenFromCookie || tokenFromHeader;

  if (!token) return NextResponse.json({ message: "Sessão ausente. Faça login para continuar." }, { status: 401 });
  if (path[0] !== "admin") return NextResponse.json({ message: "Rota não permitida neste proxy." }, { status: 404 });

  const target = `${getApiBaseUrl()}/content/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  const contentType = request.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType;

  const init: RequestInit = { method: request.method, headers, cache: "no-store" };
  if (!['GET', 'HEAD'].includes(request.method)) init.body = await request.arrayBuffer();

  try {
    const response = await fetch(target, init);
    return new NextResponse(await response.arrayBuffer(), {
      status: response.status,
      headers: { "Content-Type": response.headers.get("content-type") || "application/json" }
    });
  } catch {
    return NextResponse.json({ message: "Não foi possível conectar ao backend de conteúdo agora." }, { status: 502 });
  }
}

export const GET = proxyContent;
export const POST = proxyContent;
export const PATCH = proxyContent;
export const DELETE = proxyContent;
