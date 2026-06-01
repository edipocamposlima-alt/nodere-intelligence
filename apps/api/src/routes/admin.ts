import { Router } from "express";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { config } from "../config.js";

const router = Router();

const apiKeyFields = [
  "GOOGLE_PLACES_API_KEY",
  "GOOGLE_MAPS_API_KEY",
  "GOOGLE_PAGESPEED_API_KEY",
  "OPENAI_API_KEY",
  "WHATSAPP_CLOUD_TOKEN",
  "WHATSAPP_PHONE_NUMBER_ID",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY"
] as const;

type ApiKeyField = (typeof apiKeyFields)[number];

const runtimeApiSettings = new Map<ApiKeyField, { masked: string; updatedAt: string }>();

function sign(payload: string) {
  return createHmac("sha256", config.admin.sessionSecret).update(payload).digest("base64url");
}

function issueToken(email: string) {
  const payload = Buffer.from(JSON.stringify({
    email,
    role: "admin",
    exp: Date.now() + 1000 * 60 * 60 * 12
  })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token = "") {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data.exp || data.exp < Date.now()) return null;
    return data as { email: string; role: "admin"; exp: number };
  } catch {
    return null;
  }
}

function requireAdmin(request: any, response: any, next: any) {
  const token = String(request.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const session = verifyToken(token);
  if (!session) return response.status(401).json({ message: "Sessao administrativa invalida ou expirada." });
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

router.post("/login", (request, response) => {
  const body = z.object({
    email: z.string().email(),
    password: z.string().min(1)
  }).parse(request.body);

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
    token: issueToken(body.email),
    user: { email: body.email, role: "admin" }
  });
});

router.get("/session", requireAdmin, (request: any, response) => {
  response.json({ user: { email: request.admin.email, role: request.admin.role } });
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
    }
  }

  response.json({
    keys: listApiSettings(),
    message: "Chaves recebidas com seguranca. Configure tambem no Render para persistencia entre deploys."
  });
});

export default router;
