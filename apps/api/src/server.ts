import cors from "cors";
import express from "express";
import helmet from "helmet";
import { ZodError } from "zod";
import { config } from "./config.js";
import companiesRouter from "./routes/companies.js";
import dashboardRouter from "./routes/dashboard.js";
import integrationsRouter from "./routes/integrations.js";
import searchesRouter from "./routes/searches.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: config.webOrigin }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, name: "NODERE Intelligence API" });
});

app.use("/api/dashboard", dashboardRouter);
app.use("/api/companies", companiesRouter);
app.use("/api/searches", searchesRouter);
app.use("/api/integrations", integrationsRouter);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof ZodError) {
    return res.status(400).json({ message: "Invalid request", issues: error.issues });
  }

  const message = error instanceof Error ? error.message : "Unexpected error";
  return res.status(500).json({ message });
});

app.listen(config.port, () => {
  console.log(`NODERE Intelligence API running on http://localhost:${config.port}`);
});
