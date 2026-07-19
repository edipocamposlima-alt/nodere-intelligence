import { Router } from "express";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { config } from "../config.js";
import { getSupabase } from "../db/supabase.js";
import { extractBearerToken, isBuiltInOwnerEmail, issueSessionToken, normalizeAdminSession, verifySessionToken } from "../services/adminSession.js";
import { authenticateUser, createWorkspaceUser, ensureSupabaseAuthUser, inviteWorkspaceUser, listWorkspaceUsers, updateWorkspaceUser } from "../services/userStore.js";
import { isMissingSupabaseSchema } from "../utils/supabaseErrors.js";

const router = Router();

const apiKeyFields = [
  "GOOGLE_PLACES_API_KEY",
  "GOOGLE_MAPS_API_KEY",
  "GOOGLE_PAGESPEED_API_KEY",
  "OPENAI_API_KEY",
  "WHATSAPP_CLOUD_TOKEN",
  "WHATSAPP_PHONE_NUMBER_ID",
  "ECONODATA_API_KEY",
  "ECONODATA_API_URL",
  "APOLLO_API_KEY",
  "APOLLO_API_URL",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY"
] as const;

type ApiKeyField = (typeof apiKeyFields)[number];

const runtimeApiSettings = new Map<ApiKeyField, { masked: string; updatedAt: string }>();
const memoryRoles = new Map<string, Array<{ id: string; workspace_id: string; name: string; description?: string; permissions: Record<string, unknown>; color: string; created_at: string; updated_at: string }>>();

function requireAdmin(request: any, response: any, next: any) {
  const rawSession = request.session || verifySessionToken(extractBearerToken(request.headers.authorization));
  const session = rawSession ? normalizeAdminSession(rawSession) : null;
  if (!session) {
    return response.status(401).json({
      message: "Sessão administrativa expirada. Entre novamente.",
      code: "ADMIN_SESSION_REQUIRED"
    });
  }
  if (!["owner", "admin"].includes(session.role)) {
    console.warn("[admin] blocked admin route", {
      email: session?.email || rawSession?.email || null,
      foundRole: rawSession?.role || null,
      effectiveRole: session?.role || null,
      builtInOwner: isBuiltInOwnerEmail(session?.email || rawSession?.email)
    });
    return response.status(403).json({
      message: "Acesso restrito a Owner ou Administrador.",
      code: "ADMIN_ROLE_REQUIRED"
    });
  }
  request.admin = session;
  return next();
}

function getAdminSession(request: any) {
  const rawSession = request.session || verifySessionToken(extractBearerToken(request.headers.authorization));
  const session = rawSession ? normalizeAdminSession(rawSession) : null;
  if (!session || !["owner", "admin"].includes(session.role)) return null;
  return session;
}

function maskValue(value = "") {
  const text = String(value || "");
  if (!text) return "";
  if (text.length <= 10) return `${text.slice(0, 2)}••••${text.slice(-2)}`;
  return `${text.slice(0, 6)}••••••${text.slice(-4)}`;
}

function configuredFromEnv(field: ApiKeyField) {
  const envMap: Record<ApiKeyField, string | undefined> = {
    GOOGLE_PLACES_API_KEY: config.google.placesKey,
    GOOGLE_MAPS_API_KEY: config.google.mapsKey,
    GOOGLE_PAGESPEED_API_KEY: config.google.pageSpeedKey,
    OPENAI_API_KEY: config.openai.apiKey,
    WHATSAPP_CLOUD_TOKEN: config.whatsapp.token,
    WHATSAPP_PHONE_NUMBER_ID: config.whatsapp.phoneNumberId,
    ECONODATA_API_KEY: config.enrichment.econodataApiKey,
    ECONODATA_API_URL: config.enrichment.econodataApiUrl,
    APOLLO_API_KEY: config.enrichment.apolloApiKey,
    APOLLO_API_URL: config.enrichment.apolloApiUrl,
    SUPABASE_URL: config.supabase.url,
    SUPABASE_SERVICE_ROLE_KEY: config.supabase.serviceRoleKey
  };
  return envMap[field];
}

function listApiSettings() {
  return apiKeyFields.map((field) => {
    const envValue = configuredFromEnv(field);
    const runtimeValue = runtimeApiSettings.get(field);
    return {
      key: field,
      configured: Boolean(envValue || runtimeValue),
      source: envValue ? "render_env" : runtimeValue ? "admin_runtime" : "missing",
      masked: envValue ? maskValue(envValue) : runtimeValue?.masked || "",
      updatedAt: runtimeValue?.updatedAt || null
    };
  });
}

function applyRuntimeValue(field: ApiKeyField, value: string) {
  switch (field) {
    case "GOOGLE_PLACES_API_KEY":
      config.google.placesKey = value;
      break;
    case "GOOGLE_MAPS_API_KEY":
      config.google.mapsKey = value;
      break;
    case "GOOGLE_PAGESPEED_API_KEY":
      config.google.pageSpeedKey = value;
      break;
    case "OPENAI_API_KEY":
      config.openai.apiKey = value;
      break;
    case "WHATSAPP_CLOUD_TOKEN":
      config.whatsapp.token = value;
      break;
    case "WHATSAPP_PHONE_NUMBER_ID":
      config.whatsapp.phoneNumberId = value;
      break;
    case "ECONODATA_API_KEY":
      config.enrichment.econodataApiKey = value;
      break;
    case "ECONODATA_API_URL":
      config.enrichment.econodataApiUrl = value;
      break;
    case "APOLLO_API_KEY":
      config.enrichment.apolloApiKey = value;
      break;
    case "APOLLO_API_URL":
      config.enrichment.apolloApiUrl = value;
      break;
    case "SUPABASE_URL":
      config.supabase.url = value;
      break;
    case "SUPABASE_SERVICE_ROLE_KEY":
      config.supabase.serviceRoleKey = value;
      break;
  }
}

async function listCustomRoles(workspaceId: string) {
  const sb = getSupabase();
  if (!sb) return memoryRoles.get(workspaceId) || [];
  const { data, error } = await sb
    .from("custom_roles")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });
  if (error) {
    if (isMissingSupabaseSchema(error)) return memoryRoles.get(workspaceId) || [];
    throw error;
  }
  return data || [];
}

async function createCustomRole(workspaceId: string, input: { name: string; description?: string; permissions?: Record<string, unknown>; color?: string }) {
  const now = new Date().toISOString();
  const row = {
    id: randomUUID(),
    workspace_id: workspaceId,
    name: input.name.trim(),
    description: input.description?.trim() || "",
    permissions: input.permissions || {},
    color: input.color || "#1E6FDB",
    created_at: now,
    updated_at: now
  };
  const sb = getSupabase();
  if (!sb) {
    const items = memoryRoles.get(workspaceId) || [];
    memoryRoles.set(workspaceId, [...items, row]);
    return row;
  }
  const { data, error } = await sb.from("custom_roles").insert(row).select("*").single();
  if (error) throw error;
  return data;
}

async function updateCustomRole(workspaceId: string, roleId: string, input: { name?: string; description?: string; permissions?: Record<string, unknown>; color?: string }) {
  const fields = {
    ...(input.name !== undefined ? { name: input.name.trim() } : {}),
    ...(input.description !== undefined ? { description: input.description.trim() } : {}),
    ...(input.permissions !== undefined ? { permissions: input.permissions } : {}),
    ...(input.color !== undefined ? { color: input.color } : {}),
    updated_at: new Date().toISOString()
  };
  const sb = getSupabase();
  if (!sb) {
    const items = memoryRoles.get(workspaceId) || [];
    const next = items.map((item) => item.id === roleId ? { ...item, ...fields } : item);
    memoryRoles.set(workspaceId, next);
    return next.find((item) => item.id === roleId) || null;
  }
  const { data, error } = await sb.from("custom_roles").update(fields).eq("workspace_id", workspaceId).eq("id", roleId).select("*").maybeSingle();
  if (error) throw error;
  return data;
}

async function deleteCustomRole(workspaceId: string, roleId: string) {
  const sb = getSupabase();
  if (!sb) {
    memoryRoles.set(workspaceId, (memoryRoles.get(workspaceId) || []).filter((item) => item.id !== roleId));
    return;
  }
  const { error } = await sb.from("custom_roles").delete().eq("workspace_id", workspaceId).eq("id", roleId);
  if (error) throw error;
}

async function listAuditRows(workspaceId: string) {
  const sb = getSupabase();
  if (!sb) return { activityLogs: [], downloadLogs: [], auditLogs: [] };
  const [activity, downloads, audit] = await Promise.all([
    sb.from("activity_logs").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(80),
    sb.from("download_logs").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(80),
    sb.from("nodere_audit_logs").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(80)
  ]);
  if (activity.error) throw activity.error;
  if (downloads.error) throw downloads.error;
  return { activityLogs: activity.data || [], downloadLogs: downloads.data || [], auditLogs: audit.error ? [] : audit.data || [] };
}

function requireSession(request: any, response: any, next: any) {
  const rawSession = request.session || verifySessionToken(extractBearerToken(request.headers.authorization));
  const session = rawSession ? normalizeAdminSession(rawSession) : null;
  if (!session) {
    return response.status(401).json({ message: "Sessão expirada. Entre novamente.", code: "SESSION_REQUIRED" });
  }
  request.admin = session;
  return next();
}

router.post("/login", async (request, response, next) => {
  const body = z.object({
    email: z.string().email(),
    password: z.string().min(1)
  }).parse(request.body);

  try {
    const user = await authenticateUser(body.email, body.password);
    if (user) {
      return response.json({
        token: issueSessionToken({
          email: user.email,
          name: user.name,
          role: user.role,
          workspaceId: user.workspaceId,
          userId: user.id
        }),
        user: { email: user.email, name: user.name, role: user.role, workspaceId: user.workspaceId }
      });
    }

    if (!config.admin.password) {
      return response.status(503).json({
        message: "ADMIN_PASSWORD nao esta configurada no backend/Render.",
        code: "ADMIN_PASSWORD_MISSING"
      });
    }

    const loginEmail = body.email.toLowerCase();
    const allowedAdminEmails = new Set([config.admin.email.toLowerCase(), "edipo.lima@nodere.com.br"]);
    if (!allowedAdminEmails.has(loginEmail) || body.password !== config.admin.password) {
      return response.status(401).json({ message: "Login ou senha invalidos." });
    }

    return response.json({
      token: issueSessionToken({ email: body.email, name: loginEmail === "edipo.lima@nodere.com.br" ? "Édipo Lima" : config.admin.name, role: "owner", workspaceId: "default", userId: "admin-default" }),
      user: { email: body.email, name: loginEmail === "edipo.lima@nodere.com.br" ? "Édipo Lima" : config.admin.name, role: "owner", workspaceId: "default" }
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/supabase-session", async (request, response, next) => {
  try {
    const { accessToken } = z.object({ accessToken: z.string().min(20) }).parse(request.body);
    const sb = getSupabase();
    if (!sb) return response.status(503).json({ message: "Supabase não configurado no backend." });

    const { data, error } = await sb.auth.getUser(accessToken);
    if (error || !data.user?.email) {
      return response.status(401).json({ message: "Sessão Supabase inválida ou expirada." });
    }

    const user = await ensureSupabaseAuthUser({
      authUserId: data.user.id,
      email: data.user.email,
      name: String(data.user.user_metadata?.name || data.user.user_metadata?.full_name || "")
    });
    const token = issueSessionToken({
      email: user.email,
      name: user.name,
      role: user.role,
      workspaceId: user.workspaceId,
      userId: user.id
    });

    return response.json({
      token,
      user: { email: user.email, name: user.name, role: user.role, workspaceId: user.workspaceId }
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/session", requireAdmin, (request: any, response) => {
  response.json({ user: { email: request.admin.email, name: request.admin.name || config.admin.name, role: request.admin.role, workspaceId: request.admin.workspaceId, userId: request.admin.userId } });
});

router.post("/session/refresh", requireSession, (request: any, response) => {
  const session = normalizeAdminSession(request.admin);
  const token = issueSessionToken({
    email: session.email,
    name: session.name,
    role: session.role,
    workspaceId: session.workspaceId,
    userId: session.userId
  });
  response.json({ token, expiresIn: 60 * 60 * 24 * 7 });
});

router.get("/status", (request: any, response) => {
  const session = getAdminSession(request);
  if (!session) {
    return response.status(403).json({
      ok: false,
      message: "Acesso negado. Seu perfil não tem permissão de administrador."
    });
  }

  return response.json({
    ok: true,
    user: {
      email: session.email,
      name: session.name || config.admin.name,
      role: session.role,
      workspaceId: session.workspaceId,
      userId: session.userId
    }
  });
});

router.post("/fix-owner-role", requireAdmin, async (request: any, response, next) => {
  try {
    const sb = getSupabase();
    if (!sb) {
      return response.status(503).json({
        ok: false,
        message: "Supabase não configurado. Não foi possível corrigir perfis persistentes."
      });
    }

    const workspaceId = request.admin.workspaceId || "default";
    const workspaceResult = await sb
      .from("nodere_workspaces")
      .select("id, owner_email")
      .eq("id", workspaceId)
      .maybeSingle();
    if (workspaceResult.error) throw workspaceResult.error;

    const ownerEmail = String(workspaceResult.data?.owner_email || request.admin.email || "").trim().toLowerCase();
    const updates: Array<Record<string, unknown>> = [];
    if (ownerEmail) {
      const ownerUpdate = await sb
        .from("nodere_platform_users")
        .update({ role: "owner", active: true, status: "active", updated_at: new Date().toISOString() })
        .eq("workspace_id", workspaceId)
        .ilike("email", ownerEmail)
        .select("id,email,role");
      if (ownerUpdate.error) throw ownerUpdate.error;
      updates.push(...(ownerUpdate.data || []));
    }

    const currentUserUpdate = await sb
      .from("nodere_platform_users")
      .update({ role: request.admin.role === "admin" ? "admin" : "owner", active: true, status: "active", updated_at: new Date().toISOString() })
      .eq("workspace_id", workspaceId)
      .eq("id", request.admin.userId)
      .select("id,email,role");
    if (currentUserUpdate.error) throw currentUserUpdate.error;
    updates.push(...(currentUserUpdate.data || []));

    return response.json({
      ok: true,
      workspaceId,
      fixed: updates.length,
      users: updates,
      message: updates.length ? "Perfis Owner/Admin revisados com sucesso." : "Nenhum usuário persistente encontrado para atualizar."
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/users", requireAdmin, async (request: any, response, next) => {
  try {
    response.json({ users: await listWorkspaceUsers(request.admin.workspaceId || "default") });
  } catch (error) {
    next(error);
  }
});

router.post("/users", requireAdmin, async (request: any, response, next) => {
  try {
    const body = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(8),
      role: z.enum(["owner", "admin", "operator", "viewer"]).default("operator"),
      customRoleId: z.string().nullable().optional(),
      status: z.string().optional(),
      visibilityLevel: z.string().optional(),
      modulePermissions: z.record(z.unknown()).optional()
    }).parse(request.body);
    const user = await createWorkspaceUser(request.admin.workspaceId || "default", body);
    response.status(201).json({ user, message: "Usuário criado. Ele já pode acessar a plataforma pelo login." });
  } catch (error) {
    next(error);
  }
});

router.post("/users/invite", requireAdmin, async (request: any, response, next) => {
  try {
    const body = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      role: z.enum(["owner", "admin", "operator", "viewer"]).default("operator"),
      customRoleId: z.string().nullable().optional(),
      status: z.string().default("active"),
      visibilityLevel: z.string().default("read_edit"),
      modulePermissions: z.record(z.unknown()).optional()
    }).parse(request.body);
    const user = await inviteWorkspaceUser(request.admin.workspaceId || "default", body);
    response.status(201).json({
      user,
      message: "Convite enviado pelo Supabase Auth. O usuário definirá a própria senha pelo link recebido."
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/users/:id", requireAdmin, async (request: any, response, next) => {
  try {
    const body = z.object({
      name: z.string().min(2).optional(),
      password: z.string().min(8).optional(),
      role: z.enum(["owner", "admin", "operator", "viewer"]).optional(),
      active: z.boolean().optional(),
      customRoleId: z.string().nullable().optional(),
      status: z.string().optional(),
      visibilityLevel: z.string().optional(),
      modulePermissions: z.record(z.unknown()).optional()
    }).parse(request.body);
    const user = await updateWorkspaceUser(request.admin.workspaceId || "default", request.params.id, body);
    if (!user) return response.status(404).json({ message: "Usuário não encontrado nesta conta." });
    response.json({ user, message: "Usuário atualizado." });
  } catch (error) {
    next(error);
  }
});

router.get("/roles", requireAdmin, async (request: any, response, next) => {
  try {
    response.json({ roles: await listCustomRoles(request.admin.workspaceId || "default") });
  } catch (error) {
    next(error);
  }
});

router.post("/roles", requireAdmin, async (request: any, response, next) => {
  try {
    const body = z.object({
      name: z.string().min(2),
      description: z.string().optional(),
      permissions: z.record(z.unknown()).optional(),
      color: z.string().optional()
    }).parse(request.body);
    const role = await createCustomRole(request.admin.workspaceId || "default", body);
    response.status(201).json({ role, message: "Cargo criado." });
  } catch (error) {
    next(error);
  }
});

router.patch("/roles/:id", requireAdmin, async (request: any, response, next) => {
  try {
    const body = z.object({
      name: z.string().min(2).optional(),
      description: z.string().optional(),
      permissions: z.record(z.unknown()).optional(),
      color: z.string().optional()
    }).parse(request.body);
    const role = await updateCustomRole(request.admin.workspaceId || "default", request.params.id, body);
    if (!role) return response.status(404).json({ message: "Cargo não encontrado." });
    response.json({ role, message: "Cargo atualizado." });
  } catch (error) {
    next(error);
  }
});

router.delete("/roles/:id", requireAdmin, async (request: any, response, next) => {
  try {
    await deleteCustomRole(request.admin.workspaceId || "default", request.params.id);
    response.json({ ok: true, message: "Cargo removido." });
  } catch (error) {
    next(error);
  }
});

router.get("/audit", requireAdmin, async (request: any, response, next) => {
  try {
    response.json(await listAuditRows(request.admin.workspaceId || "default"));
  } catch (error) {
    next(error);
  }
});

router.post("/cleanup-demo-data", requireAdmin, async (request: any, response, next) => {
  try {
    const body = z.object({ confirm: z.string() }).parse(request.body);
    if (body.confirm !== "CONFIRMO") {
      return response.status(400).json({ error: "Confirmação necessária.", message: "Digite CONFIRMO para limpar dados demo/teste." });
    }
    const sb = getSupabase();
    if (!sb) {
      return response.status(503).json({ message: "Supabase não configurado. Limpeza segura exige banco persistente." });
    }
    const workspaceId = request.admin.workspaceId || "default";
    const { data, error } = await sb
      .from("nodere_companies")
      .delete()
      .eq("workspace_id", workspaceId)
      .or("source.is.null,source.in.(demo,test)")
      .select("id");
    if (error) throw error;
    response.json({
      ok: true,
      deleted: data?.length ?? 0,
      message: `${data?.length ?? 0} registro(s) demo/teste removido(s) deste workspace.`
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/users/:id", requireAdmin, async (request: any, response, next) => {
  try {
    const user = await updateWorkspaceUser(request.admin.workspaceId || "default", request.params.id, { active: false });
    if (!user) return response.status(404).json({ message: "Usuário não encontrado nesta conta." });
    response.json({ user, message: "Usuário desativado." });
  } catch (error) {
    next(error);
  }
});

router.get("/api-keys", requireAdmin, (_request, response) => {
  response.json({
    keys: listApiSettings(),
    note: "Valores completos nunca sao retornados. Para producao permanente, configure secrets no Render."
  });
});

router.patch("/api-keys", requireAdmin, (request, response) => {
  const body = z.object({
    values: z.record(z.string().optional())
  }).parse(request.body);

  for (const field of apiKeyFields) {
    const value = String(body.values[field] || "").trim();
    if (value) {
      runtimeApiSettings.set(field, { masked: maskValue(value), updatedAt: new Date().toISOString() });
      applyRuntimeValue(field, value);
    }
  }

  response.json({
    keys: listApiSettings(),
    message: "Chaves recebidas com seguranca. Configure tambem no Render para persistencia entre deploys."
  });
});

export default router;
