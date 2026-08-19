import { NextRequest, NextResponse } from "next/server";
import { getDirectApiBaseUrl } from "@/lib/apiBase";
import { rejectCrossOriginMutation } from "@/lib/requestSecurity";

type RouteContext = { params: Promise<{ path?: string[] }> };

const TARGETS: Record<string, string> = {
  login: "admin/login",
  "supabase-session": "admin/supabase-session",
  workspace: "workspace"
};

export async function POST(request: NextRequest, context: RouteContext) {
  const rejected = rejectCrossOriginMutation(request);
  if (rejected) return rejected;

  const { path = [] } = await context.params;
  const targetPath = path.length === 1 ? TARGETS[path[0]] : undefined;
  if (!targetPath) return NextResponse.json({ message: "Operação de autenticação não permitida." }, { status: 404 });

  const headers = new Headers();
  for (const name of ["content-type", "authorization"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  try {
    const upstream = await fetch(`${getDirectApiBaseUrl()}/${targetPath}`, {
      method: "POST",
      headers,
      body: await request.arrayBuffer(),
      cache: "no-store"
    });
    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") || "application/json" }
    });
  } catch {
    return NextResponse.json({ message: "Serviço de autenticação temporariamente indisponível." }, { status: 502 });
  }
}
