import cors from "cors";
import express from "express";
import helmet from "helmet";
import { ZodError } from "zod";
import { config } from "./config.js";
import companiesRouter from "./routes/companies.js";
import dashboardRouter from "./routes/dashboard.js";
import enrichmentRouter from "./routes/enrichment.js";
import creditsRouter from "./routes/credits.js";
import integrationsRouter from "./routes/integrations.js";
import searchesRouter from "./routes/searches.js";
import inboxRouter from "./routes/inbox.js";
import sequencesRouter from "./routes/sequences.js";
import billingRouter, { stripeWebhookHandler } from "./routes/billing.js";
import operatorsRouter from "./routes/operators.js";
import reportsRouter from "./routes/reports.js";
import auditRouter from "./routes/audit.js";
import adminRouter from "./routes/admin.js";
import workspaceRouter from "./routes/workspace.js";
import legalRouter from "./routes/legal.js";
import backupRouter from "./routes/backup.js";
import proposalsRouter from "./routes/proposals.js";
import pushRouter from "./routes/push.js";
import geocodeRouter from "./routes/geocode.js";
import { developerRouter, publicApiRouter } from "./routes/developer.js";
import verticalsRouter from "./routes/verticals.js";
import webhooksRouter from "./routes/webhooks.js";
import crmRouter from "./routes/crm.js";
import { processDueSteps } from "./services/emailSequences.js";
import { requireAuth } from "./middleware/auth.js";
import { attachSession, getRequestWorkspaceId } from "./middleware/session.js";
import { searchCompaniesWithMeta } from "./services/companyStore.js";
import { getAppSettings, savePipelineSettings, savePreferences } from "./services/settingsStore.js";
import { scanWebsite } from "./services/websiteScanner.js";
import { callAI, getAiProviderHealth } from "./services/ai.js";

const app = express();

const allowedOrigins = new Set([
  config.webOrigin,
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
  })
);

// Stripe webhook must receive raw body before express.json()
app.post("/api/billing/webhook", express.raw({ type: "application/json" }), stripeWebhookHandler);

app.use(express.json());
app.use(attachSession);

app.get("/health", (_req, res) => {
  res.json({ ok: true, name: "NODERE Intelligence API" });
});

app.get("/api/health", async (_req, res) => {
  res.json({
    ok: true,
    status: "ok",
    name: "NODERE Intelligence API",
    googlePlacesConfigured: Boolean(config.google.placesKey),
    pageSpeedConfigured: Boolean(config.google.pageSpeedKey),
    openaiConfigured: Boolean(config.openai.apiKey),
    supabaseConfigured: Boolean(config.supabase.url && config.supabase.serviceRoleKey),
    providers: await getAiProviderHealth()
  });
});

function publicIntegrationSettings() {
  return {
    appName: "NODERE Intelligence",
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

app.patch("/api/settings", async (req, res, next) => {
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

app.patch("/api/settings/pipeline", async (req, res, next) => {
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

app.get("/api/openai/health", (_req, res) => {
  res.json({
    openaiConfigured: Boolean(config.openai.apiKey),
    model: config.openai.model,
    backendTime: new Date().toISOString()
  });
});

app.post("/api/openai/analyze", async (req, res, next) => {
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
      "Voce e o assistente operacional do NODERE Intelligence, especialista em prospeccao B2B, CRM, Google Ads, Google Meu Negocio, PageSpeed, WhatsApp comercial e vendas consultivas. " +
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
        nextSteps: ["Proximos passos comerciais."],
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

app.get("/api/pagespeed", async (req, res, next) => {
  try {
    const url = typeof req.query.url === "string" ? req.query.url.trim() : "";
    if (!config.google.pageSpeedKey) {
      return res.json({
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
    const scan = await scanWebsite(url);
    return res.json({
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

app.get("/api/places/search", async (req, res, next) => {
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
    return next(error);
  }
});

app.use("/api/admin", adminRouter);
app.use("/api/workspace", workspaceRouter);
app.use("/api/legal", legalRouter);
app.use("/api/geocode", geocodeRouter);
app.use("/api/searches", searchesRouter);
app.use("/api/companies", companiesRouter);
app.use("/api/crm", crmRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/integrations", integrationsRouter);
app.use("/api/inbox", inboxRouter);
app.use("/api/webhooks", webhooksRouter);
app.use("/api/sequences", sequencesRouter);
app.use("/api/operators", operatorsRouter);
app.use("/api/credits", creditsRouter);
app.use("/api/backup", backupRouter);
app.use("/api/billing", billingRouter);
app.use("/api/proposals", proposalsRouter);
app.use("/api/push", pushRouter);
app.use("/api/developer", developerRouter);
app.use("/api/admin/verticals", verticalsRouter);
app.use("/v1", publicApiRouter);
app.get("/docs", (_req, res) => {
  res.type("html").send(`<!doctype html><title>NODERE API</title><body style="font-family:sans-serif;background:#0A0F1E;color:white;padding:32px"><h1>NODERE Public API</h1><p>Use <code>X-NODERE-API-Key</code>.</p><pre>${JSON.stringify({
    openapi: "3.0.0",
    info: { title: "NODERE Public API", version: "1.0.0" },
    paths: {
      "/v1/leads": { get: { summary: "List leads" }, post: { summary: "Create lead" } },
      "/v1/leads/{id}": { patch: { summary: "Update lead" } },
      "/v1/leads/{id}/stage": { patch: { summary: "Move lead stage" } },
      "/v1/leads/{id}/notes": { post: { summary: "Add note" } },
      "/v1/search": { get: { summary: "Search companies" } }
    }
  }, null, 2)}</pre></body>`);
});

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
    message,
    code: (error as { code?: string }).code,
    reason: (error as { reason?: string }).reason,
    activationUrl: (error as { activationUrl?: string }).activationUrl
  });
});

setInterval(() => { processDueSteps().catch(console.error); }, 5 * 60 * 1000);

app.listen(config.port, () => {
  console.log(`NODERE Intelligence API running on http://localhost:${config.port}`);
});
