import { createHmac, timingSafeEqual } from "node:crypto";
import { config } from "../config.js";

export type SessionRole = "owner" | "admin" | "operator" | "viewer";

export interface AdminSession {
  email: string;
  role: SessionRole;
  workspaceId: string;
  userId?: string;
  exp: number;
}

function sign(payload: string) {
  return createHmac("sha256", config.admin.sessionSecret).update(payload).digest("base64url");
}

export function issueSessionToken(input: Omit<AdminSession, "exp">) {
  const payload = Buffer.from(JSON.stringify({
    ...input,
    workspaceId: input.workspaceId || "default",
    exp: Date.now() + 1000 * 60 * 60 * 12
  })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token = ""): AdminSession | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AdminSession;
    if (!data.exp || data.exp < Date.now()) return null;
    return {
      ...data,
      role: data.role === "owner" ? "owner" : data.role === "admin" ? "admin" : data.role === "viewer" ? "viewer" : "operator",
      workspaceId: data.workspaceId || "default"
    };
  } catch {
    return null;
  }
}

export function extractBearerToken(authorization = "") {
  return String(authorization || "").replace(/^Bearer\s+/i, "");
}
