import { Router } from "express";
import { z } from "zod";
import { createCipheriv, createHash, randomBytes, randomUUID } from "node:crypto";
import { getSupabase } from "../db/supabase.js";
import { getRequestWorkspaceId, requireWorkspaceMutation } from "../middleware/session.js";
import { isMissingSupabaseSchema } from "../utils/supabaseErrors.js";

const router = Router();
router.use(requireWorkspaceMutation("owner", "admin", "operator"));

router.get("/", async (req, res, next) => {
  try {
    return res.json(await listCampaigns(getRequestWorkspaceId(req)));
  } catch (error) {
    if (isMissingSupabaseSchema(error)) return res.json([]);
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    return res.status(201).json(await createCampaign(getRequestWorkspaceId(req), req.body));
  } catch (error) {
    return next(error);
  }
});

router.get("/templates", async (req, res, next) => {
  try {
    const { data, error } = await requireSupabase()
      .from("message_templates")
      .select("*")
      .eq("workspace_id", getRequestWorkspaceId(req))
      .order("created_at", { ascending: false });
    if (error) throw error;
    return res.json(data ?? []);
  } catch (error) {
    if (isMissingSupabaseSchema(error)) return res.json([]);
    return next(error);
  }
});

router.post("/templates", async (req, res, next) => {
  try {
    const body = z.object({
      name: z.string().min(2),
      channel: z.enum(["whatsapp", "email", "linkedin", "instagram_dm"]).default("whatsapp"),
      subject: z.string().optional().nullable(),
      body: z.string().min(2),
      variables: z.array(z.string()).optional()
    }).parse(req.body);
    const row = { id: randomUUID(), workspace_id: getRequestWorkspaceId(req), ...body };
    const { data, error } = await requireSupabase().from("message_templates").insert(row).select("*").single();
    if (error) throw error;
    return res.status(201).json(data);
  } catch (error) {
    return next(error);
  }
});

router.patch("/templates/:id", async (req, res, next) => {
  try {
    const body = z.object({
      name: z.string().min(2).optional(),
      channel: z.enum(["whatsapp", "email", "linkedin", "instagram_dm"]).optional(),
      subject: z.string().optional().nullable(),
      body: z.string().min(2).optional(),
      variables: z.array(z.string()).optional()
    }).parse(req.body);
    const { data, error } = await requireSupabase()
      .from("message_templates")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("workspace_id", getRequestWorkspaceId(req))
      .eq("id", req.params.id)
      .select("*")
      .single();
    if (error) throw error;
    return res.json(data);
  } catch (error) {
    return next(error);
  }
});

router.delete("/templates/:id", async (req, res, next) => {
  try {
    const { error } = await requireSupabase()
      .from("message_templates")
      .delete()
      .eq("workspace_id", getRequestWorkspaceId(req))
      .eq("id", req.params.id);
    if (error) throw error;
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

router.get("/campaigns", async (req, res, next) => {
  try {
    return res.json(await listCampaigns(getRequestWorkspaceId(req)));
  } catch (error) {
    return next(error);
  }
});

router.post("/campaigns", async (req, res, next) => {
  try {
    return res.status(201).json(await createCampaign(getRequestWorkspaceId(req), req.body));
  } catch (error) {
    return next(error);
  }
});

router.get("/social/status", (_req, res) => res.json(buildSocialStatus()));
router.get("/status", (_req, res) => res.json(buildSocialStatus()));

router.get("/social/connect/:platform", (req, res) => {
  return startOAuth(req, res);
});

router.get("/connect/:platform", (req, res) => {
  return startOAuth(req, res);
});

function startOAuth(req: any, res: any) {
  const platform = String(req.params.platform);
  const callbackUrl = `${req.protocol}://${req.get("host")}/api/marketing/social/callback/${platform}`;
  const target = buildOAuthUrl(platform, callbackUrl);
  if (!target.url) {
    return res.status(503).json({
      message: target.message,
      requiredEnv: target.requiredEnv
    });
  }
  return res.redirect(target.url);
}

router.get("/social/callback/:platform", async (req, res, next) => {
  try {
    const platform = String(req.params.platform);
    const code = String(req.query.code || "");
    if (!code) return res.status(400).json({ message: "Callback OAuth sem code." });
    const callbackUrl = `${req.protocol}://${req.get("host")}/api/marketing/social/callback/${platform}`;
    const tokenPayload = await exchangeOAuthCode(platform, code, callbackUrl);
    const saved = await saveSocialConnection(getRequestWorkspaceId(req), platform, tokenPayload);
    return res.json({
      ok: true,
      platform,
      connectionId: saved.id,
      message: `${getPlatformLabel(platform)} conectado com sucesso. Tokens criptografados no backend.`
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/callback/:platform", async (req, res, next) => {
  try {
    const platform = String(req.params.platform);
    const code = String(req.query.code || "");
    if (!code) return res.status(400).json({ message: "Callback OAuth sem code." });
    const callbackUrl = `${req.protocol}://${req.get("host")}/api/marketing/callback/${platform}`;
    const tokenPayload = await exchangeOAuthCode(platform, code, callbackUrl);
    const saved = await saveSocialConnection(getRequestWorkspaceId(req), platform, tokenPayload);
    return res.json({ ok: true, platform, connectionId: saved.id, message: `${getPlatformLabel(platform)} conectado com sucesso.` });
  } catch (error) {
    return next(error);
  }
});

function requireSupabase() {
  const sb = getSupabase();
  if (!sb) {
    const error = new Error("Supabase não configurado para marketing.") as Error & { status?: number; code?: string };
    error.status = 503;
    error.code = "SUPABASE_NOT_CONFIGURED";
    throw error;
  }
  return sb;
}

async function listCampaigns(workspaceId: string) {
  const { data, error } = await requireSupabase()
    .from("campaigns")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) {
    if (isMissingSupabaseSchema(error)) return [];
    throw error;
  }
  return data ?? [];
}

async function createCampaign(workspaceId: string, input: unknown) {
  const body = z.object({
    name: z.string().min(2),
    platforms: z.array(z.string()).default([]),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    status: z.string().default("draft"),
    budgetBrl: z.coerce.number().optional().nullable(),
    notes: z.string().optional().nullable()
  }).parse(input);
  const row = {
    id: randomUUID(),
    workspace_id: workspaceId,
    name: body.name,
    platforms: body.platforms,
    start_date: body.startDate,
    end_date: body.endDate,
    status: body.status,
    budget_brl: body.budgetBrl,
    notes: body.notes
  };
  const { data, error } = await requireSupabase().from("campaigns").insert(row).select("*").single();
  if (error) throw error;
  return data;
}

function buildSocialStatus() {
  const platforms = socialPlatforms.map((platform) => ({
    key: platform.key,
    name: platform.name,
    provider: platform.provider,
    configured: platform.requiredEnv.every((key) => Boolean(process.env[key])),
    requiredEnv: [...platform.requiredEnv],
    color: platform.color,
    scope: platform.scope,
    category: platform.category
  }));
  return {
    platforms,
    mlabs: {
      configured: true,
      type: "workflow_shortcut",
      url: "https://app.mlabs.com.br",
      message: "mLabs não possui API pública para terceiros; use como atalho operacional."
    }
  };
}

function buildOAuthUrl(platform: string, callbackUrl: string): { url?: string; message?: string; requiredEnv?: string[] } {
  const config = getPlatform(platform);
  if (!config) return { message: "Plataforma social inválida.", requiredEnv: [] };
  const missing = config.requiredEnv.filter((key) => !process.env[key]);
  if (missing.length) return { message: `${config.name} OAuth não configurado no backend.`, requiredEnv: [...config.requiredEnv] };

  if (config.provider === "meta") {
    const url = new URL("https://www.facebook.com/v20.0/dialog/oauth");
    url.searchParams.set("client_id", process.env.META_APP_ID || "");
    url.searchParams.set("redirect_uri", callbackUrl);
    url.searchParams.set("scope", config.scope);
    return { url: url.toString() };
  }
  if (config.provider === "linkedin") {
    const url = new URL("https://www.linkedin.com/oauth/v2/authorization");
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", process.env.LINKEDIN_CLIENT_ID || "");
    url.searchParams.set("redirect_uri", callbackUrl);
    url.searchParams.set("scope", config.scope);
    return { url: url.toString() };
  }
  if (config.provider === "google") {
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", getGoogleClientId());
    url.searchParams.set("redirect_uri", callbackUrl);
    url.searchParams.set("scope", config.scope);
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");
    return { url: url.toString() };
  }
  if (config.provider === "tiktok") {
    const url = new URL("https://www.tiktok.com/v2/auth/authorize/");
    url.searchParams.set("client_key", process.env.TIKTOK_CLIENT_KEY || "");
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", config.scope);
    url.searchParams.set("redirect_uri", callbackUrl);
    return { url: url.toString() };
  }
  if (config.provider === "pinterest") {
    const url = new URL("https://www.pinterest.com/oauth/");
    url.searchParams.set("client_id", process.env.PINTEREST_CLIENT_ID || "");
    url.searchParams.set("redirect_uri", callbackUrl);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", config.scope);
    return { url: url.toString() };
  }
  if (config.provider === "x") {
    const url = new URL("https://twitter.com/i/oauth2/authorize");
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", process.env.X_CLIENT_ID || "");
    url.searchParams.set("redirect_uri", callbackUrl);
    url.searchParams.set("scope", config.scope);
    url.searchParams.set("state", randomUUID());
    url.searchParams.set("code_challenge", process.env.X_CODE_CHALLENGE || "nodere-oauth");
    url.searchParams.set("code_challenge_method", "plain");
    return { url: url.toString() };
  }
  if (config.provider === "rdstation") {
    const url = new URL("https://api.rd.services/auth/dialog");
    url.searchParams.set("client_id", process.env.RD_STATION_CLIENT_ID || "");
    url.searchParams.set("redirect_uri", callbackUrl);
    return { url: url.toString() };
  }
  return { message: "Esta integração ainda não possui OAuth público configurado.", requiredEnv: [] };
}

const socialPlatforms = [
  { key: "instagram", name: "Instagram", provider: "meta", category: "social", color: "#E1306C", requiredEnv: ["META_APP_ID", "META_APP_SECRET", "SOCIAL_TOKEN_ENCRYPTION_KEY"], scope: "pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish" },
  { key: "facebook", name: "Facebook", provider: "meta", category: "social", color: "#1877F2", requiredEnv: ["META_APP_ID", "META_APP_SECRET", "SOCIAL_TOKEN_ENCRYPTION_KEY"], scope: "pages_show_list,pages_read_engagement,pages_manage_posts" },
  { key: "tiktok", name: "TikTok", provider: "tiktok", category: "social", color: "#111827", requiredEnv: ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET", "SOCIAL_TOKEN_ENCRYPTION_KEY"], scope: "user.info.basic,video.list,video.publish" },
  { key: "linkedin-pages", name: "LinkedIn Pages", provider: "linkedin", category: "social", color: "#0A66C2", requiredEnv: ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET", "SOCIAL_TOKEN_ENCRYPTION_KEY"], scope: "r_liteprofile w_member_social r_organization_social w_organization_social" },
  { key: "linkedin-personal", name: "LinkedIn Pessoal", provider: "linkedin", category: "social", color: "#0A66C2", requiredEnv: ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET", "SOCIAL_TOKEN_ENCRYPTION_KEY"], scope: "r_liteprofile w_member_social" },
  { key: "google-business", name: "Google Meu Negócio", provider: "google", category: "business", color: "#4285F4", requiredEnv: ["GOOGLE_BUSINESS_CLIENT_ID", "GOOGLE_BUSINESS_CLIENT_SECRET", "SOCIAL_TOKEN_ENCRYPTION_KEY"], scope: "https://www.googleapis.com/auth/business.manage" },
  { key: "pinterest", name: "Pinterest", provider: "pinterest", category: "social", color: "#E60023", requiredEnv: ["PINTEREST_CLIENT_ID", "PINTEREST_CLIENT_SECRET", "SOCIAL_TOKEN_ENCRYPTION_KEY"], scope: "boards:read,pins:read,pins:write,user_accounts:read" },
  { key: "youtube", name: "YouTube", provider: "google", category: "social", color: "#FF0000", requiredEnv: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "SOCIAL_TOKEN_ENCRYPTION_KEY"], scope: "https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload" },
  { key: "threads", name: "Threads", provider: "meta", category: "social", color: "#111827", requiredEnv: ["META_APP_ID", "META_APP_SECRET", "SOCIAL_TOKEN_ENCRYPTION_KEY"], scope: "threads_basic,threads_content_publish" },
  { key: "google-analytics-4", name: "Google Analytics 4", provider: "google", category: "analytics", color: "#F9AB00", requiredEnv: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "SOCIAL_TOKEN_ENCRYPTION_KEY"], scope: "https://www.googleapis.com/auth/analytics.readonly" },
  { key: "x", name: "X", provider: "x", category: "social", color: "#111827", requiredEnv: ["X_CLIENT_ID", "X_CLIENT_SECRET", "SOCIAL_TOKEN_ENCRYPTION_KEY"], scope: "tweet.read tweet.write users.read offline.access" },
  { key: "meta-ads", name: "Meta Ads", provider: "meta", category: "ads", color: "#0866FF", requiredEnv: ["META_APP_ID", "META_APP_SECRET", "SOCIAL_TOKEN_ENCRYPTION_KEY"], scope: "ads_read,ads_management,business_management" },
  { key: "google-ads", name: "Google Ads", provider: "google", category: "ads", color: "#34A853", requiredEnv: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_ADS_DEVELOPER_TOKEN", "SOCIAL_TOKEN_ENCRYPTION_KEY"], scope: "https://www.googleapis.com/auth/adwords" },
  { key: "linkedin-ads", name: "LinkedIn Ads", provider: "linkedin", category: "ads", color: "#0A66C2", requiredEnv: ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET", "SOCIAL_TOKEN_ENCRYPTION_KEY"], scope: "r_liteprofile r_ads r_ads_reporting" },
  { key: "tiktok-ads", name: "TikTok Ads", provider: "tiktok", category: "ads", color: "#111827", requiredEnv: ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET", "SOCIAL_TOKEN_ENCRYPTION_KEY"], scope: "user.info.basic" },
  { key: "rd-station", name: "RD Station", provider: "rdstation", category: "crm", color: "#16A3A6", requiredEnv: ["RD_STATION_CLIENT_ID", "RD_STATION_CLIENT_SECRET", "SOCIAL_TOKEN_ENCRYPTION_KEY"], scope: "" }
] as const;

function getPlatform(platform: string) {
  return socialPlatforms.find((item) => item.key === platform);
}

function getPlatformLabel(platform: string) {
  return getPlatform(platform)?.name || platform;
}

function getGoogleClientId() {
  return process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_BUSINESS_CLIENT_ID || "";
}

function getGoogleClientSecret() {
  return process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_BUSINESS_CLIENT_SECRET || "";
}

async function exchangeOAuthCode(platform: string, code: string, callbackUrl: string) {
  const config = getPlatform(platform);
  if (!config) throw Object.assign(new Error("Plataforma social inválida."), { status: 400 });
  if (!process.env.SOCIAL_TOKEN_ENCRYPTION_KEY) {
    throw Object.assign(new Error("SOCIAL_TOKEN_ENCRYPTION_KEY ausente no Render. Token não será armazenado sem criptografia."), { status: 503 });
  }
  if (config.provider === "meta") {
    return fetchJson("https://graph.facebook.com/v20.0/oauth/access_token", {
      client_id: process.env.META_APP_ID,
      client_secret: process.env.META_APP_SECRET,
      redirect_uri: callbackUrl,
      code
    });
  }
  if (config.provider === "google") {
    return fetchForm("https://oauth2.googleapis.com/token", {
      client_id: getGoogleClientId(),
      client_secret: getGoogleClientSecret(),
      redirect_uri: callbackUrl,
      grant_type: "authorization_code",
      code
    });
  }
  if (config.provider === "linkedin") {
    return fetchForm("https://www.linkedin.com/oauth/v2/accessToken", {
      client_id: process.env.LINKEDIN_CLIENT_ID || "",
      client_secret: process.env.LINKEDIN_CLIENT_SECRET || "",
      redirect_uri: callbackUrl,
      grant_type: "authorization_code",
      code
    });
  }
  if (config.provider === "tiktok") {
    return fetchForm("https://open.tiktokapis.com/v2/oauth/token/", {
      client_key: process.env.TIKTOK_CLIENT_KEY || "",
      client_secret: process.env.TIKTOK_CLIENT_SECRET || "",
      redirect_uri: callbackUrl,
      grant_type: "authorization_code",
      code
    });
  }
  if (config.provider === "pinterest") {
    return fetchForm("https://api.pinterest.com/v5/oauth/token", {
      grant_type: "authorization_code",
      code,
      redirect_uri: callbackUrl
    }, {
      Authorization: `Basic ${Buffer.from(`${process.env.PINTEREST_CLIENT_ID}:${process.env.PINTEREST_CLIENT_SECRET}`).toString("base64")}`
    });
  }
  if (config.provider === "x") {
    return fetchForm("https://api.twitter.com/2/oauth2/token", {
      grant_type: "authorization_code",
      code,
      redirect_uri: callbackUrl,
      code_verifier: process.env.X_CODE_VERIFIER || "nodere-oauth"
    }, {
      Authorization: `Basic ${Buffer.from(`${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`).toString("base64")}`
    });
  }
  if (config.provider === "rdstation") {
    return fetchJson("https://api.rd.services/auth/token", {
      client_id: process.env.RD_STATION_CLIENT_ID,
      client_secret: process.env.RD_STATION_CLIENT_SECRET,
      code
    });
  }
  throw Object.assign(new Error("Esta integração não possui troca de token implementada."), { status: 501 });
}

async function fetchJson(url: string, params: Record<string, unknown>) {
  const target = new URL(url);
  for (const [key, value] of Object.entries(params)) if (value) target.searchParams.set(key, String(value));
  const response = await fetch(target);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(payload.error_description || payload.error?.message || payload.message || `OAuth HTTP ${response.status}`), { status: response.status });
  return payload;
}

async function fetchForm(url: string, params: Record<string, unknown>, headers: Record<string, string> = {}) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", ...headers },
    body: new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== null).map(([key, value]) => [key, String(value)])))
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(payload.error_description || payload.error?.message || payload.message || `OAuth HTTP ${response.status}`), { status: response.status });
  return payload;
}

async function saveSocialConnection(workspaceId: string, platform: string, tokenPayload: any) {
  const sb = requireSupabase();
  const encrypted = encryptToken(JSON.stringify(tokenPayload));
  const row = {
    id: randomUUID(),
    workspace_id: workspaceId,
    platform,
    provider: getPlatform(platform)?.provider || platform,
    status: "connected",
    access_token_encrypted: encrypted,
    token_type: tokenPayload.token_type || "Bearer",
    scope: tokenPayload.scope || getPlatform(platform)?.scope || "",
    expires_at: tokenPayload.expires_in ? new Date(Date.now() + Number(tokenPayload.expires_in) * 1000).toISOString() : null,
    metadata: {
      hasRefreshToken: Boolean(tokenPayload.refresh_token),
      connectedAt: new Date().toISOString()
    },
    updated_at: new Date().toISOString()
  };
  const { data, error } = await sb.from("social_connections").upsert(row, { onConflict: "workspace_id,platform" }).select("id").single();
  if (error) throw error;
  return data;
}

function encryptToken(value: string) {
  const secret = process.env.SOCIAL_TOKEN_ENCRYPTION_KEY || "";
  const key = createHash("sha256").update(secret).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${encrypted.toString("base64")}`;
}

export default router;
