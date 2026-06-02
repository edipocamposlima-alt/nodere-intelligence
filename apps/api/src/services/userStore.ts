import { randomBytes, scryptSync, timingSafeEqual, randomUUID } from "node:crypto";
import { config } from "../config.js";
import { getSupabase, hasSupabase } from "../db/supabase.js";
import { SessionRole } from "./adminSession.js";

export interface PlatformUser {
  id: string;
  workspaceId: string;
  name: string;
  email: string;
  role: SessionRole;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface PlatformUserRow {
  id: string;
  workspace_id: string;
  name: string;
  email: string;
  role: SessionRole;
  active: boolean;
  password_hash: string;
  created_at: string;
  updated_at?: string;
}

const memoryUsers = new Map<string, PlatformUserRow>();

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function toPublic(row: PlatformUserRow): PlatformUser {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    email: row.email,
    role: row.role,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string) {
  const [, salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const actual = Buffer.from(scryptSync(password, salt, 64).toString("hex"));
  const expected = Buffer.from(hash);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

async function ensureWorkspace(workspaceId: string, ownerEmail: string, name = "Agência Digital") {
  if (!hasSupabase()) return;
  const sb = getSupabase()!;
  await sb.from("nodere_workspaces").upsert({
    id: workspaceId,
    name,
    owner_email: ownerEmail,
    updated_at: new Date().toISOString()
  }, { onConflict: "id" });
}

export async function ensureDefaultAdminUser() {
  const email = normalizeEmail(config.admin.email);
  if (!config.admin.password || !email) return;
  const now = new Date().toISOString();
  const fallback: PlatformUserRow = {
    id: "admin-default",
    workspace_id: "default",
    name: "Administrador",
    email,
    role: "admin",
    active: true,
    password_hash: hashPassword(config.admin.password),
    created_at: now,
    updated_at: now
  };

  if (!hasSupabase()) {
    if (!memoryUsers.has(email)) memoryUsers.set(email, fallback);
    return;
  }

  await ensureWorkspace("default", email);
  const sb = getSupabase()!;
  const { data, error } = await sb
    .from("nodere_platform_users")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    const { error: insertError } = await sb.from("nodere_platform_users").insert(fallback);
    if (insertError) throw insertError;
  }
}

export async function authenticateUser(emailInput: string, password: string) {
  await ensureDefaultAdminUser();
  const email = normalizeEmail(emailInput);

  if (hasSupabase()) {
    const sb = getSupabase()!;
    const { data, error } = await sb
      .from("nodere_platform_users")
      .select("*")
      .eq("email", email)
      .eq("active", true)
      .maybeSingle();
    if (error) throw error;
    const row = data as PlatformUserRow | null;
    if (row && verifyPassword(password, row.password_hash)) return toPublic(row);
  }

  const row = memoryUsers.get(email);
  if (row?.active && verifyPassword(password, row.password_hash)) return toPublic(row);
  return null;
}

export async function listWorkspaceUsers(workspaceId: string) {
  await ensureDefaultAdminUser();
  if (hasSupabase()) {
    const sb = getSupabase()!;
    const { data, error } = await sb
      .from("nodere_platform_users")
      .select("id, workspace_id, name, email, role, active, created_at, updated_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return ((data ?? []) as unknown as PlatformUserRow[]).map(toPublic);
  }
  return [...memoryUsers.values()].filter((u) => u.workspace_id === workspaceId).map(toPublic);
}

export async function createWorkspaceUser(workspaceId: string, input: { name: string; email: string; password: string; role: SessionRole }) {
  await ensureDefaultAdminUser();
  const now = new Date().toISOString();
  const row: PlatformUserRow = {
    id: randomUUID(),
    workspace_id: workspaceId,
    name: input.name.trim(),
    email: normalizeEmail(input.email),
    role: input.role === "admin" ? "admin" : "operator",
    active: true,
    password_hash: hashPassword(input.password),
    created_at: now,
    updated_at: now
  };

  if (hasSupabase()) {
    const sb = getSupabase()!;
    const { error } = await sb.from("nodere_platform_users").insert(row);
    if (error) throw error;
  } else {
    if ([...memoryUsers.values()].some((u) => u.email === row.email)) {
      const error = new Error("Já existe usuário com este e-mail.") as Error & { status?: number };
      error.status = 409;
      throw error;
    }
    memoryUsers.set(row.email, row);
  }

  return toPublic(row);
}

export async function updateWorkspaceUser(workspaceId: string, userId: string, input: { name?: string; role?: SessionRole; active?: boolean; password?: string }) {
  const fields: Partial<PlatformUserRow> = { updated_at: new Date().toISOString() };
  if (input.name !== undefined) fields.name = input.name.trim();
  if (input.role !== undefined) fields.role = input.role === "admin" ? "admin" : "operator";
  if (input.active !== undefined) fields.active = Boolean(input.active);
  if (input.password) fields.password_hash = hashPassword(input.password);

  if (hasSupabase()) {
    const sb = getSupabase()!;
    const { data, error } = await sb
      .from("nodere_platform_users")
      .update(fields)
      .eq("workspace_id", workspaceId)
      .eq("id", userId)
      .select("id, workspace_id, name, email, role, active, created_at, updated_at")
      .maybeSingle();
    if (error) throw error;
    return data ? toPublic(data as unknown as PlatformUserRow) : null;
  }

  const row = [...memoryUsers.values()].find((u) => u.workspace_id === workspaceId && u.id === userId);
  if (!row) return null;
  Object.assign(row, fields);
  return toPublic(row);
}

