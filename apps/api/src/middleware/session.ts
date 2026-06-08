import { NextFunction, Request, Response } from "express";
import { extractBearerToken, verifySessionToken } from "../services/adminSession.js";
import { getSupabase, hasSupabase } from "../db/supabase.js";
import { ensureSupabaseAuthUser } from "../services/userStore.js";

export async function attachSession(request: Request, _response: Response, next: NextFunction) {
  const token = extractBearerToken(request.headers.authorization);
  const session = verifySessionToken(token);
  if (session) {
    (request as any).session = session;
    return next();
  }

  if (token && hasSupabase()) {
    try {
      const sb = getSupabase()!;
      const { data, error } = await sb.auth.getUser(token);
      if (!error && data.user?.email) {
        const user = await ensureSupabaseAuthUser({
          authUserId: data.user.id,
          email: data.user.email,
          name: String(data.user.user_metadata?.name || data.user.user_metadata?.full_name || "")
        });
        (request as any).session = {
          email: user.email,
          role: user.role,
          workspaceId: user.workspaceId,
          userId: user.id,
          exp: Date.now() + 1000 * 60 * 30
        };
      }
    } catch {
      // Invalid Supabase JWTs are ignored here; protected routes still return 401.
    }
  }
  next();
}

export function getRequestWorkspaceId(request: Request) {
  return ((request as any).session?.workspaceId as string | undefined) || "default";
}

export function isPrivilegedSession(request: Request) {
  const role = (request as any).session?.role;
  return role === "owner" || role === "admin";
}

export function requireWorkspaceSession(request: Request, response: Response, next: NextFunction) {
  if (!(request as any).session) {
    return response.status(401).json({ error: "Unauthorized", message: "Login obrigatório." });
  }
  return next();
}

export function requireWorkspaceRole(...roles: Array<"owner" | "admin" | "operator" | "viewer">) {
  return (request: Request, response: Response, next: NextFunction) => {
    const session = (request as any).session;
    if (!session) return response.status(401).json({ error: "Unauthorized", message: "Login obrigatório." });
    if (!roles.includes(session.role)) {
      return response.status(403).json({ error: "Forbidden", message: "Você não tem permissão para esta ação." });
    }
    return next();
  };
}
