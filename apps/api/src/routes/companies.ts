import { Router } from "express";
import { z } from "zod";
import { addNote, getCompany, listCompanies, updateStatus } from "../services/companyStore.js";
import { queueEnrichment, getJobByCompany } from "../services/enrichmentQueue.js";
import { consumeEnrichment } from "../services/credits.js";
import { getAudit } from "../db/auditStore.js";
import { calculateCommercialScore, calculateMaturityScore, calculatePaidTrafficScore } from "../services/scoring.js";
import { config } from "../config.js";
import { getAdsConnectionStatus, assessAdsReadiness, buildOfflineConversion, offlineConversionsToCsv } from "../services/googleAds.js";
import { generateKeywords } from "../services/keywords.js";
import { getGbpInsightsForCompany } from "../services/gbp.js";
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

router.get("/:id/audit", (req, res) => {
  const company = getCompany(req.params.id);
  if (!company) return res.status(404).json({ message: "Company not found" });

  const scan = getAudit(req.params.id);
  const maturityScore = scan ? calculateMaturityScore(scan) : (company.maturityScore ?? 0);
  const commercialScore = scan ? calculateCommercialScore(company, scan) : (company.commercialScore ?? 0);
  const paidTrafficScore = scan ? calculatePaidTrafficScore(scan) : (company.paidTrafficScore ?? 0);

  const gbpConfigured = Boolean(config.google.businessProfileRefreshToken);
  const gbp = {
    status: gbpConfigured ? "configured" as const : "not_configured" as const,
    message: gbpConfigured
      ? "Perfil Google Business configurado — dados de avaliações, posts e fotos disponíveis via API."
      : "Configure GOOGLE_BUSINESS_PROFILE_REFRESH_TOKEN para ingerir dados de avaliações, posts, fotos e Q&A."
  };

  return res.json({
    companyId: company.id,
    companyName: company.name,
    website: company.website,
    scan: scan ?? null,
    maturityScore,
    commercialScore,
    paidTrafficScore,
    opportunityScore: company.score,
    gbp
  });
});

router.get("/:id/intelligence", async (req, res, next) => {
  try {
    const company = getCompany(req.params.id);
    if (!company) return res.status(404).json({ message: "Company not found" });

    const scan = getAudit(req.params.id);
    const [adsReadiness, keywords, gbp] = await Promise.all([
      Promise.resolve(assessAdsReadiness(company, scan ?? null)),
      Promise.resolve(generateKeywords(company.category, company.city, company.state)),
      getGbpInsightsForCompany(company.name, company.city)
    ]);

    return res.json({
      companyId: company.id,
      companyName: company.name,
      adsConnectionStatus: getAdsConnectionStatus(),
      adsCustomerId: config.googleAds.customerId,
      adsReadiness,
      keywords,
      gbp
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/:id/keywords", (req, res) => {
  const company = getCompany(req.params.id);
  if (!company) return res.status(404).json({ message: "Company not found" });
  return res.json(generateKeywords(company.category, company.city, company.state));
});

router.post("/:id/offline-conversion", (req, res) => {
  const company = getCompany(req.params.id);
  if (!company) return res.status(404).json({ message: "Company not found" });

  const schema = z.object({
    conversionName: z.string().default("Lead CRM"),
    value: z.number().min(0).default(0)
  });
  const body = schema.parse(req.body);
  const conversion = buildOfflineConversion(company.name, body.conversionName, body.value);

  const format = (req.query.format as string) ?? "json";
  if (format === "csv") {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="conversion-${company.id}.csv"`);
    return res.send(offlineConversionsToCsv([conversion]));
  }
  return res.json(conversion);
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
