import { Router } from "express";
import { z } from "zod";
import { addNote, getCompany, listCompanies, updateStatus } from "../services/companyStore.js";
import { queueEnrichment, getJobByCompany } from "../services/enrichmentQueue.js";
import { consumeEnrichment } from "../services/credits.js";
import { generateCommercialDiagnosis } from "../services/openai.js";
import { defaultProspectingMessage, sendWhatsappMessage } from "../services/whatsapp.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json(listCompanies());
});

router.get("/:id", (req, res) => {
  const company = getCompany(req.params.id);
  if (!company) return res.status(404).json({ message: "Company not found" });
  return res.json(company);
});

router.post("/:id/analyze", (req, res) => {
  const company = getCompany(req.params.id);
  if (!company) return res.status(404).json({ message: "Company not found" });
  if (!company.website) return res.status(422).json({ message: "Company has no website to analyze" });
  consumeEnrichment(company.name);
  const job = queueEnrichment(company.id, company.name);
  return res.status(202).json({ message: "Enrichment queued", job });
});

router.get("/:id/enrichment", (req, res) => {
  const job = getJobByCompany(req.params.id);
  if (!job) return res.status(404).json({ message: "No enrichment job found" });
  return res.json(job);
});

router.patch("/:id/status", (req, res) => {
  const body = z.object({ status: z.string() }).parse(req.body);
  const company = updateStatus(req.params.id, body.status as never);
  if (!company) return res.status(404).json({ message: "Company not found" });
  return res.json(company);
});

router.post("/:id/notes", (req, res) => {
  const body = z.object({ body: z.string().min(2) }).parse(req.body);
  const note = addNote(req.params.id, body.body);
  if (!note) return res.status(404).json({ message: "Company not found" });
  return res.status(201).json(note);
});

router.post("/:id/whatsapp", async (req, res, next) => {
  try {
    const body = z.object({ message: z.string().optional() }).parse(req.body);
    const company = getCompany(req.params.id);
    if (!company) return res.status(404).json({ message: "Company not found" });
    const result = await sendWhatsappMessage(company, body.message ?? defaultProspectingMessage);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

router.post("/:id/diagnosis", async (req, res, next) => {
  try {
    const company = getCompany(req.params.id);
    if (!company) return res.status(404).json({ message: "Company not found" });
    const result = await generateCommercialDiagnosis(company);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

export default router;
