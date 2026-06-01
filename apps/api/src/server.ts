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
import { processDueSteps } from "./services/emailSequences.js";
import { requireAuth } from "./middleware/auth.js";
import { searchCompaniesWithMeta } from "./services/companyStore.js";
import { scanWebsite } from "./services/websiteScanner.js";

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

app.get("/health", (_req, res) => {
  res.json({ ok: true, name: "NODERE Intelligence API" });
});

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    name: "NODERE Intelligence API",
    googlePlacesConfigured: Boolean(config.google.placesKey),
    pageSpeedConfigured: Boolean(config.google.pageSpeedKey),
    openaiConfigured: Boolean(config.openai.apiKey),
    supabaseConfigured: Boolean(config.supabase.url && config.supabase.serviceRoleKey)
  });
});

app.get("/api/settings", (_req, res) => {
  res.json({
    appName: "NODERE Intelligence",
    environment: process.env.NODE_ENV ?? "development",
    apiUrl: "https://nodere-api.onrender.com",
    enabledIntegrations: {
      googlePlaces: Boolean(config.google.placesKey),
      googleMaps: Boolean(config.google.mapsKey),
      pageSpeed: Boolean(config.google.pageSpeedKey),
      openai: Boolean(config.openai.apiKey),
      supabase: Boolean(config.supabase.url && config.supabase.serviceRoleKey),
      whatsappWeb: true
    },
    status: "ok",
    backendTime: new Date().toISOString()
  });
});

app.get("/api/openai/health", (_req, res) => {
  res.json({
    openaiConfigured: Boolean(config.openai.apiKey),
    model: config.openai.model,
    backendTime: new Date().toISOString()
  });
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
    const result = await searchCompaniesWithMeta(input);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

app.use("/api/admin", adminRouter);

app.use("/api", requireAuth);

app.use("/api/dashboard", dashboardRouter);
app.use("/api/companies", companiesRouter);
app.use("/api/searches", searchesRouter);
app.use("/api/enrichment", enrichmentRouter);
app.use("/api/credits", creditsRouter);
app.use("/api/integrations", integrationsRouter);
app.use("/api/inbox", inboxRouter);
app.use("/api/sequences", sequencesRouter);
app.use("/api/billing", billingRouter);
app.use("/api/operators", operatorsRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/audit", auditRouter);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof ZodError) {
    return res.status(400).json({ message: "Invalid request", issues: error.issues });
  }
  const message = error instanceof Error ? error.message : "Unexpected error";
  const status = typeof (error as { status?: unknown }).status === "number" ? (error as { status: number }).status : 500;
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
