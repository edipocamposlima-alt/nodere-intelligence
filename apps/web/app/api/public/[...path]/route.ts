import { NextRequest, NextResponse } from "next/server";
import { getDirectApiBaseUrl } from "@/lib/apiBase";
import { rejectCrossOriginMutation } from "@/lib/requestSecurity";

type RouteContext = { params: Promise<{ path?: string[] }> };

async function proxyPublic(request: NextRequest, context: RouteContext) {
  const rejected = rejectCrossOriginMutation(request);
  if (rejected) return rejected;

  const { path = [] } = await context.params;
  const key = path.join("/");
  const allowed = (request.method === "GET" && key === "content/navigation") || (request.method === "POST" && key === "contact");
  if (!allowed) return NextResponse.json({ message: "Rota pública não permitida." }, { status: 404 });

  const target = `${getDirectApiBaseUrl()}/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: request.method === "GET" ? undefined : await request.arrayBuffer(),
      cache: "no-store"
    });
    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") || "application/json" }
    });
  } catch {
    return NextResponse.json({ message: "Serviço público temporariamente indisponível." }, { status: 502 });
  }
}

export const GET = proxyPublic;
export const POST = proxyPublic;
