import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/apiBase";

const COOKIE_NAME = "nodere_session";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ message: "Sessão ausente." }, { status: 401 });
  }

  const response = await fetch(`${getApiBaseUrl()}/workspace/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });

  if (!response.ok) {
    return NextResponse.json({ message: "Sessão inválida." }, { status: response.status });
  }

  const payload = await response.json();
  return NextResponse.json({
    user: {
      id: payload.user?.id ?? payload.user?.userId,
      email: payload.user?.email,
      role: payload.user?.role ?? "operator"
    },
    workspace: {
      id: payload.workspace?.id,
      name: payload.workspace?.name ?? "Workspace NODERE"
    }
  });
}
