import { Router } from "express";
import { z } from "zod";
import { getQueueStatus, queueEnrichment, getJobByCompany } from "../services/enrichmentQueue.js";
import { getCompany } from "../services/companyStore.js";
import { consumeEnrichment } from "../services/credits.js";
import { getRequestWorkspaceId, isPrivilegedSession } from "../middleware/session.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json(getQueueStatus());
});

router.get("/company/:id", (req, res) => {
  const job = getJobByCompany(req.params.id);
  if (!job) return res.status(404).json({ message: "No enrichment job for this company" });
  return res.json(job);
});

router.post("/company/:id", async (req, res, next) => {
  try {
  const company = getCompany(req.params.id);
  if (!company) return res.status(404).json({ message: "Company not found" });

  const schema = z.object({ force: z.boolean().optional() }).optional();
  const body = schema.parse(req.body);

  if (!company.website && !body?.force) {
    return res.status(422).json({ message: "Company has no website to analyze" });
  }

  if (!isPrivilegedSession(req)) {
    await consumeEnrichment(company.name, getRequestWorkspaceId(req));
  }
  const job = queueEnrichment(company.id, company.name);
  return res.status(202).json(job);
  } catch (error) {
    return next(error);
  }
});

export default router;
