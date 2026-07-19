import { createHmac, timingSafeEqual } from "node:crypto";
import { config } from "../config.js";

export type SessionRole = "owner" | "admin" | "operator" | "viewer";

export interface AdminSession {
  email: string;
  name?: string;
  role: SessionRole;
  workspaceId: string;
  userId?: string;
  exp: number;
}

const BUILTIN_OWNER_EMAIL = "edipo.lima@nodere.com.br";
const BUILTIN_OWNER_NAME = "Édipo Lima";

function normalizeRole(role?: string): SessionRole {
  return role === "owner" ? "owner" : role === "admin" ? "admin" : role === "viewer" ? "viewer" : "operator";
}

export function isBuiltInOwnerEmail(email?: string) {
  return String(email || "").trim().toLowerCase() === BUILTIN_OWNER_EMAIL;
}

export function normalizeAdminSession(data: AdminSession): AdminSession {
  const email = String(data.email || "").trim().toLowerCase();
  const isBuiltInOwner = isBuiltInOwnerEmail(email);
  return {
    ...data,
    email,
    name: isBuiltInOwner ? BUILTIN_OWNER_NAME : data.name,
    role: isBuiltInOwner ? "owner" : normalizeRole(data.role),
    workspaceId: data.workspaceId || "default",
    userId: isBuiltInOwner ? data.userId || "admin-default" : data.userId
  };
}

function sign(payload: string) {
  if (!config.admin.sessionSecret) {
    throw Object.assign(new Error("ADMIN_SESSION_SECRET não configurado."), {
      status: 503,
      code: "ADMIN_SESSION_SECRET_MISSING"
    });
  }
  return createHmac("sha256", config.admin.sessionSecret).update(payload).digest("base64url");
}

export function issueSessionToken(input: Omit<AdminSession, "exp">) {
  const payload = Buffer.from(JSON.stringify({
    ...input,
    workspaceId: input.workspaceId || "default",
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7
  })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token = ""): AdminSession | null {
  if (!config.admin.sessionSecret) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AdminSession;
    if (!data.exp || data.exp < Date.now()) return null;
    return normalizeAdminSession(data);
  } catch {
    return null;
  }
}

export function extractBearerToken(authorization = "") {
  return String(authorization || "").replace(/^Bearer\s+/i, "");
}
