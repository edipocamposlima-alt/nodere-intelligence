import cors from "cors";
import express from "express";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { ZodError } from "zod";
import { config } from "./config.js";
import companiesRouter from "./routes/companies.js";
import dashboardRouter from "./routes/dashboard.js";
import enrichmentRouter from "./routes/enrichment.js";
import creditsRouter from "./routes/credits.js";
import integrationsRouter from "./routes/integrations.js";
import searchesRouter from "./routes/searches.js";
import settingsRouter from "./routes/settings.js";
import inboxRouter from "./routes/inbox.js";
import sequencesRouter from "./routes/sequences.js";
import billingRouter, { stripeWebhookHandler } from "./routes/billing.js";
import operatorsRouter from "./routes/operators.js";
import reportsRouter from "./routes/reports.js";
import calendarRouter from "./routes/calendar.js";
import catalogRouter from "./routes/catalog.js";
import marketingRouter from "./routes/marketing.js";
import auditRouter from "./routes/audit.js";
import adminRouter from "./routes/admin.js";
import workspaceRouter from "./routes/workspace.js";
import legalRouter from "./routes/legal.js";
import contactRouter from "./routes/contact.js";
import backupRouter from "./routes/backup.js";
import proposalsRouter from "./routes/proposals.js";
import pushRouter from "./routes/push.js";
import geocodeRouter from "./routes/geocode.js";
import { developerRouter, publicApiRouter } from "./routes/developer.js";
import verticalsRouter from "./routes/verticals.js";
import webhooksRouter from "./routes/webhooks.js";
import crmRouter from "./routes/crm.js";
import discoveryRouter from "./routes/discovery.js";
import onboardingRouter from "./routes/onboarding.js";
import { processDueSteps } from "./services/emailSequences.js";
import { requireAuth } from "./middleware/auth.js";
import { attachSession, getRequestWorkspaceId, requireWorkspaceRole, requireWorkspaceSession } from "./middleware/session.js";
import { getSupabase, hasSupabase } from "./db/supabase.js";
import { searchCompaniesWithMeta } from "./services/companyStore.js";
import { GoogleApiError } from "./services/google.js";
import { getAppSettings, savePipelineSettings, savePreferences } from "./services/settingsStore.js";
import { scanWebsite } from "./services/websiteScanner.js";
import { callAI, getAiProviderHealth } from "./services/ai.js";
import { configureWebPush } from "./services/pushService.js";
import { createSmtpTransport } from "./services/emailSender.js";
import { swaggerSpec } from "./swagger.js";

const app = express();
configureWebPush();

const allowedOrigins = new Set([
  config.webOrigin,
  config.frontendUrl,
  "https://nodere.com.br",
  "https://www.nodere.com.br",
  "http://localhost:3000",
  "http://localhost:4000",
]);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin) || origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }
      return callback(new Error(`Origin not allowed: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-workspace-id", "x-nodere-api-key"],
  })
);

// Stripe webhook must receive raw body before express.json()
app.post("/api/billing/webhook", express.raw({ type: "application/json" }), stripeWebhookHandler);
app.use(
  "/api/companies/import",
  express.raw({
    type: [
      "multipart/form-data",
      "text/csv",
      "application/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ],
    limit: "12mb"
  })
);

app.use(express.json());
app.use(attachSession);

app.get("/health", (_req, res) => {
  res.json({ ok: true, name: "NODERE Nexus API" });
});

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    name: "NODERE Nexus API",
    googlePlacesConfigured: Boolean(config.google.placesKey),
    pageSpeedConfigured: Boolean(config.google.pageSpeedKey),
    openaiConfigured: Boolean(config.openai.apiKey),
    supabaseConfigured: Boolean(config.supabase.url && config.supabase.serviceRoleKey)
  });
});

app.get("/api/health/providers", async (_req, res) => {
  res.json({
    ok: true,
    providers: await getAiProviderHealth(),
    backendTime: new Date().toISOString()
  });
});

app.get("/api/health/supabase", async (_req, res) => {
  const missing = [
    !config.supabase.url ? "SUPABASE_URL" : "",
    !config.supabase.serviceRoleKey ? "SUPABASE_SERVICE_ROLE_KEY" : ""
  ].filter(Boolean);

  if (missing.length) {
    return res.status(503).json({
      status: "error",
      message: `Supabase nao configurado. Variavel ausente: ${missing.join(", ")}.`,
      missing,
      backendTime: new Date().toISOString()
    });
  }

  try {
    const sb = getSupabase();
    const { error } = await sb!
      .from("nodere_companies")
      .select("id", { count: "exact", head: true })
      .limit(1);
    if (error) throw error;
    return res.json({
      status: "ok",
      message: "Supabase conectado e tabela nodere_companies acessivel.",
      backendTime: new Date().toISOString()
    });
  } catch (error) {
    return res.status(503).json({
      status: "error",
      message: error instanceof Error ? error.message : "Falha ao conectar ao Supabase.",
      backendTime: new Date().toISOString()
    });
  }
});

app.post("/api/auth/forgot-password", async (req, res, next) => {
  try {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    if (!email) return res.status(400).json({ message: "Informe um e-mail valido." });
    if (!hasSupabase()) {
      return res.status(503).json({
        message: "Recuperacao de senha indisponivel. Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no backend."
      });
    }
    const redirectTo = `${config.frontendUrl.replace(/\/+$/, "")}/reset-password`;
    const { error } = await getSupabase()!.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
    return res.json({
      ok: true,
      message: "Se o e-mail existir no NODERE, enviaremos um link de redefinicao de senha.",
      redirectTo
    });
  } catch (error) {
    return next(error);
  }
});

function publicIntegrationSettings() {
  return {
    appName: "NODERE Nexus",
    environment: process.env.NODE_ENV ?? "development",
    apiUrl: "https://nodere-api.onrender.com",
    enabledIntegrations: {
      googlePlaces: Boolean(config.google.placesKey),
      googleMaps: Boolean(config.google.mapsKey),
      pageSpeed: Boolean(config.google.pageSpeedKey),
      openai: Boolean(config.openai.apiKey),
      supabase: Boolean(config.supabase.url && config.supabase.serviceRoleKey),
      whatsappWeb: true,
      econodata: Boolean(config.enrichment.econodataApiKey && config.enrichment.econodataApiUrl),
      apollo: Boolean(config.enrichment.apolloApiKey)
    },
    status: "ok",
    backendTime: new Date().toISOString()
  };
}

app.get("/api/settings", async (req, res, next) => {
  try {
    const persisted = await getAppSettings(getRequestWorkspaceId(req));
    res.json({
      ...publicIntegrationSettings(),
      ...persisted
    });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/settings", requireWorkspaceRole("owner", "admin"), async (req, res, next) => {
  try {
    const preferences = await savePreferences(req.body ?? {}, getRequestWorkspaceId(req));
    res.json({
      ok: true,
      message: "Preferencias salvas no backend persistente. Secrets e chaves de API continuam somente no backend/Render.",
      settings: preferences,
      backendTime: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/settings/pipeline", requireWorkspaceRole("owner", "admin", "operator"), async (req, res, next) => {
  try {
    const pipeline = await savePipelineSettings(req.body ?? {}, getRequestWorkspaceId(req));
    res.json({
      ok: true,
      message: "Funil salvo no backend persistente.",
      pipeline,
      backendTime: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/settings/test-smtp", requireWorkspaceRole("owner", "admin"), async (req, res) => {
  const host = typeof req.body?.host === "string" ? req.body.host.trim() : "";
  const port = Number(req.body?.port || 587);
  const user = typeof req.body?.user === "string" ? req.body.user.trim() : "";
  const pass = typeof req.body?.pass === "string" ? req.body.pass : "";
  const transport = createSmtpTransport({ host, port, user, pass });
  if (!transport) {
    return res.status(400).json({ ok: false, message: "Informe SMTP Host, User e Password para testar." });
  }
  try {
    await transport.verify();
    return res.json({ ok: true, message: "Conexão SMTP verificada com sucesso." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha desconhecida na conexão SMTP.";
    return res.status(400).json({ ok: false, message: `Falha na conexão: ${message}` });
  }
});

app.get("/api/openai/health", (_req, res) => {
  res.json({
    openaiConfigured: Boolean(config.openai.apiKey),
    model: config.openai.model,
    backendTime: new Date().toISOString()
  });
});

app.post("/api/openai/analyze", requireWorkspaceSession, async (req, res, next) => {
  try {
    if (!config.openai.apiKey && !config.anthropic.apiKey) {
      return res.status(503).json({
        message: "Nenhum provedor de IA configurado no backend. Configure OPENAI_API_KEY ou ANTHROPIC_API_KEY no Render.",
        openaiConfigured: false
      });
    }

    const lead = req.body?.lead ?? {};
    const prompt = typeof req.body?.prompt === "string" ? req.body.prompt : "Gere uma analise comercial objetiva para este lead.";
    const context = req.body?.context ?? {};

    const systemPrompt =
      "Voce e o assistente operacional do NODERE Nexus, especialista em prospeccao B2B, CRM, Google Ads, Google Meu Negocio, PageSpeed, WhatsApp comercial e vendas consultivas. " +
      "Responda APENAS com JSON valido, sem markdown, em portugues do Brasil, com conteudo pratico e especifico para o lead informado.";

    const userPrompt = JSON.stringify({
      prompt,
      lead,
      context,
      schema_resposta: {
        commercialSummary: "Resumo comercial curto e especifico do lead.",
        opportunity: "Principal oportunidade comercial detectada.",
        likelyPains: ["Lista de dores provaveis."],
        recommendedApproach: "Abordagem comercial recomendada.",
        whatsappMessage: "Mensagem curta de WhatsApp pronta para envio.",
        emailSubject: "Assunto de e-mail comercial.",
        emailBody: "Corpo de e-mail comercial.",
        nextSteps: ["Próximos passos comerciais."],
        googleAdsStrategy: "Estrategia inicial de Google Ads recomendada."
      }
    });

    const ai = await callAI(systemPrompt, userPrompt);
    const raw = ai.content;
    const analysis = JSON.parse(raw);
    return res.json({
      ...analysis,
      model: config.openai.model,
      provider: ai.provider,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/pagespeed", requireWorkspaceSession, async (req, res, next) => {
  try {
    const url = typeof req.query.url === "string" ? req.query.url.trim() : "";
    if (!config.google.pageSpeedKey) {
      return res.json({
        score: null,
        error: "PageSpeed indisponível",
        status: "not_configured",
        message: "GOOGLE_PAGESPEED_API_KEY ausente no backend.",
        pageSpeedConfigured: false
      });
    }
    if (!url) {
      return res.json({
        status: "configured",
        message: "Informe ?url=https://site.com para executar a analise.",
        pageSpeedConfigured: true
      });
    }
    let scan;
    try {
      scan = await scanWebsite(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao executar PageSpeed.";
      return res.status(502).json({
        score: null,
        error: "PageSpeed indisponível",
        status: "error",
        message,
        pageSpeedConfigured: true
      });
    }
    return res.json({
      score: scan.pageSpeed,
      status: "connected",
      pageSpeedConfigured: true,
      result: {
        url: scan.url,
        performance: scan.pageSpeed,
        seo: scan.maturityScore,
        accessibility: scan.maturityScore,
        bestPractices: scan.commercialScore,
        diagnosis: "Analise PageSpeed executada pelo backend seguro.",
        recommendations: [
          "Otimizar carregamento, imagens e scripts de terceiros.",
          "Revisar SEO tecnico, title, meta description e headings.",
          "Garantir rastreamento antes de escalar campanhas."
        ],
        createdAt: scan.scannedAt
      }
    });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/places/search", requireWorkspaceSession, async (req, res, next) => {
  try {
    const input = {
      companyName: typeof req.query.companyName === "string" ? req.query.companyName : undefined,
      segment: typeof req.query.segment === "string" ? req.query.segment : undefined,
      city: typeof req.query.city === "string" ? req.query.city : undefined,
      state: typeof req.query.state === "string" ? req.query.state : undefined,
      keyword: typeof req.query.keyword === "string" ? req.query.keyword : undefined
    };
    const result = await searchCompaniesWithMeta(input, getRequestWorkspaceId(req));
    return res.json(result);
  } catch (error) {
    if (error instanceof GoogleApiError) {
      return res.status(error.status || 503).json({
        error: error.message,
        message: error.message,
        code: error.code,
        reason: error.reason,
        activationUrl: error.activationUrl,
        companies: [],
        source: "google"
      });
    }
    return next(error);
  }
});

app.use("/api/admin", adminRouter);
app.use("/api/onboarding", onboardingRouter);
app.use("/api/workspace", workspaceRouter);
app.use("/api/legal", legalRouter);
app.use("/api/contact", contactRouter);
app.use("/api/geocode", geocodeRouter);
app.use("/api/searches", searchesRouter);
app.use("/api/search", searchesRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/companies", requireWorkspaceSession, companiesRouter);
app.use("/api/crm", requireWorkspaceSession, crmRouter);
app.use("/api/discovery", requireWorkspaceSession, discoveryRouter);
app.use("/api/dashboard", requireWorkspaceSession, dashboardRouter);
app.use("/api/reports", requireWorkspaceSession, reportsRouter);
app.use("/api/calendar", requireWorkspaceSession, calendarRouter);
app.use("/api/catalog", requireWorkspaceSession, catalogRouter);
app.use("/api/marketing", requireWorkspaceSession, marketingRouter);
app.use("/api/campaigns", requireWorkspaceSession, marketingRouter);
app.use("/api/social", requireWorkspaceSession, marketingRouter);
app.use("/api/integrations", requireWorkspaceSession, integrationsRouter);
app.use("/api/inbox", requireWorkspaceSession, inboxRouter);
app.use("/api/webhooks", webhooksRouter);
app.get("/api/whatsapp/webhook", (req, res) => {
  const mode = String(req.query["hub.mode"] || "");
  const token = String(req.query["hub.verify_token"] || "");
  const challenge = String(req.query["hub.challenge"] || "");
  const expected = process.env.WHATSAPP_VERIFY_TOKEN || config.webhookSecret;
  if (mode === "subscribe" && expected && token === expected) {
    return res.status(200).send(challenge);
  }
  return res.status(403).json({ message: "Webhook verification failed." });
});
app.post("/api/whatsapp/webhook", (_req, res) => {
  return res.status(200).json({ ok: true });
});
app.use("/api/sequences", requireWorkspaceSession, sequencesRouter);
app.use("/api/operators", requireWorkspaceSession, operatorsRouter);
app.use("/api/credits", requireWorkspaceSession, creditsRouter);
app.use("/api/backup", requireWorkspaceSession, backupRouter);
app.use("/api/billing", billingRouter);
app.use("/api/proposals", requireWorkspaceSession, proposalsRouter);
app.use("/api/push", requireWorkspaceSession, pushRouter);
app.use("/api/notifications", requireWorkspaceSession, pushRouter);
app.use("/api/developer", requireWorkspaceSession, developerRouter);
app.use("/api/admin/verticals", verticalsRouter);
app.use("/v1", publicApiRouter);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: "NODERE Nexus API",
  customCss: ".swagger-ui .topbar{background:#0A0F1E}.swagger-ui .topbar-wrapper img{display:none}.swagger-ui .topbar-wrapper:before{content:'NODERE API';color:#fff;font-weight:700;font-size:18px}"
}));

app.use("/api", requireAuth);

app.use("/api/enrichment", enrichmentRouter);
app.use("/api/audit", auditRouter);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof ZodError) {
    return res.status(400).json({ message: "Invalid request", issues: error.issues });
  }
  const message = error instanceof Error ? error.message : "Unexpected error";
  const rawStatus = (error as { status?: unknown }).status;
  const status = typeof rawStatus === "number" && rawStatus >= 100 && rawStatus <= 599 ? rawStatus : 500;
  return res.status(status).json({
    error: message,
    message,
    code: (error as { code?: string }).code,
    reason: (error as { reason?: string }).reason,
    activationUrl: (error as { activationUrl?: string }).activationUrl
  });
});

setInterval(() => { processDueSteps().catch(console.error); }, 5 * 60 * 1000);

app.listen(config.port, () => {
  console.log(`NODERE Nexus API running on http://localhost:${config.port}`);
  if (process.env.NODE_ENV === "production" && process.env.RENDER_EXTERNAL_URL) {
    const pingUrl = `${process.env.RENDER_EXTERNAL_URL.replace(/\/+$/, "")}/api/health`;
    setInterval(async () => {
      try {
        const response = await fetch(pingUrl);
        console.log("[KEEPALIVE] Ping:", response.status);
      } catch (error) {
        console.warn("[KEEPALIVE] Ping failed:", error instanceof Error ? error.message : error);
      }
    }, 10 * 60 * 1000);
  }
});
