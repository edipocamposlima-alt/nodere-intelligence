import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/apiBase";

const COOKIE_NAMES = ["nodere_session", "nodere-session"];

export async function GET(request: NextRequest) {
  const token = COOKIE_NAMES.map((name) => request.cookies.get(name)?.value).find(Boolean);
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
  const displayName =
    payload.user?.name ||
    payload.session?.name ||
    payload.members?.find?.((member: { email?: string }) => member.email === payload.user?.email)?.name ||
    formatDisplayName(payload.user?.email);
  return NextResponse.json({
    user: {
      id: payload.user?.id ?? payload.user?.userId,
      email: payload.user?.email,
      name: displayName,
      avatar_url: payload.user?.avatar_url,
      role: payload.user?.role ?? "operator"
    },
    workspace: {
      id: payload.workspace?.id,
      name: payload.workspace?.name ?? "Workspace NODERE"
    }
  });
}

function formatDisplayName(email?: string) {
  const raw = String(email || "Usuário").split("@")[0].replace(/[._-]+/g, " ");
  return raw.split(" ").filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(" ") || "Usuário";
}
