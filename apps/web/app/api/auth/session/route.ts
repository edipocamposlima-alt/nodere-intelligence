import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAMES = ["nodere_session", "nodere-session"];

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const token = typeof body.access_token === "string" ? body.access_token : typeof body.token === "string" ? body.token : "";
  if (!token) {
    return NextResponse.json({ message: "Token ausente." }, { status: 400 });
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
