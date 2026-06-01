import { Router } from "express";
import { z } from "zod";
import {
  addNote,
  createDocument,
  createTask,
  getCompany,
  getCompanyAsync,
  listCompaniesAsync,
  listDocuments,
  listNotes,
  listTasks,
  removeDocument,
  removeNote,
  updateDocument,
  updateStatus,
  updateTask
} from "../services/companyStore.js";
import { queueEnrichment, getJobByCompany } from "../services/enrichmentQueue.js";
import { consumeEnrichment } from "../services/credits.js";
import { getAudit } from "../db/auditStore.js";
import { calculateCommercialScore, calculateMaturityScore, calculatePaidTrafficScore } from "../services/scoring.js";
import { config } from "../config.js";
import { getAdsConnectionStatus, assessAdsReadiness, buildOfflineConversion, offlineConversionsToCsv } from "../services/googleAds.js";
import { generateKeywords } from "../services/keywords.js";
import { getGbpInsightsForCompany } from "../services/gbp.js";
import { generateCommercialDiagnosis } from "../services/openai.js";
import { cacheDiagnosis, getCachedDiagnosis } from "../services/diagnosisStore.js";
import { defaultProspectingMessage, sendWhatsappMessage } from "../services/whatsapp.js";
import { activateSequence, getInstancesByCompany } from "../services/emailSequences.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    res.json(await listCompaniesAsync());
  } catch (err) { next(err); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const company = await getCompanyAsync(req.params.id);
    if (!company) return res.status(404).json({ message: "Company not found" });
    return res.json(company);
  } catch (err) { return next(err); }
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

router.patch("/:id/status", async (req, res, next) => {
  try {
    const body = z.object({ status: z.string() }).parse(req.body);
    const company = await updateStatus(req.params.id, body.status as never);
    if (!company) return res.status(404).json({ message: "Company not found" });
    return res.json(company);
  } catch (err) { return next(err); }
});

router.post("/:id/notes", async (req, res, next) => {
  try {
    const body = z.object({ body: z.string().min(2) }).parse(req.body);
    const note = await addNote(req.params.id, body.body);
    if (!note) return res.status(404).json({ message: "Company not found" });
    return res.status(201).json(note);
  } catch (err) { return next(err); }
});

router.get("/:id/notes", async (req, res, next) => {
  try {
    const company = await getCompanyAsync(req.params.id);
    if (!company) return res.status(404).json({ message: "Company not found" });
    return res.json(await listNotes(req.params.id));
  } catch (err) { return next(err); }
});

router.delete("/:id/notes/:noteId", async (req, res, next) => {
  try {
    const company = await getCompanyAsync(req.params.id);
    if (!company) return res.status(404).json({ message: "Company not found" });
    return res.json(await removeNote(req.params.id, req.params.noteId));
  } catch (err) { return next(err); }
});

router.get("/:id/tasks", async (req, res, next) => {
  try {
    const company = await getCompanyAsync(req.params.id);
    if (!company) return res.status(404).json({ message: "Company not found" });
    return res.json(await listTasks(req.params.id));
  } catch (err) { return next(err); }
});

router.post("/:id/tasks", async (req, res, next) => {
  try {
    const body = z.object({
      title: z.string().min(2),
      description: z.string().optional().nullable(),
      dueAt: z.string().optional().nullable(),
      priority: z.string().optional().nullable(),
      channel: z.string().optional().nullable()
    }).parse(req.body);
    const company = await getCompanyAsync(req.params.id);
    if (!company) return res.status(404).json({ message: "Company not found" });
    const task = await createTask(req.params.id, {
      title: body.title,
      description: body.description ?? undefined,
      dueAt: body.dueAt ?? undefined,
      priority: body.priority ?? undefined,
      channel: body.channel ?? undefined
    });
    await addNote(req.params.id, `Tarefa criada: ${task.title}`);
    return res.status(201).json(task);
  } catch (err) { return next(err); }
});

router.patch("/:id/tasks/:taskId", async (req, res, next) => {
  try {
    const body = z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      dueAt: z.string().optional(),
      priority: z.string().optional(),
      channel: z.string().optional(),
      status: z.enum(["open", "done", "cancelled"]).optional()
    }).parse(req.body);
    const task = await updateTask(req.params.id, req.params.taskId, body);
    if (!task) return res.status(404).json({ message: "Task not found" });
    return res.json(task);
  } catch (err) { return next(err); }
});

router.get("/:id/documents", async (req, res, next) => {
  try {
    const company = await getCompanyAsync(req.params.id);
    if (!company) return res.status(404).json({ message: "Company not found" });
    return res.json(await listDocuments(req.params.id));
  } catch (err) { return next(err); }
});

router.post("/:id/documents", async (req, res, next) => {
  try {
    const body = z.object({
      type: z.string().min(2),
      title: z.string().min(2),
      content: z.string().min(1),
      fileName: z.string().optional()
    }).parse(req.body);
    const company = await getCompanyAsync(req.params.id);
    if (!company) return res.status(404).json({ message: "Company not found" });
    const document = await createDocument(req.params.id, body);
    await addNote(req.params.id, `Documento salvo: ${document.title}`);
    return res.status(201).json(document);
  } catch (err) { return next(err); }
});

router.patch("/:id/documents/:documentId", async (req, res, next) => {
  try {
    const body = z.object({
      type: z.string().optional(),
      title: z.string().optional(),
      content: z.string().optional(),
      fileName: z.string().optional()
    }).parse(req.body);
    const document = await updateDocument(req.params.id, req.params.documentId, body);
    if (!document) return res.status(404).json({ message: "Document not found" });
    return res.json(document);
  } catch (err) { return next(err); }
});

router.delete("/:id/documents/:documentId", async (req, res, next) => {
  try {
    return res.json(await removeDocument(req.params.id, req.params.documentId));
  } catch (err) { return next(err); }
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

router.get("/:id/diagnosis", (req, res) => {
  const cached = getCachedDiagnosis(req.params.id);
  if (!cached) return res.status(404).json({ message: "No diagnosis yet. POST to generate one." });
  return res.json(cached);
});

router.post("/:id/diagnosis", async (req, res, next) => {
  try {
    const company = getCompany(req.params.id);
    if (!company) return res.status(404).json({ message: "Company not found" });
    const result = await generateCommercialDiagnosis(company);
    cacheDiagnosis(result);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

router.get("/:id/export-pdf", (req, res) => {
  const company = getCompany(req.params.id);
  if (!company) return res.status(404).json({ message: "Company not found" });

  const diagnosis = getCachedDiagnosis(req.params.id);
  const scan = getAudit(req.params.id);

  const checks = [
    { label: "Site", ok: Boolean(company.website) },
    { label: "SSL", ok: Boolean(company.hasSsl) },
    { label: "Responsivo", ok: Boolean(company.isResponsive) },
    { label: "Google Ads", ok: Boolean(company.hasGoogleAds) },
    { label: "Meta Pixel", ok: Boolean(company.metaPixel) },
    { label: "GTM", ok: Boolean(company.googleTagManager || company.gtmContainerId) },
    { label: "GA4", ok: Boolean(company.hasGA4) },
    { label: "SEO básico", ok: Boolean(company.seoBasics || (company.hasH1 && company.hasCanonical)) }
  ];

  const checksHtml = checks
    .map((c) => `<li class="${c.ok ? "ok" : "missing"}">${c.ok ? "✓" : "✗"} ${c.label}</li>`)
    .join("");

  const opportunitiesHtml = company.detectedOpportunities
    .map((o) => `<li>${o}</li>`)
    .join("") || "<li>Nenhuma oportunidade detectada.</li>";

  const suggestionsHtml = company.suggestions
    .map((s) => `<li>${s}</li>`)
    .join("") || "<li>Sem sugestões no momento.</li>";

  const diagHtml = diagnosis
    ? `
    <section>
      <h2>Diagnóstico IA</h2>
      <p>${diagnosis.summary}</p>
      <h3>Serviços sugeridos</h3>
      <ul>${diagnosis.suggestedServices.map((s) => `<li>${s}</li>`).join("")}</ul>
    </section>
    <section>
      <h2>Mensagem WhatsApp</h2>
      <p class="copy-box">${diagnosis.whatsappCopy}</p>
    </section>
    <section>
      <h2>Email comercial</h2>
      <p><strong>Assunto:</strong> ${diagnosis.emailSubject}</p>
      <pre class="copy-box">${diagnosis.emailBody}</pre>
    </section>`
    : `<section><p class="note">Gere o diagnóstico IA para incluir cópias comerciais neste relatório.</p></section>`;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Relatório — ${company.name}</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 24px; color: #1e293b; }
  .brand { display:flex; align-items:center; gap:16px; background:#0A0F1E; border-radius:12px; padding:18px; margin-bottom:20px; color:#fff; }
  .brand img { width:76px; height:auto; object-fit:contain; }
  .brand-title { font-size:24px; font-weight:800; letter-spacing:0.02em; }
  .brand-sub { color:#42D7FF; font-size:11px; text-transform:uppercase; letter-spacing:0.22em; margin-top:3px; }
  h1 { font-size: 22px; color: #0f172a; border-bottom: 2px solid #0ea5e9; padding-bottom: 8px; }
  h2 { font-size: 16px; color: #0f172a; margin-top: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
  h3 { font-size: 14px; color: #334155; }
  section { margin-bottom: 24px; }
  .score { font-size: 48px; font-weight: bold; color: #0ea5e9; }
  .meta { color: #64748b; font-size: 13px; }
  ul { padding-left: 18px; }
  li { margin-bottom: 4px; font-size: 13px; }
  li.ok { color: #15803d; }
  li.missing { color: #dc2626; }
  .copy-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; font-size: 13px; white-space: pre-wrap; }
  .note { color: #94a3b8; font-style: italic; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <div class="brand">
    <img src="https://nodere.com.br/nodere-logo.png" alt="NODERE">
    <div>
      <div class="brand-title">NODERE</div>
      <div class="brand-sub">Intelligence</div>
    </div>
  </div>
  <h1>Relatório Comercial — ${company.name}</h1>
  <p class="meta">${company.category} · ${company.address} · Gerado em ${new Date().toLocaleDateString("pt-BR")}</p>

  <section>
    <h2>Score de Oportunidade</h2>
    <p class="score">${company.score}<span style="font-size:18px;color:#94a3b8">/100</span></p>
    <p>Nível: <strong>${company.opportunityLevel}</strong> · Rating Google: ${company.rating ?? "—"} (${company.reviewCount ?? 0} avaliações)</p>
  </section>

  <section>
    <h2>Sinais digitais</h2>
    <ul>${checksHtml}</ul>
  </section>

  <section>
    <h2>Oportunidades detectadas</h2>
    <ul>${opportunitiesHtml}</ul>
  </section>

  <section>
    <h2>Sugestões comerciais</h2>
    <ul>${suggestionsHtml}</ul>
  </section>

  ${diagHtml}

  <p class="meta" style="margin-top:40px;border-top:1px solid #e2e8f0;padding-top:12px;">
    Relatório gerado por NODERE Intelligence · ${new Date().toISOString()}
  </p>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.send(html);
});

router.get("/:id/sequences", (req, res) => {
  const company = getCompany(req.params.id);
  if (!company) return res.status(404).json({ message: "Company not found" });
  return res.json(getInstancesByCompany(req.params.id));
});

router.post("/:id/sequences", (req, res) => {
  const body = z.object({ templateId: z.string() }).parse(req.body);
  const company = getCompany(req.params.id);
  if (!company) return res.status(404).json({ message: "Company not found" });
  const instance = activateSequence(company.id, company.name, body.templateId);
  return res.status(201).json(instance);
});

export default router;
