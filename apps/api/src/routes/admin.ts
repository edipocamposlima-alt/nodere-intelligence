import { Router } from "express";
import { z } from "zod";
import { config } from "../config.js";
import { extractBearerToken, issueSessionToken, verifySessionToken } from "../services/adminSession.js";
import { authenticateUser, createWorkspaceUser, listWorkspaceUsers, updateWorkspaceUser } from "../services/userStore.js";

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

function requireAdmin(request: any, response: any, next: any) {
  const session = verifySessionToken(extractBearerToken(request.headers.authorization));
  if (!session || session.role !== "admin") return response.status(401).json({ message: "Sessao administrativa invalida ou expirada." });
  request.admin = session;
  return next();
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

    if (body.email.toLowerCase() !== config.admin.email.toLowerCase() || body.password !== config.admin.password) {
      return response.status(401).json({ message: "Login ou senha invalidos." });
    }

    return response.json({
      token: issueSessionToken({ email: body.email, role: "admin", workspaceId: "default", userId: "admin-default" }),
      user: { email: body.email, role: "admin", workspaceId: "default" }
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/session", requireAdmin, (request: any, response) => {
  response.json({ user: { email: request.admin.email, role: request.admin.role, workspaceId: request.admin.workspaceId, userId: request.admin.userId } });
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
      role: z.enum(["admin", "operator"]).default("operator")
    }).parse(request.body);
    const user = await createWorkspaceUser(request.admin.workspaceId || "default", body);
    response.status(201).json({ user, message: "Usuário criado. Ele já pode acessar a plataforma pelo login." });
  } catch (error) {
    next(error);
  }
});

router.patch("/users/:id", requireAdmin, async (request: any, response, next) => {
  try {
    const body = z.object({
      name: z.string().min(2).optional(),
      password: z.string().min(8).optional(),
      role: z.enum(["admin", "operator"]).optional(),
      active: z.boolean().optional()
    }).parse(request.body);
    const user = await updateWorkspaceUser(request.admin.workspaceId || "default", request.params.id, body);
    if (!user) return response.status(404).json({ message: "Usuário não encontrado nesta conta." });
    response.json({ user, message: "Usuário atualizado." });
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
