import { randomBytes, scryptSync, timingSafeEqual, randomUUID } from "node:crypto";
import { Client } from "pg";
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
  customRoleId?: string | null;
  status?: string;
  lastActiveAt?: string | null;
  visibilityLevel?: string;
  modulePermissions?: Record<string, unknown>;
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
  custom_role_id?: string | null;
  status?: string;
  last_active_at?: string | null;
  visibility_level?: string;
  module_permissions?: Record<string, unknown>;
  password_hash: string;
  created_at: string;
  updated_at?: string;
  auth_user_id?: string | null;
}

const memoryUsers = new Map<string, PlatformUserRow>();
let userSchemaAvailable = true;
const BUILTIN_OWNER_EMAIL = "edipo.lima@nodere.com.br";
const BUILTIN_OWNER_NAME = "Édipo Lima";

function isUserSchemaMissing(error: unknown) {
  const text = error instanceof Error ? error.message : JSON.stringify(error);
  return text.includes("nodere_workspaces") ||
    text.includes("nodere_platform_users") ||
    text.includes("custom_role_id") ||
    text.includes("visibility_level") ||
    text.includes("module_permissions") ||
    text.includes("Could not find the table") ||
    text.includes("42P01");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isBuiltInOwner(email: string) {
  return normalizeEmail(email) === BUILTIN_OWNER_EMAIL;
}

function toPublic(row: PlatformUserRow): PlatformUser {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    email: row.email,
    role: normalizeRole(row.role),
    active: row.active,
    customRoleId: row.custom_role_id ?? null,
    status: row.status || (row.active ? "active" : "inactive"),
    lastActiveAt: row.last_active_at ?? null,
    visibilityLevel: row.visibility_level || "read_edit",
    modulePermissions: row.module_permissions || {},
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

function shouldUseSslForDatabaseUrl(databaseUrl: string) {
  try {
    const host = new URL(databaseUrl).hostname;
    return !["localhost", "127.0.0.1", "::1"].includes(host);
  } catch {
    return true;
  }
}

function getDatabaseUrlCandidates(databaseUrl: string) {
  const candidates = [databaseUrl];
  try {
    const parsed = new URL(databaseUrl);
    const isSupabaseDirect = /^db\.[^.]+\.supabase\.co$/.test(parsed.hostname);
    const directProjectRef = parsed.hostname.match(/^db\.([^.]+)\.supabase\.co$/)?.[1] || "";
    if (isSupabaseDirect && parsed.port === "5432") {
      parsed.port = "6543";
      candidates.push(parsed.toString());
    }
    let configuredProjectRef = "";
    try {
      configuredProjectRef = config.supabase.url ? new URL(config.supabase.url).hostname.split(".")[0] : "";
    } catch {
      configuredProjectRef = "";
    }
    const projectRef = directProjectRef || configuredProjectRef;
    const isSupabaseDatabase = parsed.hostname.endsWith(".supabase.co") || parsed.hostname.endsWith(".supabase.com");
    if (isSupabaseDatabase && projectRef && decodeURIComponent(parsed.username) === "postgres") {
      const withProjectUser = new URL(databaseUrl);
      withProjectUser.username = `postgres.${projectRef}`;
      candidates.push(withProjectUser.toString());
    }
  } catch {
    return candidates;
  }
  return [...new Set(candidates)];
}

function normalizePgConnectionString(databaseUrl: string) {
  try {
    const parsed = new URL(databaseUrl);
    parsed.searchParams.delete("sslmode");
    return parsed.toString();
  } catch {
    return databaseUrl;
  }
}

async function findActiveUserByEmailWithDatabaseUrl(email: string) {
  if (!config.databaseUrl) return null;
  let lastError: unknown;
  for (const databaseUrl of getDatabaseUrlCandidates(config.databaseUrl)) {
    const client = new Client({
      connectionString: normalizePgConnectionString(databaseUrl),
      ssl: shouldUseSslForDatabaseUrl(databaseUrl) ? { rejectUnauthorized: false } : false
    });
    try {
      await client.connect();
      const result = await client.query<PlatformUserRow>(
        `select *
         from public.nodere_platform_users
         where lower(email) = lower($1)
           and active = true
         order by updated_at desc
         limit 1`,
        [email]
      );
      return result.rows[0] || null;
    } catch (error) {
      lastError = error;
    } finally {
      await client.end().catch(() => undefined);
    }
  }
  throw lastError;
}

async function ensureWorkspace(workspaceId: string, _ownerEmail: string, name = "Agência Digital") {
  if (!hasSupabase()) return;
  const sb = getSupabase()!;
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + 14);

  const { data } = await sb.from("nodere_workspaces").select("id").eq("id", workspaceId).maybeSingle();
  if (data?.id) {
    const { error } = await sb.from("nodere_workspaces").update({
      name,
      updated_at: now.toISOString()
    }).eq("id", workspaceId);
    if (error) throw error;
    return;
  }

  const baseWorkspace = {
    id: workspaceId,
    name,
    owner_email: _ownerEmail,
    plan: "trial",
    credits: 20,
    expires_at: expiresAt.toISOString(),
    created_at: now.toISOString(),
    updated_at: now.toISOString()
  };

  const { error } = await sb.from("nodere_workspaces").insert(baseWorkspace);
  if (error) throw error;
}

export async function ensureDefaultAdminUser() {
  const email = normalizeEmail(config.admin.email || BUILTIN_OWNER_EMAIL);
  if (!config.admin.password || !email) return;
  const now = new Date().toISOString();
  const fallback: PlatformUserRow = {
    id: "admin-default",
    workspace_id: "default",
    name: isBuiltInOwner(email) ? BUILTIN_OWNER_NAME : "Administrador",
    email,
    role: "owner",
    active: true,
    status: "active",
    visibility_level: "full",
    module_permissions: {},
    password_hash: hashPassword(config.admin.password),
    created_at: now,
    updated_at: now
  };

  if (!hasSupabase() || !userSchemaAvailable) {
    if (!memoryUsers.has(email)) memoryUsers.set(email, fallback);
    return;
  }

  try {
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
    } else if (isBuiltInOwner(email)) {
      const { error: updateError } = await sb.from("nodere_platform_users").update({
        name: BUILTIN_OWNER_NAME,
        role: "owner",
        active: true,
        status: "active",
        visibility_level: "full",
        updated_at: now
      }).eq("id", data.id);
      if (updateError) throw updateError;
    }
  } catch (error) {
    if (isUserSchemaMissing(error)) {
      userSchemaAvailable = false;
      if (!memoryUsers.has(email)) memoryUsers.set(email, fallback);
      return;
    }
    throw error;
  }
}

export async function authenticateUser(emailInput: string, password: string) {
  await ensureDefaultAdminUser();
  const email = normalizeEmail(emailInput);

  if (hasSupabase() && userSchemaAvailable) {
    const sb = getSupabase()!;
    try {
      const { data, error } = await sb
        .from("nodere_platform_users")
        .select("*")
        .eq("email", email)
        .eq("active", true)
        .maybeSingle();
      if (error) throw error;
      const row = data as PlatformUserRow | null;
      if (row && verifyPassword(password, row.password_hash)) {
        if (isBuiltInOwner(email) && (row.role !== "owner" || !row.active || row.visibility_level !== "full")) {
          const fixed = await promoteBuiltInOwner(row);
          return toPublic(fixed);
        }
        return toPublic(row);
      }
    } catch (error) {
      if (!isUserSchemaMissing(error)) throw error;
      userSchemaAvailable = false;
    }
  }

  const databaseRow = await findActiveUserByEmailWithDatabaseUrl(email);
  if (databaseRow && verifyPassword(password, databaseRow.password_hash)) {
    if (isBuiltInOwner(email) && (databaseRow.role !== "owner" || !databaseRow.active || databaseRow.visibility_level !== "full")) {
      const fixed = await promoteBuiltInOwner(databaseRow);
      return toPublic(fixed);
    }
    return toPublic(databaseRow);
  }

  const row = memoryUsers.get(email);
  if (row?.active && verifyPassword(password, row.password_hash)) return toPublic(row);
  return null;
}

export async function listWorkspaceUsers(workspaceId: string) {
  if (hasSupabase() && userSchemaAvailable) {
    const sb = getSupabase()!;
      const { data, error } = await sb
        .from("nodere_platform_users")
        .select("*")
        .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true });
    if (error) {
      if (isUserSchemaMissing(error)) {
        userSchemaAvailable = false;
      } else {
        throw error;
      }
    }
    if (!userSchemaAvailable) return [...memoryUsers.values()].filter((u) => u.workspace_id === workspaceId).map(toPublic);
    return ((data ?? []) as unknown as PlatformUserRow[]).map(toPublic);
  }
  return [...memoryUsers.values()].filter((u) => u.workspace_id === workspaceId).map(toPublic);
}

export async function createWorkspaceUser(workspaceId: string, input: { name: string; email: string; password: string; role: SessionRole; customRoleId?: string | null; status?: string; visibilityLevel?: string; modulePermissions?: Record<string, unknown> }) {
  await ensureDefaultAdminUser();
  if (hasSupabase() && !userSchemaAvailable && process.env.NODE_ENV === "production") {
    const error = new Error("Schema de usuários não aplicado no Supabase. Execute apps/api/src/db/schema.sql antes de criar usuários.") as Error & { status?: number; code?: string };
    error.status = 503;
    error.code = "USER_SCHEMA_UNAVAILABLE";
    throw error;
  }
  const now = new Date().toISOString();
  const row: PlatformUserRow = {
    id: randomUUID(),
    workspace_id: workspaceId,
    name: input.name.trim(),
    email: normalizeEmail(input.email),
    role: normalizeRole(input.role),
    active: input.status ? input.status !== "inactive" : true,
    custom_role_id: input.customRoleId || null,
    status: input.status || "active",
    visibility_level: input.visibilityLevel || "read_edit",
    module_permissions: input.modulePermissions || {},
    password_hash: hashPassword(input.password),
    created_at: now,
    updated_at: now
  };

  if (hasSupabase() && userSchemaAvailable) {
    const sb = getSupabase()!;
    const { error } = await sb.from("nodere_platform_users").insert(row);
    if (error) {
      if (isUserSchemaMissing(error)) {
        userSchemaAvailable = false;
      } else {
        throw error;
      }
    }
    if (!userSchemaAvailable) {
      if (process.env.NODE_ENV === "production") {
        const unavailable = new Error("Schema de usuários não aplicado no Supabase. Execute apps/api/src/db/schema.sql antes de criar usuários.") as Error & { status?: number; code?: string };
        unavailable.status = 503;
        unavailable.code = "USER_SCHEMA_UNAVAILABLE";
        throw unavailable;
      }
      memoryUsers.set(row.email, row);
    }
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

export async function updateWorkspaceUser(workspaceId: string, userId: string, input: { name?: string; role?: SessionRole; active?: boolean; password?: string; customRoleId?: string | null; status?: string; visibilityLevel?: string; modulePermissions?: Record<string, unknown> }) {
  const fields: Partial<PlatformUserRow> = { updated_at: new Date().toISOString() };
  if (input.name !== undefined) fields.name = input.name.trim();
  if (input.role !== undefined) fields.role = normalizeRole(input.role);
  if (input.active !== undefined) fields.active = Boolean(input.active);
  if (input.customRoleId !== undefined) fields.custom_role_id = input.customRoleId || null;
  if (input.status !== undefined) {
    fields.status = input.status;
    fields.active = input.status !== "inactive" && input.status !== "restricted";
  }
  if (input.visibilityLevel !== undefined) fields.visibility_level = input.visibilityLevel;
  if (input.modulePermissions !== undefined) fields.module_permissions = input.modulePermissions;
  if (input.password) fields.password_hash = hashPassword(input.password);

  if (hasSupabase() && userSchemaAvailable) {
    const sb = getSupabase()!;
    const { data, error } = await sb
      .from("nodere_platform_users")
      .update(fields)
      .eq("workspace_id", workspaceId)
      .eq("id", userId)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return data ? toPublic(data as unknown as PlatformUserRow) : null;
  }

  const row = [...memoryUsers.values()].find((u) => u.workspace_id === workspaceId && u.id === userId);
  if (!row) return null;
  Object.assign(row, fields);
  return toPublic(row);
}

function normalizeRole(role?: SessionRole | string): SessionRole {
  const normalized = String(role || "").trim().toLowerCase();
  if (["owner", "proprietario", "proprietário"].includes(normalized)) return "owner";
  if (["admin", "administrador", "administrator", "super_admin"].includes(normalized)) return "admin";
  if (["viewer", "visualizador", "leitor"].includes(normalized)) return "viewer";
  return "operator";
}

export async function getPlatformUserByEmail(emailInput: string) {
  await ensureDefaultAdminUser();
  const email = normalizeEmail(emailInput);

  if (hasSupabase() && userSchemaAvailable) {
    const sb = getSupabase()!;
    const { data, error } = await sb
      .from("nodere_platform_users")
      .select("*")
      .eq("email", email)
      .eq("active", true)
      .maybeSingle();
    if (error) {
      if (isUserSchemaMissing(error)) {
        userSchemaAvailable = false;
      } else {
        throw error;
      }
    }
    if (data) {
      const row = data as unknown as PlatformUserRow;
      if (isBuiltInOwner(email) && (row.role !== "owner" || !row.active || row.visibility_level !== "full")) {
        return toPublic(await promoteBuiltInOwner(row));
      }
      return toPublic(row);
    }
  }

  const memory = memoryUsers.get(email);
  return memory?.active ? toPublic(memory) : null;
}

export async function ensureSupabaseAuthUser(input: { authUserId: string; email: string; name?: string; workspaceName?: string }): Promise<PlatformUser> {
  const email = normalizeEmail(input.email);
  if (hasSupabase()) {
    const sb = getSupabase()!;
    const { data, error } = await sb
      .from("nodere_platform_users")
      .select("id,workspace_id,name,email,role,active,created_at,updated_at,auth_user_id")
      .ilike("email", email)
      .eq("active", true)
      .maybeSingle();
    if (error) throw error;
    if (data) {
      const row = data as unknown as PlatformUserRow;
      if (row.auth_user_id && row.auth_user_id !== input.authUserId) {
        const mismatch = new Error("O usuário autenticado não corresponde ao vínculo Supabase Auth cadastrado.") as Error & { status?: number; code?: string };
        mismatch.status = 403;
        mismatch.code = "AUTH_USER_MISMATCH";
        throw mismatch;
      }
      if (!row.auth_user_id) {
        const { error: linkError } = await sb
          .from("nodere_platform_users")
          .update({ auth_user_id: input.authUserId, updated_at: new Date().toISOString() })
          .eq("id", row.id)
          .eq("workspace_id", row.workspace_id);
        if (linkError) throw linkError;
      }
      const existing = toPublic(row);
      return isBuiltInOwner(email)
        ? { ...existing, name: BUILTIN_OWNER_NAME, role: "owner" as SessionRole, active: true }
        : existing;
    }
  } else {
    const existing = memoryUsers.get(email);
    if (existing?.active) return toPublic(existing);
  }

  const workspaceId = input.authUserId || randomUUID();
  const now = new Date().toISOString();
  const row: PlatformUserRow = {
    id: input.authUserId,
    workspace_id: workspaceId,
    name: isBuiltInOwner(email) ? BUILTIN_OWNER_NAME : input.name?.trim() || email.split("@")[0] || "Usuário NODERE",
    email,
    role: "owner",
    active: true,
    status: "active",
    visibility_level: "full",
    module_permissions: {},
    password_hash: hashPassword(randomUUID()),
    created_at: now,
    updated_at: now
  };

  if (hasSupabase() && userSchemaAvailable) {
    const sb = getSupabase()!;
    const workspace = await sb.from("nodere_workspaces").select("id").eq("id", workspaceId).maybeSingle();
    if (workspace.error) throw workspace.error;
    if (!workspace.data) {
      const nowIso = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      const created = await sb.from("nodere_workspaces").insert({
        id: workspaceId,
        name: input.workspaceName || "Workspace NODERE",
        owner_email: email,
        plan: "trial",
        credits: 20,
        expires_at: expiresAt,
        created_at: nowIso,
        updated_at: nowIso
      });
      if (created.error) throw created.error;
    }
    const { error } = await sb.from("nodere_platform_users").insert({
      id: row.id,
      workspace_id: row.workspace_id,
      name: row.name,
      email: row.email,
      role: row.role,
      active: row.active,
      password_hash: row.password_hash,
      auth_user_id: input.authUserId,
      created_at: row.created_at,
      updated_at: row.updated_at
    });
    if (error) throw error;
  } else {
    memoryUsers.set(email, row);
  }

  return toPublic(row);
}

async function promoteBuiltInOwner(row: PlatformUserRow): Promise<PlatformUserRow> {
  const fixed = {
    ...row,
    name: BUILTIN_OWNER_NAME,
    role: "owner" as SessionRole,
    active: true,
    status: "active",
    visibility_level: "full",
    updated_at: new Date().toISOString()
  };
  // The built-in owner is elevated in the signed session. Avoid writing optional
  // profile columns here because production installations may not have them yet.
  memoryUsers.set(fixed.email, fixed);
  return fixed;
}
