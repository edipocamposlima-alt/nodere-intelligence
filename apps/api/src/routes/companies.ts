import { Router } from "express";
import { z } from "zod";
import { existsSync, readFileSync } from "node:fs";
import * as path from "node:path";
import { getRequestWorkspaceId, isPrivilegedSession, requireWorkspaceMutation } from "../middleware/session.js";
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
  deleteCompany,
  removeDocument,
  removeNote,
  updateNote,
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
import { isMissingSupabaseSchema } from "../utils/supabaseErrors.js";
import { cacheDiagnosis, getCachedDiagnosis } from "../services/diagnosisStore.js";
import { defaultProspectingMessage, sendWhatsappMessage } from "../services/whatsapp.js";
import { activateSequence, getInstancesByCompany } from "../services/emailSequences.js";
import { enrichCnpj } from "../services/cnpjEnrichment.js";
import { getSupabase } from "../db/supabase.js";
import { markOnboardingStep } from "../services/onboardingStore.js";
import { logRequestMetric } from "../services/metricsStore.js";
import { randomUUID } from "node:crypto";
import { parse as parseCsvSync } from "csv-parse/sync";
import * as XLSX from "xlsx";
import nodemailer from "nodemailer";
import multer from "multer";

const router = Router();
router.use(requireWorkspaceMutation("owner", "admin", "operator"));
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 12 * 1024 * 1024 } });
const embeddedLogoDataUri = loadNodereLogoDataUri();

const companyUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  category: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  facebook: z.string().optional().nullable(),
  linkedin: z.string().optional().nullable(),
  youtube: z.string().optional().nullable(),
  cnpj: z.string().optional().nullable(),
  legalName: z.string().optional().nullable(),
  score: z.coerce.number().min(0).max(100).optional(),
  opportunityLevel: z.enum(["Alta", "Media", "Baixa"]).optional(),
  companySize: z.string().optional().nullable(),
  revenueRange: z.string().optional().nullable()
}).passthrough();

const manualCompanySchema = z.object({
  name: z.string().min(2),
  legalName: z.string().optional().nullable(),
  cnpj: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  cep: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  facebook: z.string().optional().nullable(),
  linkedin: z.string().optional().nullable(),
  youtube: z.string().optional().nullable(),
  principalContact: z.string().optional().nullable(),
  principalContactRole: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  temperature: z.string().optional().nullable(),
  serviceInterest: z.string().optional().nullable(),
  score: z.coerce.number().min(0).max(100).optional(),
  opportunityLevel: z.enum(["Alta", "Media", "Baixa"]).optional()
}).superRefine((input, ctx) => {
  const cnpj = cleanDigits(input.cnpj || "");
  if (cnpj && cnpj.length !== 14) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "CNPJ deve conter 14 dígitos.", path: ["cnpj"] });
  }
  const whatsapp = cleanDigits(input.whatsapp || "");
  if (whatsapp && whatsapp.length >= 10) {
    const local = whatsapp.startsWith("55") ? whatsapp.slice(2) : whatsapp;
    if (!(local.length === 11 && local[2] === "9")) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "WhatsApp deve ser celular com DDD e 9 dígitos.", path: ["whatsapp"] });
    }
  }
});

router.get("/", async (req, res, next) => {
  try {
    res.json(await listCompaniesAsync(getRequestWorkspaceId(req)));
  } catch (err) { next(err); }
});

router.get("/saved-ids", async (req, res, next) => {
  try {
    const companies = await listCompaniesAsync(getRequestWorkspaceId(req));
    const ids = new Set<string>();
    for (const company of companies) {
      const raw = company as unknown as Record<string, unknown>;
      const signals = (raw.digitalSignals || raw.digital_signals || {}) as Record<string, unknown>;
      [
        company.id,
        raw.placeId,
        raw.googlePlaceId,
        raw.google_place_id,
        signals.placeId,
        signals.googlePlaceId,
        signals.google_place_id
      ].forEach((value) => {
        const id = String(value || "").trim();
        if (id) ids.add(id);
      });
    }
    res.json(Array.from(ids));
  } catch (err) { next(err); }
});

router.get("/search", async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const query = String(req.query.q || "").trim();
    const limit = Math.max(1, Math.min(Number(req.query.limit || 10), 30));
    const normalizedQuery = normalizeSearchText(query);
    const companies = await listCompaniesAsync(workspaceId);
    const filtered = normalizedQuery
      ? companies.filter((company) => {
          const haystack = normalizeSearchText([
            company.name,
            company.legalName,
            company.category,
            company.city,
            company.state,
            company.cnpj
          ].filter(Boolean).join(" "));
          return haystack.includes(normalizedQuery);
        })
      : companies;

    res.json({
      companies: filtered.slice(0, limit).map((company) => ({
        id: company.id,
        name: company.name,
        category: company.category,
        city: company.city,
        state: company.state,
        status: company.status,
        score: company.score
      }))
    });
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

router.post("/", async (req, res, next) => {
  try {
    const body = manualCompanySchema.parse(req.body);
    const workspaceId = getRequestWorkspaceId(req);
    if (!workspaceId) return res.status(400).json({ error: "workspace_id não identificado na sessão." });
    const now = new Date().toISOString();
    const company = {
      id: `manual-${randomUUID()}`,
      name: body.name,
      legalName: body.legalName,
      cnpj: cleanDigits(body.cnpj || ""),
      category: body.category || "Serviços",
      city: body.city || "",
      state: body.state || "",
      address: body.address || "",
      phone: normalizePhone(body.phone || ""),
      whatsapp: normalizeWhatsapp(body.whatsapp || ""),
      website: body.website || "",
      instagram: body.instagram || "",
      facebook: body.facebook || "",
      linkedin: body.linkedin || "",
      youtube: body.youtube || "",
      status: body.status || "Novo Lead",
      score: body.score ?? 50,
      opportunityLevel: body.opportunityLevel || "Media",
      detectedOpportunities: [],
      suggestions: [],
      notes: body.notes ? [{ id: randomUUID(), companyId: "", body: body.notes, createdAt: now }] : [],
      createdAt: now,
      updatedAt: now,
      origin: "Manual",
      source: "manual",
      emailPrincipal: body.email || "",
      cep: body.cep || "",
      principalContact: body.principalContact || "",
      principalContactRole: body.principalContactRole || "",
      serviceInterest: body.serviceInterest || "",
      temperature: body.temperature || "Morno"
    } as any;
    await saveCompanies([company], workspaceId);
    await markOnboardingStep(workspaceId, "crm").catch(() => undefined);
    logRequestMetric(req, "company_saved", company.id, { source: "manual", status: company.status });
    return res.status(201).json(company);
  } catch (err) { return next(err); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const company = await getCompanyAsync(req.params.id, getRequestWorkspaceId(req));
    if (!company) return res.status(404).json({ message: "Company not found" });
    return res.json(company);
  } catch (err) { return next(err); }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const body = companyUpdateSchema.parse(req.body);
    const workspaceId = getRequestWorkspaceId(req);
    const before = await getCompanyAsync(req.params.id, workspaceId).catch(() => null);
    const company = await updateCompany(req.params.id, normalizeCompanyPatch(body) as any, workspaceId);
    if (!company) return res.status(404).json({ message: "Company not found" });
    if (body.status !== undefined && before?.status !== company.status) {
      logRequestMetric(req, "crm_stage_changed", req.params.id, { from: before?.status || null, to: company.status });
    }
    return res.json(company);
  } catch (err) { return next(err); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const removed = await deleteCompany(req.params.id, getRequestWorkspaceId(req));
    if (!removed) return res.status(404).json({ message: "Company not found" });
    return res.json({ ok: true });
  } catch (err) { return next(err); }
});


router.post("/:id/logo", upload.single("logo"), async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const companyId = String(req.params.id);
    const company = await getCompanyAsync(companyId, workspaceId);
    if (!company) return res.status(404).json({ message: "Empresa não encontrada." });
    const file = req.file;
    if (!file) return res.status(400).json({ message: "Envie um arquivo de imagem no campo logo." });
    if (!file.mimetype.startsWith("image/")) return res.status(422).json({ message: "O logo precisa ser uma imagem." });

    const sb = requireSupabase();
    const storagePath = `${workspaceId}/${company.id}/logo-${randomUUID()}-${safeStorageFileName(file.originalname || "logo.png")}`;
    const { error: uploadError } = await sb.storage.from("client-logos").upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: true
    });
    if (uploadError) return res.status(500).json({ message: "Não foi possível enviar o logo. Verifique se o bucket client-logos existe no Supabase Storage.", detail: uploadError.message });

    const publicUrl = getPublicStorageUrl("client-logos", storagePath);
    const updated = await updateCompany(company.id, { logoUrl: publicUrl } as any, workspaceId);
    await addNote(company.id, `Logo da empresa atualizado: ${file.originalname}`, workspaceId).catch(() => undefined);
    return res.status(201).json({ logoUrl: publicUrl, company: updated ?? { ...company, logoUrl: publicUrl } });
  } catch (error) { return next(error); }
});

router.get("/:id/files", async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const companyId = String(req.params.id);
    const company = await getCompanyAsync(companyId, workspaceId);
    if (!company) return res.status(404).json({ message: "Empresa não encontrada." });
    const { data, error } = await requireSupabase()
      .from("company_files")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("company_id", String(req.params.id))
      .order("created_at", { ascending: false });
    if (error) throw error;
    return res.json((data ?? []).map(mapCompanyFileRow));
  } catch (error) {
    if (isMissingSupabaseSchema(error)) return res.json([]);
    return next(error);
  }
});

router.post("/:id/files", upload.single("file"), async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const companyId = String(req.params.id);
    const company = await getCompanyAsync(companyId, workspaceId);
    if (!company) return res.status(404).json({ message: "Empresa não encontrada." });
    const file = req.file;
    if (!file) return res.status(400).json({ message: "Envie um arquivo no campo file." });

    const sb = requireSupabase();
    const storagePath = `${workspaceId}/${company.id}/${randomUUID()}-${safeStorageFileName(file.originalname || "arquivo")}`;
    const { error: uploadError } = await sb.storage.from("client-files").upload(storagePath, file.buffer, {
      contentType: file.mimetype || "application/octet-stream",
      upsert: false
    });
    if (uploadError) return res.status(500).json({ message: "Não foi possível enviar o arquivo. Verifique se o bucket client-files existe no Supabase Storage.", detail: uploadError.message });

    const row = {
      id: randomUUID(),
      workspace_id: workspaceId,
      company_id: company.id,
      filename: file.originalname || "arquivo",
      storage_path: storagePath,
      file_url: getPublicStorageUrl("client-files", storagePath),
      file_type: file.mimetype || "application/octet-stream",
      file_size: file.size,
      uploaded_by: getSessionUserId(req) || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const { data, error } = await sb.from("company_files").insert(row).select("*").single();
    if (error) throw error;
    await addNote(company.id, `Arquivo anexado: ${row.filename}`, workspaceId).catch(() => undefined);
    return res.status(201).json(mapCompanyFileRow(data));
  } catch (error) { return next(error); }
});

router.delete("/:id/files/:fileId", async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const sb = requireSupabase();
    const { data, error } = await sb
      .from("company_files")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("company_id", String(req.params.id))
      .eq("id", req.params.fileId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Arquivo não encontrado." });
    await sb.storage.from("client-files").remove([String(data.storage_path)]);
    const { error: deleteError } = await sb
      .from("company_files")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("company_id", String(req.params.id))
      .eq("id", req.params.fileId);
    if (deleteError) throw deleteError;
    await addNote(String(req.params.id), `Arquivo removido: ${data.filename}`, workspaceId).catch(() => undefined);
    return res.json({ ok: true });
  } catch (error) { return next(error); }
});
router.post("/:id/analyze", async (req, res, next) => {
  try {
  const company = getCompany(req.params.id);
  if (!company) return res.status(404).json({ message: "Company not found" });
  if (!company.website) return res.status(422).json({ message: "Company has no website to analyze" });
  if (!isPrivilegedSession(req)) {
    await consumeEnrichment(company.name, getRequestWorkspaceId(req));
  }
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
        source: "import",
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
    if (imported.length > 0) await markOnboardingStep(workspaceId, "crm").catch(() => undefined);
    for (const item of imported) {
      logRequestMetric(req, "company_saved", item.id, { source: "import", fileName: parsed.fileName || null });
    }
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
    const workspaceId = getRequestWorkspaceId(req);
    const before = await getCompanyAsync(req.params.id, workspaceId).catch(() => null);
    const company = await updateStatus(req.params.id, body.status as never, workspaceId);
    if (!company) return res.status(404).json({ message: "Company not found" });
    if (before?.status !== company.status) {
      logRequestMetric(req, "crm_stage_changed", req.params.id, { from: before?.status || null, to: company.status });
    }
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
    const companyId = String(req.params.id);
    const company = await getCompanyAsync(companyId, workspaceId);
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
    const companyId = String(req.params.id);
    const company = await getCompanyAsync(companyId, workspaceId);
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
    const companyId = String(req.params.id);
    const company = await getCompanyAsync(companyId, workspaceId);
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
      .eq("company_id", String(req.params.id))
      .order("created_at", { ascending: false });
    if (error) throw error;
    return res.json(data ?? []);
  } catch (error) {
    if (isMissingSupabaseSchema(error)) return res.json([]);
    return next(error);
  }
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
      .eq("company_id", String(req.params.id))
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
      .eq("company_id", String(req.params.id))
      .eq("id", req.params.contactId);
    if (error) throw error;
    return res.json({ ok: true });
  } catch (error) { return next(error); }
});

router.patch("/:id/notes/:noteId", async (req, res, next) => {
  try {
    const body = z.object({ body: z.string().min(2) }).parse(req.body);
    const workspaceId = getRequestWorkspaceId(req);
    const companyId = String(req.params.id);
    const company = await getCompanyAsync(companyId, workspaceId);
    if (!company) return res.status(404).json({ message: "Company not found" });
    const note = await updateNote(companyId, req.params.noteId, body.body, workspaceId);
    if (!note) return res.status(404).json({ message: "Observação não encontrada." });
    return res.json(note);
  } catch (err) { return next(err); }
});

router.delete("/:id/notes/:noteId", async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const companyId = String(req.params.id);
    const company = await getCompanyAsync(companyId, workspaceId);
    if (!company) return res.status(404).json({ message: "Company not found" });
    return res.json(await removeNote(req.params.id, req.params.noteId, workspaceId));
  } catch (err) { return next(err); }
});

router.get("/:id/tasks", async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const companyId = String(req.params.id);
    const company = await getCompanyAsync(companyId, workspaceId);
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
      .eq("company_id", String(req.params.id))
      .order("sent_at", { ascending: false });
    if (error) throw error;
    return res.json(data ?? []);
  } catch (error) {
    if (isMissingSupabaseSchema(error)) return res.json([]);
    return next(error);
  }
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
      status: z.string().optional().nullable(),
      responsible: z.string().optional().nullable(),
      nextAction: z.string().optional().nullable()
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
      sent_by: body.responsible || getSessionUserId(req) || null,
      sent_at: body.sentAt || new Date().toISOString(),
      status: body.status || "sent",
      metadata: { nextAction: body.nextAction || "", responsible: body.responsible || "" }
    };
    const { data, error } = await requireSupabase().from("communications").insert(row).select("*").single();
    if (error) throw error;
    await addNote(req.params.id, `Interação registrada: ${body.type}${body.subject ? ` — ${body.subject}` : ""}`, workspaceId);
    logRequestMetric(req, "communication_logged", req.params.id, { type: body.type, direction: body.direction });
    return res.status(201).json(data);
  } catch (error) { return next(error); }
});

router.delete("/:id/communications/:commId", async (req, res, next) => {
  try {
    const { error } = await requireSupabase()
      .from("communications")
      .delete()
      .eq("workspace_id", getRequestWorkspaceId(req))
      .eq("company_id", String(req.params.id))
      .eq("id", req.params.commId);
    if (error) throw error;
    return res.json({ ok: true });
  } catch (error) { return next(error); }
});

router.post("/:id/email", async (req, res, next) => {
  try {
    if (!config.smtp.host || !config.smtp.user || !config.smtp.pass || !config.smtp.from) {
      return res.status(503).json({
        code: "SMTP_NOT_CONFIGURED",
        message: "SMTP não configurado no backend. Configure SMTP_HOST, SMTP_USER, SMTP_PASS e SMTP_FROM no Render para enviar e-mails reais."
      });
    }
    const body = z.object({
      to: z.string().email(),
      subject: z.string().min(2),
      body: z.string().min(2),
      contactId: z.string().optional().nullable()
    }).parse(req.body);
    const workspaceId = getRequestWorkspaceId(req);
    const companyId = String(req.params.id);
    const company = await getCompanyAsync(companyId, workspaceId);
    if (!company) return res.status(404).json({ message: "Company not found" });
    const transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: { user: config.smtp.user, pass: config.smtp.pass }
    });
    const sent = await transporter.sendMail({
      from: config.smtp.from,
      to: body.to,
      subject: body.subject,
      text: body.body
    });
    const row = {
      id: randomUUID(),
      workspace_id: workspaceId,
      company_id: req.params.id,
      contact_id: body.contactId || null,
      type: "email",
      direction: "outbound",
      subject: body.subject,
      body: body.body,
      sent_by: getSessionUserId(req) || null,
      sent_at: new Date().toISOString(),
      status: "sent",
      metadata: { messageId: sent.messageId, to: body.to }
    };
    const { data, error } = await requireSupabase().from("communications").insert(row).select("*").single();
    if (error) throw error;
    await addNote(req.params.id, `E-mail enviado para ${body.to}: ${body.subject}`, workspaceId);
    logRequestMetric(req, "communication_logged", req.params.id, { type: "email", to: body.to });
    return res.status(201).json({ communication: data, messageId: sent.messageId });
  } catch (error) { return next(error); }
});

router.get("/:id/contracts", async (req, res, next) => {
  try {
    const { data, error } = await requireSupabase()
      .from("company_contracts")
      .select("*, catalog_items(*)")
      .eq("workspace_id", getRequestWorkspaceId(req))
      .eq("company_id", String(req.params.id))
      .order("created_at", { ascending: false });
    if (error) throw error;
    return res.json(data ?? []);
  } catch (error) {
    if (isMissingSupabaseSchema(error)) return res.json([]);
    return next(error);
  }
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
    const companyId = String(req.params.id);
    const company = await getCompanyAsync(companyId, workspaceId);
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
    const companyId = String(req.params.id);
    const company = await getCompanyAsync(companyId, workspaceId);
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
    const companyId = String(req.params.id);
    const company = await getCompanyAsync(companyId, workspaceId);
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
    await markOnboardingStep(getRequestWorkspaceId(req), "proposal").catch(() => undefined);
    logRequestMetric(req, "proposal_generated", req.params.id, { type: "diagnosis" });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

router.get("/:id/export-pdf", async (req, res, next) => {
  try {
  const workspaceId = getRequestWorkspaceId(req);
  const companyId = String(req.params.id);
    const company = await getCompanyAsync(companyId, workspaceId);
  if (!company) {
    console.error("[PDF] Company not found. ID:", req.params.id, "Workspace:", workspaceId);
    return res.status(404).json({ error: "Empresa não encontrada neste workspace." });
  }

  const diagnosis = getCachedDiagnosis(req.params.id);
  const scan = getAudit(req.params.id);
  const notes = await listNotes(company.id, workspaceId).catch(() => []);
  const tasks = await listTasks(company.id, workspaceId).catch(() => []);
  const documents = await listDocuments(company.id, workspaceId).catch(() => []);

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
    .map((o) => `<li>${escapeHtml(o)}</li>`)
    .join("") || "<li>Nenhuma oportunidade detectada.</li>";

  const suggestionsHtml = company.suggestions
    .map((s) => `<li>${escapeHtml(s)}</li>`)
    .join("") || "<li>Sem sugestões no momento.</li>";

  const notesHtml = notes
    .map((note) => `<li><strong>${formatPtBrDate(note.createdAt)}</strong> — ${escapeHtml(note.body)}</li>`)
    .join("") || "<li>Sem observações registradas.</li>";

  const tasksHtml = tasks
    .map((task) => `<li><strong>${escapeHtml(task.title)}</strong> — ${escapeHtml(task.status)}${task.dueAt ? ` · ${formatPtBrDate(task.dueAt)}` : ""}</li>`)
    .join("") || "<li>Sem follow-ups registrados.</li>";

  const documentsHtml = documents
    .map((doc) => `<li><strong>${escapeHtml(doc.title)}</strong>${doc.fileName ? ` — ${escapeHtml(doc.fileName)}` : ""}</li>`)
    .join("") || "<li>Sem documentos anexados.</li>";

  const diagHtml = diagnosis
    ? `
    <section>
      <h2>Diagnóstico IA</h2>
      <p>${escapeHtml(diagnosis.summary)}</p>
      <h3>Serviços sugeridos</h3>
      <ul>${diagnosis.suggestedServices.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>
    </section>
    <section>
      <h2>Mensagem WhatsApp</h2>
      <p class="copy-box">${escapeHtml(diagnosis.whatsappCopy)}</p>
    </section>
    <section>
      <h2>Email comercial</h2>
      <p><strong>Assunto:</strong> ${escapeHtml(diagnosis.emailSubject)}</p>
      <pre class="copy-box">${escapeHtml(diagnosis.emailBody)}</pre>
    </section>`
    : `<section><p class="note">Gere o diagnóstico IA para incluir cópias comerciais neste relatório.</p></section>`;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Relatório — ${escapeHtml(company.name)}</title>
<style>
  @page { margin: 18mm 14mm 18mm; }
  body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 88px 24px 72px; color: #111827; background: #FFFFFF; }
  .pdf-header { position: fixed; left: 24px; right: 24px; top: 16px; height: 56px; display:grid; grid-template-columns: 150px 1fr 150px; align-items:center; border-bottom:1px solid #d1d5db; background:#FFFFFF; z-index:2; }
  .pdf-header img { width:44px; height:44px; object-fit:contain; }
  .pdf-header-title { text-align:center; color:#1E6FDB; font-weight:800; font-size:14px; }
  .pdf-header-date { text-align:right; color:#4b5563; font-size:11px; }
  .brand { display:flex; align-items:center; gap:16px; background:#FFFFFF; border:2px solid #1E6FDB; border-radius:12px; padding:18px; margin-bottom:20px; color:#111827; }
  .brand img { width:92px; height:auto; object-fit:contain; border-radius:10px; }
  .brand-title { font-size:24px; font-weight:800; letter-spacing:0.02em; color:#1E6FDB; }
  .brand-sub { color:#1E6FDB; font-size:11px; text-transform:uppercase; letter-spacing:0.22em; margin-top:3px; }
  .print-footer { position: fixed; left: 24px; right: 24px; bottom: 18px; border-top: 1px solid #d1d5db; padding-top: 8px; color: #6b7280; font-size: 11px; background: #FFFFFF; display:flex; justify-content:space-between; }
  .print-footer .page::after { content: "Página " counter(page); }
  h1 { font-size: 22px; color: #111827; border-bottom: 2px solid #1E6FDB; padding-bottom: 8px; }
  h2 { font-size: 16px; color: #111827; margin-top: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
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
  .page-number:after { content: counter(page); }
  .page-total:after { content: counter(pages); }
  @media print { body { padding: 0 0 72px; } .print-footer { bottom: 0; } }
</style>
</head>
<body>
  <header class="pdf-header">
    <img src="${embeddedLogoDataUri}" alt="NODERE">
    <div class="pdf-header-title">Relatório Comercial NODERE</div>
    <div class="pdf-header-date">${formatPtBrDate(new Date().toISOString())}</div>
  </header>
  <div class="brand">
    <img src="${embeddedLogoDataUri}" alt="NODERE">
    <div>
      <div class="brand-title">NODERE</div>
      <div class="brand-sub">Plataforma comercial</div>
    </div>
  </div>
  <h1>Relatório Comercial — ${escapeHtml(company.name)}</h1>
  <p class="meta">${escapeHtml(company.category || "Sem segmento")} · ${escapeHtml(company.address || `${company.city || ""} ${company.state || ""}`.trim())} · Gerado em ${formatPtBrDate(new Date().toISOString())}</p>

  <section>
    <h2>Dados da empresa</h2>
    <ul>
      <li><strong>CNPJ:</strong> ${escapeHtml(company.cnpj || "Não informado")}</li>
      <li><strong>Telefone:</strong> ${escapeHtml(company.phone || (company as any).telefonePrincipal || (company as any).telefone_principal || "Não informado")}</li>
      <li><strong>WhatsApp:</strong> ${escapeHtml(company.whatsapp || "Não informado")}</li>
      <li><strong>E-mail:</strong> ${escapeHtml((company as any).emailPrincipal || (company as any).email_principal || (company as any).email || "Não informado")}</li>
      <li><strong>Site:</strong> ${escapeHtml(company.website || "Não informado")}</li>
      <li><strong>Redes:</strong> ${escapeHtml([company.instagram, company.facebook, company.linkedin, company.youtube].filter(Boolean).join(" · ") || "Não informado")}</li>
    </ul>
  </section>

  <section>
    <h2>Score de Oportunidade</h2>
    <p class="score">${company.score}<span style="font-size:18px;color:#94a3b8">/100</span></p>
    <p>Nível: <strong>${company.opportunityLevel}</strong> · Rating Google: ${company.rating ?? "—"} (${company.reviewCount ?? 0} avaliações)</p>
  </section>

  <section>
    <h2>Histórico e observações</h2>
    <ul>${notesHtml}</ul>
  </section>

  <section>
    <h2>Follow-ups e agenda</h2>
    <ul>${tasksHtml}</ul>
  </section>

  <section>
    <h2>Documentos anexados</h2>
    <ul>${documentsHtml}</ul>
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

  <footer class="print-footer">
    <span>Gerado pelo NODERE · nodere.com.br</span>
    <span>Página <span class="page-number"></span> de <span class="page-total"></span></span>
  </footer>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.send(html);
  } catch (error) {
    return next(error);
  }
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
  const email = (company as any).emailPrincipal || (company as any).email || "";
  const instance = activateSequence(company.id, company.name, body.templateId, email);
  return res.status(201).json(instance);
});

export default router;

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function loadNodereLogoDataUri() {
  const candidates = [
    path.join(process.cwd(), "public", "android-chrome-192x192.png"),
    path.join(process.cwd(), "..", "web", "public", "android-chrome-192x192.png"),
    path.join(process.cwd(), "..", "..", "apps", "web", "public", "android-chrome-192x192.png")
  ];
  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) {
    console.warn("NODERE PDF logo not found locally; using inline SVG fallback", { candidates });
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="96" fill="#1E6FDB"/><text x="256" y="318" text-anchor="middle" font-family="Arial, sans-serif" font-size="230" font-weight="800" fill="#FFFFFF">N</text></svg>`;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  }
  return `data:image/png;base64,${readFileSync(found).toString("base64")}`;
}

function formatPtBrDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

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

function normalizeCompanyPatch(input: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key, value === null ? undefined : value])
  );
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

function normalizeSearchText(value: string) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
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


function safeStorageFileName(value: string) {
  const cleaned = String(value || "arquivo")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  return cleaned || "arquivo";
}


async function ensureStorageBucket(bucket: string) {
  const sb = requireSupabase();
  const { data } = await sb.storage.getBucket(bucket);
  if (data) return;
  await sb.storage.createBucket(bucket, { public: true }).catch(() => undefined);
}
function getPublicStorageUrl(bucket: string, storagePath: string) {
  const { data } = requireSupabase().storage.from(bucket).getPublicUrl(storagePath);
  return data.publicUrl;
}

function mapCompanyFileRow(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    companyId: row.company_id as string,
    filename: row.filename as string,
    storagePath: row.storage_path as string,
    fileUrl: row.file_url as string,
    fileType: row.file_type as string | undefined,
    fileSize: row.file_size as number | undefined,
    uploadedBy: row.uploaded_by as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string | undefined
  };
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






