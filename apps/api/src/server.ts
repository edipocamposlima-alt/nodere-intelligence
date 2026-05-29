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
import { processDueSteps } from "./services/emailSequences.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: config.webOrigin }));

// Stripe webhook must receive raw body before express.json()
app.post("/api/billing/webhook", express.raw({ type: "application/json" }), stripeWebhookHandler);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, name: "NODERE Intelligence API" });
});

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
  return res.status(500).json({ message });
});

setInterval(() => { processDueSteps().catch(console.error); }, 5 * 60 * 1000);

app.listen(config.port, () => {
  console.log(`NODERE Intelligence API running on http://localhost:${config.port}`);
});
