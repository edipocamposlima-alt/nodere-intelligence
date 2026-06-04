import { Router } from "express";
import { z } from "zod";
import { getRequestWorkspaceId } from "../middleware/session.js";
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
  updateCompany,
  updateDocument,
  saveCompanies,
  updateStatus,
  updateTask
} from "../services/companyStore.js";
import { enrichCompanyExternal } from "../services/externalEnrichment.js";
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
import { enrichCnpj } from "../services/cnpjEnrichment.js";
import { getSupabase } from "../db/supabase.js";
import { randomUUID } from "node:crypto";
import { parse as parseCsvSync } from "csv-parse/sync";
import * as XLSX from "xlsx";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    res.json(await listCompaniesAsync(getRequestWorkspaceId(req)));
  } catch (err) { next(err); }
});

router.get("/saved-ids", async (req, res, next) => {
  try {
    const companies = await listCompaniesAsync(getRequestWorkspaceId(req));
    res.json(companies.map((company) => company.id));
  } catch (err) { next(err); }
});

router.get("/import/template", (_req, res) => {
  const headers = [
    "name",
    "razao_social",
    "cnpj",
    "segment",
    "city",
    "state",
    "phone",
    "whatsapp",
    "email_principal",
    "website",
    "notes"
  ];
  const example = [
    "Empresa Exemplo",
    "Empresa Exemplo Ltda",
    "00.000.000/0001-00",
    "Clínicas e Saúde",
    "Caxias do Sul",
    "RS",
    "(54) 3333-3333",
    "(54) 99999-9999",
    "contato@empresa.com.br",
    "https://empresa.com.br",
    "Observação inicial"
  ];
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=\"modelo-importacao-nodere.csv\"");
  res.send(`${headers.join(",")}\n${example.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")}\n`);
});

router.get("/:id", async (req, res, next) => {
  try {
    const company = await getCompanyAsync(req.params.id);
    if (!company) return res.status(404).json({ message: "Company not found" });
    return res.json(company);
  } catch (err) { return next(err); }
});

router.post("/:id/analyze", async (req, res, next) => {
  try {
  const company = getCompany(req.params.id);
  if (!company) return res.status(404).json({ message: "Company not found" });
  if (!company.website) return res.status(422).json({ message: "Company has no website to analyze" });
  await consumeEnrichment(company.name, getRequestWorkspaceId(req));
  const job = queueEnrichment(company.id, company.name);
  return res.status(202).json({ message: "Enrichment queued", job });
  } catch (error) {
    return next(error);
  }
});

router.post("/import", async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const parsed = parseImportPayload(req);
    const map = parsed.columnMap;
    if (parsed.rows.length === 0) return res.status(400).json({ message: "Envie arquivo CSV/XLSX, CSV bruto ou campo csv." });
    const rows = parsed.rows;
    if (rows.length < 2) return res.status(400).json({ message: "CSV sem linhas suficientes." });
    const headers = rows[0].map((h) => h.trim());
    const imported: any[] = [];
    const duplicates: any[] = [];
    const errors: Array<{ row: number; reason: string }> = [];
    const existing = await listCompaniesAsync(workspaceId);
    const existingKeys = new Set(existing.flatMap((c) => [
      `${c.name}|${c.city}`.toLowerCase(),
      c.cnpj ? `cnpj:${cleanDigits(c.cnpj)}` : ""
    ].filter(Boolean)));
    for (let i = 1; i < rows.length; i++) {
      const raw = Object.fromEntries(headers.map((h, idx) => [h, rows[i][idx] || ""]));
      const get = (field: string) => readMappedField(raw, field, map);
      const name = String(get("name")).trim();
      const city = String(get("city")).trim();
      const cnpj = cleanDigits(String(get("cnpj")));
      const email = String(get("email_principal") || get("email")).trim();
      if (!name) {
        errors.push({ row: i + 1, reason: "name vazio" });
        continue;
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push({ row: i + 1, reason: "email inválido" });
        continue;
      }
      const key = cnpj ? `cnpj:${cnpj}` : `${name}|${city}`.toLowerCase();
      if (existingKeys.has(key)) {
        duplicates.push({ row: i + 1, name, city });
        continue;
      }
      existingKeys.add(key);
      imported.push({
        id: `csv-${randomUUID()}`,
        name,
        category: String(get("segment")).trim(),
        city,
        state: String(get("state")).trim(),
        cnpj,
        legalName: String(get("razao_social")).trim() || undefined,
        address: "",
        phone: normalizePhone(String(get("phone"))),
        whatsapp: normalizeWhatsapp(String(get("whatsapp") || get("phone"))),
        emailPrincipal: email,
        website: String(get("website")).trim(),
        status: "Novo Lead",
        score: 50,
        opportunityLevel: "Media",
        detectedOpportunities: [],
        suggestions: [],
        notes: get("notes") ? [{ id: randomUUID(), companyId: "", body: String(get("notes")), createdAt: new Date().toISOString() }] : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    await saveCompanies(imported, workspaceId);
    await logDownload(workspaceId, getSessionUserId(req), "import", parsed.fileName || "importacao-empresas", {
      imported: imported.length,
      duplicates: duplicates.length,
      errors: errors.length,
      source: parsed.source
    });
    res.status(201).json({ imported: imported.length, duplicates: duplicates.length, errors, companies: imported });
  } catch (error) {
    next(error);
  }
});

router.get("/:id/enrichment", (req, res) => {
  const job = getJobByCompany(req.params.id);
  if (!job) return res.status(404).json({ message: "No enrichment job found" });
  return res.json(job);
});

router.patch("/:id/status", async (req, res, next) => {
  try {
    const body = z.object({ status: z.string() }).parse(req.body);
    const company = await updateStatus(req.params.id, body.status as never, getRequestWorkspaceId(req));
    if (!company) return res.status(404).json({ message: "Company not found" });
    return res.json(company);
  } catch (err) { return next(err); }
});

router.post("/:id/notes", async (req, res, next) => {
  try {
    const body = z.object({ body: z.string().min(2) }).parse(req.body);
    const note = await addNote(req.params.id, body.body, getRequestWorkspaceId(req));
    if (!note) return res.status(404).json({ message: "Company not found" });
    return res.status(201).json(note);
  } catch (err) { return next(err); }
});

router.post("/:id/enrich-external", async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const company = await getCompanyAsync(req.params.id, workspaceId);
    if (!company) return res.status(404).json({ message: "Company not found" });
    const enrichment = await enrichCompanyExternal(company);
    const updated = await import("../services/companyStore.js").then(({ updateCompany }) =>
      updateCompany(company.id, {
        cnpj: enrichment.cnpj,
        legalName: enrichment.legalName,
        companySize: enrichment.companySize,
        revenueRange: enrichment.revenueRange,
        linkedin: enrichment.linkedin || company.linkedin,
        decisionMakers: enrichment.decisionMakers,
        enrichmentSources: enrichment.enrichmentSources,
        enrichmentStatus: enrichment.enrichmentSources.length ? "done" : "error"
      }, workspaceId)
    );
    return res.json({ company: updated ?? company, enrichment });
  } catch (err) {
    return next(err);
  }
});

router.get("/:id/enrich", async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const company = await getCompanyAsync(req.params.id, workspaceId);
    if (!company) return res.status(404).json({ message: "Company not found" });
    await updateCompany(company.id, { enrichmentStatus: "running" as any }, workspaceId);
    const result = await enrichCnpj(company);
    if (result.fields) await updateCompany(company.id, { ...(result.fields as any), enrichmentStatus: result.status === "enriched" ? "done" : "error" } as any, workspaceId);
    else await updateCompany(company.id, { enrichmentStatus: result.status === "not_found" ? "none" : "error" } as any, workspaceId);
    res.json({ enrichment: result, company: await getCompanyAsync(company.id, workspaceId) });
  } catch (error) {
    next(error);
  }
});

router.get("/:id/notes", async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const company = await getCompanyAsync(req.params.id, workspaceId);
    if (!company) return res.status(404).json({ message: "Company not found" });
    return res.json(await listNotes(req.params.id, workspaceId));
  } catch (err) { return next(err); }
});

router.get("/:id/contacts", async (req, res, next) => {
  try {
    const sb = requireSupabase();
    const workspaceId = getRequestWorkspaceId(req);
    const { data, error } = await sb
      .from("company_contacts")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("company_id", req.params.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return res.json(data ?? []);
  } catch (error) { return next(error); }
});

router.post("/:id/contacts", async (req, res, next) => {
  try {
    const body = z.object({
      name: z.string().min(2),
      role: z.string().optional().nullable(),
      email: z.string().optional().nullable(),
      phone: z.string().optional().nullable(),
      whatsapp: z.string().optional().nullable(),
      linkedinUrl: z.string().optional().nullable(),
      notes: z.string().optional().nullable()
    }).parse(req.body);
    const workspaceId = getRequestWorkspaceId(req);
    const row = {
      id: randomUUID(),
      workspace_id: workspaceId,
      company_id: req.params.id,
      name: body.name,
      role: body.role,
      email: body.email,
      phone: body.phone,
      whatsapp: normalizeWhatsapp(String(body.whatsapp || body.phone || "")),
      linkedin_url: body.linkedinUrl,
      notes: body.notes
    };
    const { data, error } = await requireSupabase().from("company_contacts").insert(row).select("*").single();
    if (error) throw error;
    await addNote(req.params.id, `Decisor cadastrado: ${body.name}`, workspaceId);
    return res.status(201).json(data);
  } catch (error) { return next(error); }
});

router.patch("/:id/contacts/:contactId", async (req, res, next) => {
  try {
    const body = z.object({
      name: z.string().optional(),
      role: z.string().optional().nullable(),
      email: z.string().optional().nullable(),
      phone: z.string().optional().nullable(),
      whatsapp: z.string().optional().nullable(),
      linkedinUrl: z.string().optional().nullable(),
      notes: z.string().optional().nullable()
    }).parse(req.body);
    const row: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };
    if (body.name !== undefined) row.name = body.name;
    if (body.role !== undefined) row.role = body.role;
    if (body.email !== undefined) row.email = body.email;
    if (body.phone !== undefined) row.phone = body.phone;
    if (body.whatsapp !== undefined) row.whatsapp = normalizeWhatsapp(String(body.whatsapp || ""));
    if (body.linkedinUrl !== undefined) row.linkedin_url = body.linkedinUrl;
    if (body.notes !== undefined) row.notes = body.notes;
    const { data, error } = await requireSupabase()
      .from("company_contacts")
      .update(row)
      .eq("workspace_id", getRequestWorkspaceId(req))
      .eq("company_id", req.params.id)
      .eq("id", req.params.contactId)
      .select("*")
      .single();
    if (error) throw error;
    return res.json(data);
  } catch (error) { return next(error); }
});

router.delete("/:id/contacts/:contactId", async (req, res, next) => {
  try {
    const { error } = await requireSupabase()
      .from("company_contacts")
      .delete()
      .eq("workspace_id", getRequestWorkspaceId(req))
      .eq("company_id", req.params.id)
      .eq("id", req.params.contactId);
    if (error) throw error;
    return res.json({ ok: true });
  } catch (error) { return next(error); }
});

router.delete("/:id/notes/:noteId", async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const company = await getCompanyAsync(req.params.id, workspaceId);
    if (!company) return res.status(404).json({ message: "Company not found" });
    return res.json(await removeNote(req.params.id, req.params.noteId, workspaceId));
  } catch (err) { return next(err); }
});

router.get("/:id/tasks", async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const company = await getCompanyAsync(req.params.id, workspaceId);
    if (!company) return res.status(404).json({ message: "Company not found" });
    return res.json(await listTasks(req.params.id, workspaceId));
  } catch (err) { return next(err); }
});

router.get("/:id/communications", async (req, res, next) => {
  try {
    const { data, error } = await requireSupabase()
      .from("communications")
      .select("*")
      .eq("workspace_id", getRequestWorkspaceId(req))
      .eq("company_id", req.params.id)
      .order("sent_at", { ascending: false });
    if (error) throw error;
    return res.json(data ?? []);
  } catch (error) { return next(error); }
});

router.post("/:id/communications", async (req, res, next) => {
  try {
    const body = z.object({
      contactId: z.string().optional().nullable(),
      type: z.enum(["whatsapp", "email", "call", "meeting", "note", "internal", "linkedin", "instagram"]),
      direction: z.enum(["outbound", "inbound", "manual"]),
      subject: z.string().optional().nullable(),
      body: z.string().optional().nullable(),
      sentAt: z.string().optional().nullable(),
      status: z.string().optional().nullable()
    }).parse(req.body);
    const workspaceId = getRequestWorkspaceId(req);
    const row = {
      id: randomUUID(),
      workspace_id: workspaceId,
      company_id: req.params.id,
      contact_id: body.contactId,
      type: body.type,
      direction: body.direction,
      subject: body.subject,
      body: body.body,
      sent_at: body.sentAt || new Date().toISOString(),
      status: body.status || "sent"
    };
    const { data, error } = await requireSupabase().from("communications").insert(row).select("*").single();
    if (error) throw error;
    await addNote(req.params.id, `Interação registrada: ${body.type}${body.subject ? ` — ${body.subject}` : ""}`, workspaceId);
    return res.status(201).json(data);
  } catch (error) { return next(error); }
});

router.delete("/:id/communications/:commId", async (req, res, next) => {
  try {
    const { error } = await requireSupabase()
      .from("communications")
      .delete()
      .eq("workspace_id", getRequestWorkspaceId(req))
      .eq("company_id", req.params.id)
      .eq("id", req.params.commId);
    if (error) throw error;
    return res.json({ ok: true });
  } catch (error) { return next(error); }
});

router.get("/:id/contracts", async (req, res, next) => {
  try {
    const { data, error } = await requireSupabase()
      .from("company_contracts")
      .select("*, catalog_items(*)")
      .eq("workspace_id", getRequestWorkspaceId(req))
      .eq("company_id", req.params.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return res.json(data ?? []);
  } catch (error) { return next(error); }
});

router.post("/:id/contracts", async (req, res, next) => {
  try {
    const body = z.object({
      catalogItemId: z.string(),
      quantity: z.coerce.number().min(1).default(1),
      contractedPrice: z.coerce.number().min(0),
      discountPct: z.coerce.number().min(0).optional().nullable(),
      contractedAt: z.string().optional().nullable(),
      status: z.string().optional().nullable(),
      notes: z.string().optional().nullable()
    }).parse(req.body);
    const workspaceId = getRequestWorkspaceId(req);
    const row = {
      id: randomUUID(),
      workspace_id: workspaceId,
      company_id: req.params.id,
      catalog_item_id: body.catalogItemId,
      quantity: body.quantity,
      contracted_price: body.contractedPrice,
      discount_pct: body.discountPct,
      contracted_at: body.contractedAt || new Date().toISOString().slice(0, 10),
      status: body.status || "active",
      notes: body.notes
    };
    const { data, error } = await requireSupabase().from("company_contracts").insert(row).select("*").single();
    if (error) throw error;
    await addNote(req.params.id, `Serviço/produto contratado vinculado ao lead.`, workspaceId);
    return res.status(201).json(data);
  } catch (error) { return next(error); }
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
    const workspaceId = getRequestWorkspaceId(req);
    const company = await getCompanyAsync(req.params.id, workspaceId);
    if (!company) return res.status(404).json({ message: "Company not found" });
    const task = await createTask(req.params.id, {
      title: body.title,
      description: body.description ?? undefined,
      dueAt: body.dueAt ?? undefined,
      priority: body.priority ?? undefined,
      channel: body.channel ?? undefined
    }, workspaceId);
    await addNote(req.params.id, `Tarefa criada: ${task.title}`, workspaceId);
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
    const task = await updateTask(req.params.id, req.params.taskId, body, getRequestWorkspaceId(req));
    if (!task) return res.status(404).json({ message: "Task not found" });
    return res.json(task);
  } catch (err) { return next(err); }
});

router.get("/:id/documents", async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const company = await getCompanyAsync(req.params.id, workspaceId);
    if (!company) return res.status(404).json({ message: "Company not found" });
    return res.json(await listDocuments(req.params.id, workspaceId));
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
    const workspaceId = getRequestWorkspaceId(req);
    const company = await getCompanyAsync(req.params.id, workspaceId);
    if (!company) return res.status(404).json({ message: "Company not found" });
    const document = await createDocument(req.params.id, body, workspaceId);
    await addNote(req.params.id, `Documento salvo: ${document.title}`, workspaceId);
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
    const document = await updateDocument(req.params.id, req.params.documentId, body, getRequestWorkspaceId(req));
    if (!document) return res.status(404).json({ message: "Document not found" });
    return res.json(document);
  } catch (err) { return next(err); }
});

router.delete("/:id/documents/:documentId", async (req, res, next) => {
  try {
    return res.json(await removeDocument(req.params.id, req.params.documentId, getRequestWorkspaceId(req)));
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

function parseCsv(csv: string) {
  const firstLine = csv.split(/\r?\n/).find((line) => line.trim()) ?? "";
  const delimiter = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  return csv
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => {
      const cells: string[] = [];
      let current = "";
      let quoted = false;
      for (const char of line) {
        if (char === '"') quoted = !quoted;
        else if (char === delimiter && !quoted) {
          cells.push(current.trim());
          current = "";
        } else current += char;
      }
      cells.push(current.trim());
      return cells;
    });
}

function parseImportPayload(req: any): { rows: string[][]; columnMap: Record<string, string>; fileName?: string; source: string } {
  const contentType = String(req.headers["content-type"] || "");
  if (Buffer.isBuffer(req.body)) {
    if (contentType.includes("multipart/form-data")) {
      const multipart = parseMultipart(req.body, contentType);
      const columnMap = parseColumnMap(multipart.fields.column_map || multipart.fields.columnMap);
      if (!multipart.file?.buffer?.length) return { rows: [], columnMap, source: "multipart" };
      return {
        rows: parseImportFile(multipart.file.buffer, multipart.file.filename || "", multipart.file.contentType || ""),
        columnMap,
        fileName: multipart.file.filename,
        source: "multipart"
      };
    }
    return {
      rows: parseImportFile(req.body, String(req.headers["x-file-name"] || ""), contentType),
      columnMap: {},
      fileName: String(req.headers["x-file-name"] || ""),
      source: contentType.includes("sheet") || contentType.includes("excel") ? "xlsx" : "csv"
    };
  }

  const csv = typeof req.body === "string" ? req.body : String(req.body?.csv || "");
  return {
    rows: csv.trim() ? parseCsv(csv) : [],
    columnMap: typeof req.body?.column_map === "object" ? req.body.column_map : parseColumnMap(req.body?.column_map),
    source: "json"
  };
}

function parseImportFile(buffer: Buffer, filename: string, contentType: string) {
  const lowerName = filename.toLowerCase();
  if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls") || contentType.includes("spreadsheet") || contentType.includes("excel")) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const firstSheet = workbook.SheetNames[0];
    if (!firstSheet) return [];
    return (XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { header: 1, defval: "" }) as unknown[][])
      .map((row) => row.map((cell) => String(cell ?? "").trim()))
      .filter((row) => row.some((cell) => cell));
  }
  return parseCsvSync(buffer.toString("utf8"), {
    bom: true,
    delimiter: [",", ";"],
    relaxColumnCount: true,
    skipEmptyLines: true,
    trim: true
  }) as string[][];
}

function parseMultipart(buffer: Buffer, contentType: string) {
  const boundary = contentType.match(/boundary=([^;]+)/i)?.[1]?.replace(/^"|"$/g, "");
  if (!boundary) return { fields: {} as Record<string, string>, file: null as null | { filename: string; contentType: string; buffer: Buffer } };
  const marker = Buffer.from(`--${boundary}`);
  const parts: Buffer[] = [];
  let start = buffer.indexOf(marker);
  while (start >= 0) {
    start += marker.length;
    if (buffer[start] === 45 && buffer[start + 1] === 45) break;
    if (buffer[start] === 13 && buffer[start + 1] === 10) start += 2;
    const next = buffer.indexOf(marker, start);
    if (next < 0) break;
    const end = buffer[next - 2] === 13 && buffer[next - 1] === 10 ? next - 2 : next;
    parts.push(buffer.subarray(start, end));
    start = next;
  }

  const fields: Record<string, string> = {};
  let file: null | { filename: string; contentType: string; buffer: Buffer } = null;
  for (const part of parts) {
    const separator = Buffer.from("\r\n\r\n");
    const splitAt = part.indexOf(separator);
    if (splitAt < 0) continue;
    const headerText = part.subarray(0, splitAt).toString("utf8");
    const body = part.subarray(splitAt + separator.length);
    const name = headerText.match(/name="([^"]+)"/)?.[1] || "";
    const filename = headerText.match(/filename="([^"]*)"/)?.[1] || "";
    const partType = headerText.match(/Content-Type:\s*([^\r\n]+)/i)?.[1] || "";
    if (filename) file = { filename, contentType: partType, buffer: body };
    else if (name) fields[name] = body.toString("utf8").trim();
  }
  return { fields, file };
}

function parseColumnMap(value: unknown) {
  if (!value) return {};
  if (typeof value === "object") return value as Record<string, string>;
  try {
    const parsed = JSON.parse(String(value));
    return typeof parsed === "object" && parsed ? parsed as Record<string, string> : {};
  } catch {
    return {};
  }
}

function getSessionUserId(req: any) {
  return String(req.session?.userId || req.admin?.userId || "");
}

async function logDownload(workspaceId: string, userId: string, fileType: string, fileName: string, metadata: Record<string, unknown>) {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from("download_logs").insert({
    id: randomUUID(),
    workspace_id: workspaceId,
    user_id: userId || null,
    file_type: fileType,
    file_name: fileName,
    metadata
  });
}

function readMappedField(raw: Record<string, string>, field: string, map: Record<string, string>) {
  const normalizedRaw = Object.fromEntries(Object.entries(raw).map(([key, value]) => [normalizeColumn(key), value]));
  const aliases: Record<string, string[]> = {
    name: ["name", "nome", "empresa", "nome_empresa", "nome_fantasia"],
    razao_social: ["razao_social", "razão_social", "razao", "razão", "legal_name"],
    cnpj: ["cnpj", "cpf_cnpj"],
    city: ["city", "cidade", "municipio", "município"],
    state: ["state", "estado", "uf"],
    segment: ["segment", "segmento", "categoria", "ramo"],
    phone: ["phone", "telefone", "telefone_principal", "fone"],
    whatsapp: ["whatsapp", "whats", "zap"],
    email_principal: ["email_principal", "email", "e-mail", "email_comercial"],
    website: ["website", "site", "url"],
    notes: ["notes", "observacoes", "observações", "obs"]
  };
  const mapped = map[field];
  if (mapped && raw[mapped]) return raw[mapped];
  for (const alias of aliases[field] ?? [field]) {
    const value = normalizedRaw[normalizeColumn(alias)];
    if (value) return value;
  }
  return "";
}

function normalizeColumn(value: string) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function cleanDigits(value: string) {
  return value.replace(/\D/g, "");
}

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("55")) return `+${digits}`;
  return `+55${digits}`;
}

function normalizeWhatsapp(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  const local = digits.startsWith("55") ? digits.slice(2) : digits;
  if (local.length === 11 && local[2] === "9") return digits.startsWith("55") ? `+${digits}` : `+55${digits}`;
  return "";
}

function requireSupabase() {
  const sb = getSupabase();
  if (!sb) {
    const error = new Error("Supabase não configurado para persistência desta operação.") as Error & { status?: number; code?: string };
    error.status = 503;
    error.code = "SUPABASE_NOT_CONFIGURED";
    throw error;
  }
  return sb;
}
