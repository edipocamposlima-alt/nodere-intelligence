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
import authRouter from "./routes/auth.js";
import teamRouter from "./routes/team.js";
import commercialRouter from "./routes/commercial.js";
import { processDueSteps } from "./services/emailSequences.js";
import { requireAuth } from "./middleware/auth.js";

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

app.use("/api/auth", authRouter);
app.use("/api/team", teamRouter);
app.use("/api/commercial", commercialRouter);
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
    console.error("[validation]", error.issues);
    return res.status(400).json({ error: "Revise os dados enviados e tente novamente." });
  }
  if (error instanceof Error && error.message === "SUPABASE_NOT_CONFIGURED") {
    return res.status(503).json({ error: "Configure Supabase para usar este modulo." });
  }
  if (error instanceof Error && error.message === "CATALOG_ITEM_UNAVAILABLE") {
    return res.status(422).json({ error: "Use apenas itens ativos do catalogo." });
  }
  const status = typeof (error as { status?: unknown })?.status === "number"
    ? (error as { status: number }).status
    : null;
  if (status && status >= 400 && status < 500 && error instanceof Error) {
    return res.status(status).json({ error: error.message });
  }
  console.error("[server]", error);
  return res.status(500).json({ error: "Erro interno. Tente novamente." });
});

setInterval(() => { processDueSteps().catch(console.error); }, 5 * 60 * 1000);

app.listen(config.port, () => {
  console.log(`NODERE Intelligence API running on http://localhost:${config.port}`);
});
