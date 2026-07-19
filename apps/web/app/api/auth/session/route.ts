import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/apiBase";

const COOKIE_NAMES = ["nodere_session", "nodere-session"];

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const token = typeof body.access_token === "string" ? body.access_token : typeof body.token === "string" ? body.token : "";
  if (!token) {
    return NextResponse.json({ message: "Token ausente." }, { status: 400 });
  }
  const validation = await fetch(`${getApiBaseUrl()}/workspace/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  }).catch(() => null);
  if (!validation) {
    return NextResponse.json({ message: "Serviço de autenticação indisponível." }, { status: 503 });
  }
  if (!validation.ok) {
    return NextResponse.json({ message: "Token de sessão inválido." }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  for (const name of COOKIE_NAMES) {
    response.cookies.set(name, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });
  }
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  for (const name of COOKIE_NAMES) {
    response.cookies.delete(name);
  }
  return response;
}
