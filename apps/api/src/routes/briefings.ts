import { createHash, randomUUID } from "node:crypto";
import { Router } from "express";
import ExcelJS from "exceljs";
import multer from "multer";
import { z } from "zod";
import { getSupabase } from "../db/supabase.js";
import { getRequestWorkspaceId, requireWorkspaceRole } from "../middleware/session.js";
import {
  BRIEFING_FIELDS,
  calculateBriefingCompletion,
  isAnswered,
  missingRequiredBriefingFields,
  normalizeBriefingAnswers
} from "../services/briefingFields.js";
import { renderCommercialBriefingPdf } from "../services/briefingPdf.js";
import { generateMeteredAiText } from "../services/aiGateway.js";

const router = Router();
const canEdit = requireWorkspaceRole("owner", "admin", "operator");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }
});

const answerSchema = z.record(z.string(), z.unknown());
const createSchema = z.object({
  companyId: z.string().min(1),
  primaryContactId: z.string().optional().nullable(),
  title: z.string().min(2).max(180).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  answers: answerSchema.optional(),
  legacySource: z.string().max(80).optional(),
  legacyId: z.string().max(180).optional(),
  legacyCode: z.string().max(180).optional(),
  legacySnapshot: z.record(z.string(), z.unknown()).optional(),
  importBatch: z.string().max(180).optional(),
  sourceUpdatedAt: z.string().datetime().optional()
});

const updateSchema = z.object({
  title: z.string().min(2).max(180).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  primaryContactId: z.string().optional().nullable(),
  answers: answerSchema.optional(),
  expectedUpdatedAt: z.string().datetime().optional(),
  changeReason: z.string().max(500).optional()
});

const importSchema = z.object({
  importBatch: z.string().min(1).max(180).optional(),
  records: z.array(createSchema).min(1).max(2_000)
});

router.get("/fields", (_req, res) => {
  res.json({ count: BRIEFING_FIELDS.length, fields: BRIEFING_FIELDS });
});

router.get("/export.csv", async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const { data, error } = await requireSupabase()
      .from("commercial_briefings")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    const headers = ["code", "company_id", "status", "priority", ...BRIEFING_FIELDS.map((field) => field.key), "created_at", "updated_at"];
    const rows = (data ?? []).map((briefing) => {
      const answers = asRecord(briefing.answers);
      return [briefing.code, briefing.company_id, briefing.status, briefing.priority, ...BRIEFING_FIELDS.map((field) => answers[field.key]), briefing.created_at, briefing.updated_at];
    });
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="briefings-comerciais-nodere.csv"');
    res.send(`\uFEFF${[headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")}`);
  } catch (error) {
    next(error);
  }
});

router.post("/import", canEdit, async (req, res, next) => {
  try {
    const input = importSchema.parse(req.body ?? {});
    const workspaceId = getRequestWorkspaceId(req);
    const actor = sessionActor(req);
    const importBatch = input.importBatch || `briefing-import-${new Date().toISOString()}`;
    const results = await processBriefingImport(workspaceId, actor.id, input.records, importBatch);
    await audit(req, "briefing.import", "briefing_import", importBatch, null, { total: results.length, results });
    res.status(207).json({ importBatch, results });
  } catch (error) {
    next(error);
  }
});

router.get("/export.xlsx", async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const { data, error } = await requireSupabase().from("commercial_briefings").select("*").eq("workspace_id", workspaceId).order("updated_at", { ascending: false }).limit(10_000);
    if (error) throw error;
    const workbook = createBriefingWorkbook("Briefings Comerciais");
    const worksheet = workbook.getWorksheet(1)!;
    for (const briefing of data ?? []) {
      const answers = asRecord(briefing.answers);
      worksheet.addRow({
        code: briefing.code, company_id: briefing.company_id, status: briefing.status, priority: briefing.priority,
        legacy_source: briefing.legacy_source || "", legacy_id: briefing.legacy_id || "",
        ...Object.fromEntries(BRIEFING_FIELDS.map((field) => [field.key, Array.isArray(answers[field.key]) ? answers[field.key].join(" | ") : answers[field.key] ?? ""]))
      });
    }
    const output = await workbook.xlsx.writeBuffer();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="briefings-comerciais-nodere.xlsx"');
    return res.send(Buffer.from(output));
  } catch (error) {
    return next(error);
  }
});

router.get("/import-template.xlsx", async (_req, res, next) => {
  try {
    const workbook = createBriefingWorkbook("Modelo de Importação");
    const worksheet = workbook.getWorksheet(1)!;
    worksheet.addRow({ company_id: "ID obrigatório da empresa na NODERE", priority: "normal", company_name: "Empresa Exemplo", segment: "Segmento", decision_maker_name: "Nome do decisor", next_action: "Próxima ação" });
    const output = await workbook.xlsx.writeBuffer();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="modelo-importacao-briefing-v1.xlsx"');
    return res.send(Buffer.from(output));
  } catch (error) {
    return next(error);
  }
});

router.post("/import.xlsx", canEdit, upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Envie um arquivo XLSX no campo file." });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer as unknown as ExcelJS.Buffer);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) return res.status(422).json({ message: "A planilha não possui uma aba legível." });
    if (worksheet.rowCount - 1 > 2_000) return res.status(413).json({ code: "BRIEFING_IMPORT_LIMIT", message: "O limite por lote é de 2.000 linhas." });
    const headers = (worksheet.getRow(1).values as unknown[]).slice(1).map((value) => String(value || "").trim());
    const records: Array<z.infer<typeof createSchema>> = [];
    const invalid: Array<{ row: number; errors: string[] }> = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const values = (row.values as unknown[]).slice(1);
      const source = Object.fromEntries(headers.map((header, index) => [header, excelCellValue(values[index])]));
      if (!Object.values(source).some((value) => String(value || "").trim())) return;
      const answers = Object.fromEntries(BRIEFING_FIELDS.map((field) => [field.key, source[field.key]]).filter(([, value]) => String(value || "").trim()));
      const candidate = {
        companyId: String(source.company_id || source.companyId || "").trim(),
        priority: String(source.priority || "normal").trim().toLowerCase(),
        answers,
        legacySource: String(source.legacy_source || "xlsx").trim(),
        legacyId: String(source.legacy_id || source.code || `row-${rowNumber}`).trim()
      };
      const parsed = createSchema.safeParse(candidate);
      if (parsed.success) records.push(parsed.data);
      else invalid.push({ row: rowNumber, errors: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`) });
    });
    if (String(req.query.preview || "").toLowerCase() === "true") return res.json({ preview: true, total: records.length + invalid.length, valid: records.length, invalid, records: records.slice(0, 100) });
    if (invalid.length) return res.status(422).json({ code: "BRIEFING_IMPORT_VALIDATION", message: "Corrija as linhas inválidas antes de importar. Nenhum registro foi alterado.", invalid });
    if (!records.length) return res.status(422).json({ message: "Nenhuma linha válida foi encontrada." });
    const workspaceId = getRequestWorkspaceId(req);
    const actor = sessionActor(req);
    const importBatch = String(req.body?.importBatch || req.headers["x-import-batch"] || `briefing-xlsx-${new Date().toISOString()}`).slice(0, 180);
    const results = await processBriefingImport(workspaceId, actor.id, records, importBatch);
    await audit(req, "briefing.import.xlsx", "briefing_import", importBatch, null, { total: results.length, results });
    return res.status(results.some((item) => item.status === "failed") ? 207 : 201).json({ importBatch, results });
  } catch (error) {
    return next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const status = String(req.query.status || "").trim();
    const companyId = String(req.query.companyId || "").trim();
    const search = String(req.query.search || req.query.q || "").trim();
    let query = requireSupabase()
      .from("commercial_briefings")
      .select("*, nodere_companies!commercial_briefings_company_id_fkey(id, name, category, city, state)")
      .eq("workspace_id", workspaceId)
      .order("updated_at", { ascending: false })
      .limit(500);
    if (status) query = query.eq("status", status);
    if (companyId) query = query.eq("company_id", companyId);
    if (search) query = query.or(`code.ilike.%${escapePostgrest(search)}%,title.ilike.%${escapePostgrest(search)}%`);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data ?? []);
  } catch (error) {
    next(error);
  }
});

router.post("/", canEdit, async (req, res, next) => {
  try {
    const input = createSchema.parse(req.body ?? {});
    const workspaceId = getRequestWorkspaceId(req);
    const actor = sessionActor(req);
    const created = await createBriefing(workspaceId, actor.id, input);
    await audit(req, "briefing.create", "commercial_briefing", created.id, null, created);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const [briefingResult, versionsResult, attachmentsResult] = await Promise.all([
      requireSupabase().from("commercial_briefings").select("*, nodere_companies!commercial_briefings_company_id_fkey(*), company_contacts(*)").eq("workspace_id", workspaceId).eq("id", req.params.id).maybeSingle(),
      requireSupabase().from("briefing_versions").select("*").eq("workspace_id", workspaceId).eq("briefing_id", req.params.id).order("version", { ascending: false }),
      requireSupabase().from("commercial_briefing_attachments").select("*").eq("workspace_id", workspaceId).eq("briefing_id", req.params.id).is("deleted_at", null).order("created_at", { ascending: false })
    ]);
    if (briefingResult.error) throw briefingResult.error;
    if (!briefingResult.data) return res.status(404).json({ message: "Briefing não encontrado." });
    if (versionsResult.error) throw versionsResult.error;
    if (attachmentsResult.error) throw attachmentsResult.error;
    res.json({ ...briefingResult.data, versions: versionsResult.data ?? [], attachments: attachmentsResult.data ?? [], fields: BRIEFING_FIELDS });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", canEdit, async (req, res, next) => {
  try {
    const input = updateSchema.parse(req.body ?? {});
    const workspaceId = getRequestWorkspaceId(req);
    const actor = sessionActor(req);
    const briefingId = String(req.params.id);
    const current = await getBriefing(workspaceId, briefingId);
    if (!current) return res.status(404).json({ message: "Briefing não encontrado." });
    if (input.expectedUpdatedAt && current.updated_at !== input.expectedUpdatedAt) {
      return res.status(409).json({ code: "BRIEFING_VERSION_CONFLICT", message: "O briefing foi atualizado em outra sessão.", current });
    }
    const changedAnswers = normalizeBriefingAnswers(input.answers ?? {});
    const answers = { ...asRecord(current.answers), ...changedAnswers };
    const update = {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.primaryContactId !== undefined ? { primary_contact_id: input.primaryContactId || null } : {}),
      answers,
      completion_percent: calculateBriefingCompletion(answers),
      next_action: stringOrNull(answers.next_action),
      next_action_at: nextActionDate(answers),
      updated_by: actor.id,
      updated_at: new Date().toISOString()
    };
    const { data, error } = await requireSupabase().from("commercial_briefings").update(update).eq("workspace_id", workspaceId).eq("id", req.params.id).select("*").single();
    if (error) throw error;
    await upsertAnswers(workspaceId, briefingId, actor.id, changedAnswers);
    await audit(req, "briefing.update", "commercial_briefing", briefingId, current, data, input.changeReason);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/complete", canEdit, async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const actor = sessionActor(req);
    const briefingId = String(req.params.id);
    const current = await getBriefing(workspaceId, briefingId);
    if (!current) return res.status(404).json({ message: "Briefing não encontrado." });
    if (current.status === "completed") return res.json({ ...current, replayed: true });
    const answers = asRecord(current.answers);
    const missing = missingRequiredBriefingFields(answers);
    if (missing.length) return res.status(422).json({ code: "BRIEFING_REQUIRED_FIELDS", message: "Preencha os campos obrigatórios antes de concluir.", fields: missing });
    const mapping = await applyCanonicalMappings(workspaceId, current, actor.id, []);
    if (mapping.conflicts.length) return res.status(409).json({ code: "BRIEFING_CONFLICTS_PENDING", message: "Resolva os conflitos com a ficha do cliente antes de concluir.", conflicts: mapping.conflicts });
    const completedAt = new Date().toISOString();
    const snapshot = { ...current, status: "completed", completion_percent: calculateBriefingCompletion(answers), completed_at: completedAt };
    const { data, error } = await requireSupabase().from("commercial_briefings").update({
      status: "completed",
      completion_percent: snapshot.completion_percent,
      completed_at: completedAt,
      updated_by: actor.id
    }).eq("workspace_id", workspaceId).eq("id", req.params.id).select("*").single();
    if (error) throw error;
    await ensureBriefingNextAction(workspaceId, data, actor.id);
    await saveVersion(workspaceId, briefingId, Number(current.current_version || 1), snapshot, actor.id, "complete", String(req.body?.reason || "Conclusão do briefing"));
    await audit(req, "briefing.complete", "commercial_briefing", briefingId, current, { briefing: data, mapping }, String(req.body?.reason || ""));
    res.json({ ...data, mapping, nextActionSynchronized: Boolean(data.next_action_at) });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/version", canEdit, async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const actor = sessionActor(req);
    const briefingId = String(req.params.id);
    const current = await getBriefing(workspaceId, briefingId);
    if (!current) return res.status(404).json({ message: "Briefing não encontrado." });
    const version = Number(current.current_version || 1) + 1;
    const { data, error } = await requireSupabase().from("commercial_briefings").update({ current_version: version, status: "draft", completed_at: null, updated_by: actor.id }).eq("workspace_id", workspaceId).eq("id", req.params.id).select("*").single();
    if (error) throw error;
    await saveVersion(workspaceId, briefingId, version, data, actor.id, "new_version", String(req.body?.reason || "Nova versão"));
    await audit(req, "briefing.createVersion", "commercial_briefing", briefingId, current, data, String(req.body?.reason || ""));
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/duplicate", canEdit, async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const actor = sessionActor(req);
    const current = await getBriefing(workspaceId, String(req.params.id));
    if (!current) return res.status(404).json({ message: "Briefing não encontrado." });
    const created = await createBriefing(workspaceId, actor.id, {
      companyId: current.company_id,
      primaryContactId: current.primary_contact_id,
      title: `${current.title} — cópia`,
      priority: current.priority,
      answers: asRecord(current.answers),
      legacySnapshot: { duplicatedFrom: current.id }
    });
    await audit(req, "briefing.duplicate", "commercial_briefing", created.id, current, created);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/archive", canEdit, async (req, res, next) => setArchiveState(req, res, next, true));
router.post("/:id/restore", canEdit, async (req, res, next) => setArchiveState(req, res, next, false));

router.get("/:id/compare", async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const current = await getBriefing(workspaceId, String(req.params.id));
    if (!current) return res.status(404).json({ message: "Briefing não encontrado." });
    const [companyResult, contactResult, resolutionResult] = await Promise.all([
      requireSupabase().from("nodere_companies").select("*").eq("workspace_id", workspaceId).eq("id", current.company_id).maybeSingle(),
      current.primary_contact_id
        ? requireSupabase().from("company_contacts").select("*").eq("workspace_id", workspaceId).eq("id", current.primary_contact_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      requireSupabase().from("briefing_answers").select("field_key,value,original_value,conflict_resolution").eq("workspace_id", workspaceId).eq("briefing_id", current.id)
    ]);
    if (companyResult.error) throw companyResult.error;
    if (contactResult.error) throw contactResult.error;
    if (resolutionResult.error) throw resolutionResult.error;
    const answers = asRecord(current.answers);
    const resolutions = new Map((resolutionResult.data ?? []).map((item) => [item.field_key, item]));
    const conflicts = BRIEFING_FIELDS.flatMap((field) => {
      const currentValue = field.companyColumn ? companyResult.data?.[field.companyColumn] : field.contactColumn ? contactResult.data?.[field.contactColumn] : undefined;
      const collectedValue = answers[field.key];
      if (!isAnswered(currentValue) || !isAnswered(collectedValue) || comparable(currentValue) === comparable(collectedValue)) return [];
      const resolution = resolutions.get(field.key);
      if (resolution?.conflict_resolution === "keep" && comparable(resolution.original_value) === comparable(currentValue) && comparable(resolution.value) === comparable(collectedValue)) return [];
      return [{ fieldKey: field.key, label: field.label, target: field.companyColumn ? "company" : "contact", currentValue, collectedValue, decisions: ["keep", "replace", "append"] }];
    });
    res.json({ conflicts });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/apply-mappings", canEdit, async (req, res, next) => {
  try {
    const input = z.object({ decisions: z.array(z.object({ fieldKey: z.string(), decision: z.enum(["keep", "replace", "append"]) })).max(47) }).parse(req.body ?? {});
    const workspaceId = getRequestWorkspaceId(req);
    const actor = sessionActor(req);
    const current = await getBriefing(workspaceId, String(req.params.id));
    if (!current) return res.status(404).json({ message: "Briefing não encontrado." });
    const mapping = await applyCanonicalMappings(workspaceId, current, actor.id, input.decisions);
    if (mapping.conflicts.length) return res.status(409).json({ code: "BRIEFING_CONFLICTS_PENDING", message: "Há conflitos sem decisão.", conflicts: mapping.conflicts });
    await recordMappingDecisions(workspaceId, current.id, input.decisions, mapping.resolutions);
    await audit(req, "briefing.applyFieldMappings", "commercial_briefing", String(req.params.id), null, { ...mapping, decisions: input.decisions });
    res.json({ ok: true, ...mapping });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/assist", canEdit, async (req, res, next) => {
  try {
    const input = z.object({ transcript: z.string().min(20).max(30_000), confirmed: z.literal(true) }).parse(req.body ?? {});
    const workspaceId = getRequestWorkspaceId(req);
    const current = await getBriefing(workspaceId, String(req.params.id));
    if (!current) return res.status(404).json({ message: "Briefing não encontrado." });
    const fieldContract = BRIEFING_FIELDS.map((field) => ({ key: field.key, label: field.label, type: field.type, options: field.options ?? [] }));
    const result = await generateMeteredAiText({
      workspaceId,
      session: (req as any).session ?? {},
      agentId: "commercial-copilot",
      systemPrompt: "Extraia somente fatos explícitos do relato comercial. Não invente valores, não execute ações e não altere o banco. Retorne JSON válido com a chave answers, usando exclusivamente as chaves permitidas.",
      userPrompt: JSON.stringify({ allowedFields: fieldContract, existingAnswers: current.answers, transcript: input.transcript }),
      action: "briefing_assisted_extraction"
    });
    let parsed: Record<string, unknown> = {};
    try {
      const payload = JSON.parse(result.content) as { answers?: Record<string, unknown> };
      parsed = normalizeBriefingAnswers(payload.answers ?? payload as Record<string, unknown>);
    } catch {
      throw httpError(502, "A IA não retornou uma sugestão estruturada válida. Nenhum campo foi alterado.");
    }
    res.json({ suggestions: parsed, model: result.model, executionId: result.executionId, chargedCredit: result.chargedCredit, persisted: false });
  } catch (error) {
    next(error);
  }
});

router.get("/:id/pdf", async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const current = await getBriefing(workspaceId, String(req.params.id));
    if (!current) return res.status(404).json({ message: "Briefing não encontrado." });
    const [companyResult, attachmentsResult] = await Promise.all([
      requireSupabase().from("nodere_companies").select("name").eq("workspace_id", workspaceId).eq("id", current.company_id).maybeSingle(),
      requireSupabase().from("commercial_briefing_attachments").select("original_name,mime_type,size_bytes,sha256").eq("workspace_id", workspaceId).eq("briefing_id", current.id).is("deleted_at", null).order("created_at", { ascending: true })
    ]);
    if (companyResult.error) throw companyResult.error;
    if (attachmentsResult.error) throw attachmentsResult.error;
    const company = companyResult.data;
    const pdf = await renderCommercialBriefingPdf({
      code: current.code,
      title: current.title,
      status: current.status,
      priority: current.priority,
      version: Number(current.current_version || 1),
      companyName: company?.name || String(asRecord(current.answers).company_name || current.title),
      answers: asRecord(current.answers),
      author: current.updated_by || current.created_by,
      attachments: attachmentsResult.data ?? []
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", String(pdf.length));
    res.setHeader("Content-Disposition", `attachment; filename="${safeFileName(current.code)}-${safeFileName(company?.name || "briefing")}.pdf"`);
    res.send(pdf);
  } catch (error) {
    next(error);
  }
});

router.get("/:id/attachments", async (req, res, next) => {
  try {
    const { data, error } = await requireSupabase().from("commercial_briefing_attachments").select("*").eq("workspace_id", getRequestWorkspaceId(req)).eq("briefing_id", req.params.id).is("deleted_at", null).order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data ?? []);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/attachments", canEdit, upload.single("file"), async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: "Envie um arquivo no campo file." });
    if (!allowedAttachmentTypes.has(file.mimetype)) return res.status(415).json({ message: "Tipo de arquivo não permitido." });
    const workspaceId = getRequestWorkspaceId(req);
    const actor = sessionActor(req);
    const current = await getBriefing(workspaceId, String(req.params.id));
    if (!current) return res.status(404).json({ message: "Briefing não encontrado." });
    const id = randomUUID();
    const path = `${workspaceId}/${current.id}/${id}-${safeFileName(file.originalname)}`;
    const { error: uploadError } = await requireSupabase().storage.from("briefing-attachments").upload(path, file.buffer, { contentType: file.mimetype, upsert: false });
    if (uploadError) throw uploadError;
    const row = {
      id,
      workspace_id: workspaceId,
      briefing_id: current.id,
      storage_bucket: "briefing-attachments",
      storage_path: path,
      original_name: file.originalname,
      mime_type: file.mimetype,
      size_bytes: file.size,
      sha256: createHash("sha256").update(file.buffer).digest("hex"),
      source: String(req.body?.source || "manual"),
      created_by: actor.id
    };
    const { data, error } = await requireSupabase().from("commercial_briefing_attachments").insert(row).select("*").single();
    if (error) {
      await requireSupabase().storage.from("briefing-attachments").remove([path]).catch(() => undefined);
      throw error;
    }
    await audit(req, "briefing.attachFile", "briefing_attachment", id, null, { ...row, sha256: row.sha256 });
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

router.get("/:id/attachments/:attachmentId/download", async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const { data: attachment, error } = await requireSupabase()
      .from("commercial_briefing_attachments")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("briefing_id", req.params.id)
      .eq("id", req.params.attachmentId)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) throw error;
    if (!attachment) return res.status(404).json({ message: "Anexo não encontrado." });
    const { data: file, error: downloadError } = await requireSupabase().storage.from(attachment.storage_bucket).download(attachment.storage_path);
    if (downloadError) throw downloadError;
    const buffer = Buffer.from(await file.arrayBuffer());
    if (attachment.sha256 && createHash("sha256").update(buffer).digest("hex") !== attachment.sha256) throw httpError(409, "O checksum do anexo não confere. Download bloqueado.");
    res.setHeader("Content-Type", attachment.mime_type || "application/octet-stream");
    res.setHeader("Content-Length", String(buffer.length));
    res.setHeader("Content-Disposition", `attachment; filename="${safeFileName(attachment.original_name)}"`);
    return res.send(buffer);
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id/attachments/:attachmentId", canEdit, async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const actor = sessionActor(req);
    const { data: current, error } = await requireSupabase().from("commercial_briefing_attachments").select("*").eq("workspace_id", workspaceId).eq("briefing_id", req.params.id).eq("id", req.params.attachmentId).is("deleted_at", null).maybeSingle();
    if (error) throw error;
    if (!current) return res.status(404).json({ message: "Anexo não encontrado." });
    const deletedAt = new Date().toISOString();
    const { data, error: updateError } = await requireSupabase().from("commercial_briefing_attachments").update({ deleted_at: deletedAt }).eq("workspace_id", workspaceId).eq("id", current.id).select("*").single();
    if (updateError) throw updateError;
    await audit(req, "briefing.archiveAttachment", "briefing_attachment", current.id, current, data, String(req.body?.reason || "Arquivamento manual"));
    return res.json({ ...data, recoverable: true, storagePreserved: true, actorId: actor.id });
  } catch (error) {
    return next(error);
  }
});

async function createBriefing(workspaceId: string, actorId: string, input: z.infer<typeof createSchema>) {
  const { data: company, error: companyError } = await requireSupabase().from("nodere_companies").select("*").eq("workspace_id", workspaceId).eq("id", input.companyId).maybeSingle();
  if (companyError) throw companyError;
  if (!company) throw httpError(404, "Empresa não encontrada.");
  if (company.record_state === "trash") throw httpError(409, "Restaure a empresa antes de criar um briefing.");
  const answers = normalizeBriefingAnswers({
    company_name: company.name,
    segment: company.category,
    cnpj: company.cnpj,
    city: company.city,
    state: company.state,
    full_address: company.address,
    website: company.website,
    whatsapp: company.whatsapp,
    phone: company.phone,
    ...(input.answers ?? {})
  });
  const row = {
    id: randomUUID(),
    workspace_id: workspaceId,
    company_id: input.companyId,
    primary_contact_id: input.primaryContactId || null,
    code: buildBriefingCode(),
    title: input.title || `Briefing comercial — ${company.name}`,
    priority: input.priority || "normal",
    answers,
    source_snapshot: { company },
    completion_percent: calculateBriefingCompletion(answers),
    next_action: stringOrNull(answers.next_action),
    next_action_at: nextActionDate(answers),
    legacy_source: input.legacySource || null,
    legacy_id: input.legacyId || null,
    legacy_code: input.legacyCode || null,
    legacy_snapshot: input.legacySnapshot || null,
    import_batch: input.importBatch || null,
    source_updated_at: input.sourceUpdatedAt || null,
    created_by: actorId,
    updated_by: actorId
  };
  const { data, error } = await requireSupabase().from("commercial_briefings").insert(row).select("*").single();
  if (error) throw error;
  await upsertAnswers(workspaceId, row.id, actorId, answers);
  await saveVersion(workspaceId, row.id, 1, data, actorId, "create", "Criação do briefing");
  return data;
}

async function processBriefingImport(
  workspaceId: string,
  actorId: string,
  records: Array<z.infer<typeof createSchema>>,
  importBatch: string
) {
  const results: Array<{ index: number; id?: string; code?: string; status: "created" | "updated" | "failed"; message?: string }> = [];
  for (const [index, record] of records.entries()) {
    try {
      const effective = { ...record, importBatch: record.importBatch || importBatch };
      const existing = effective.legacySource && effective.legacyId
        ? await requireSupabase().from("commercial_briefings").select("*").eq("workspace_id", workspaceId).eq("legacy_source", effective.legacySource).eq("legacy_id", effective.legacyId).maybeSingle()
        : { data: null, error: null };
      if (existing.error) throw existing.error;
      if (existing.data) {
        const mergedAnswers = { ...asRecord(existing.data.answers), ...normalizeBriefingAnswers(effective.answers ?? {}) };
        const { data, error } = await requireSupabase().from("commercial_briefings").update({
          answers: mergedAnswers,
          completion_percent: calculateBriefingCompletion(mergedAnswers),
          source_snapshot: effective.legacySnapshot ?? existing.data.source_snapshot,
          legacy_snapshot: effective.legacySnapshot ?? existing.data.legacy_snapshot,
          source_updated_at: effective.sourceUpdatedAt ?? existing.data.source_updated_at,
          import_batch: effective.importBatch,
          updated_by: actorId
        }).eq("workspace_id", workspaceId).eq("id", existing.data.id).select("id, code").single();
        if (error) throw error;
        await upsertAnswers(workspaceId, existing.data.id, actorId, normalizeBriefingAnswers(effective.answers ?? {}));
        results.push({ index, id: data.id, code: data.code, status: "updated" });
      } else {
        const created = await createBriefing(workspaceId, actorId, effective);
        results.push({ index, id: created.id, code: created.code, status: "created" });
      }
    } catch (error) {
      results.push({ index, status: "failed", message: publicError(error) });
    }
  }
  return results;
}

function createBriefingWorkbook(sheetName: string) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "NODERE";
  workbook.created = new Date();
  const worksheet = workbook.addWorksheet(sheetName, { views: [{ state: "frozen", ySplit: 1 }] });
  worksheet.columns = [
    { header: "code", key: "code", width: 20 },
    { header: "company_id", key: "company_id", width: 38 },
    { header: "status", key: "status", width: 16 },
    { header: "priority", key: "priority", width: 14 },
    { header: "legacy_source", key: "legacy_source", width: 18 },
    { header: "legacy_id", key: "legacy_id", width: 24 },
    ...BRIEFING_FIELDS.map((field) => ({ header: field.key, key: field.key, width: field.type === "textarea" ? 44 : 24 }))
  ];
  worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  worksheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF07362B" } };
  worksheet.autoFilter = { from: "A1", to: worksheet.getRow(1).getCell(worksheet.columnCount).address };
  return workbook;
}

function excelCellValue(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value === "object") {
    const rich = value as { text?: string; result?: unknown; hyperlink?: string; richText?: Array<{ text?: string }> };
    if (rich.text !== undefined) return rich.text;
    if (rich.result !== undefined) return rich.result;
    if (rich.richText) return rich.richText.map((item) => item.text || "").join("");
  }
  return value ?? "";
}

async function getBriefing(workspaceId: string, id: string) {
  const { data, error } = await requireSupabase().from("commercial_briefings").select("*").eq("workspace_id", workspaceId).eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

async function upsertAnswers(workspaceId: string, briefingId: string, actorId: string, answers: Record<string, unknown>) {
  const rows = Object.entries(answers).map(([fieldKey, value]) => ({
    id: randomUUID(), workspace_id: workspaceId, briefing_id: briefingId, field_key: fieldKey,
    value, source: "manual", updated_by: actorId, updated_at: new Date().toISOString()
  }));
  if (!rows.length) return;
  const { error } = await requireSupabase().from("briefing_answers").upsert(rows, { onConflict: "briefing_id,field_key", ignoreDuplicates: false });
  if (error) throw error;
}

async function saveVersion(workspaceId: string, briefingId: string, version: number, snapshot: unknown, actorId: string, changeType: string, changeReason: string) {
  const { error } = await requireSupabase().from("briefing_versions").upsert({
    id: randomUUID(), workspace_id: workspaceId, briefing_id: briefingId, version,
    snapshot, change_type: changeType, change_reason: changeReason || null, created_by: actorId
  }, { onConflict: "briefing_id,version" });
  if (error) throw error;
}

async function setArchiveState(req: Parameters<typeof sessionActor>[0], res: any, next: any, archived: boolean) {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const actor = sessionActor(req);
    const current = await getBriefing(workspaceId, String(req.params.id));
    if (!current) return res.status(404).json({ message: "Briefing não encontrado." });
    const { data, error } = await requireSupabase().from("commercial_briefings").update({
      status: archived ? "archived" : "draft",
      archived_at: archived ? new Date().toISOString() : null,
      updated_by: actor.id
    }).eq("workspace_id", workspaceId).eq("id", req.params.id).select("*").single();
    if (error) throw error;
    await audit(req, archived ? "briefing.archive" : "briefing.restore", "commercial_briefing", String(req.params.id), current, data, String(req.body?.reason || ""));
    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function audit(req: any, action: string, entityType: string, entityId: string, beforeState: unknown, afterState: unknown, reason?: string) {
  const actor = sessionActor(req);
  const { error } = await requireSupabase().from("nodere_audit_events").insert({
    id: randomUUID(), workspace_id: getRequestWorkspaceId(req), actor_id: actor.id,
    actor_role: actor.role, action, entity_type: entityType, entity_id: entityId,
    reason: reason || null, before_state: beforeState, after_state: afterState,
    metadata: { source: "nodere-api" }
  });
  if (error) throw error;
}

function requireSupabase() {
  const client = getSupabase();
  if (!client) throw httpError(503, "Supabase não configurado para briefings comerciais.");
  return client;
}

function sessionActor(req: any) {
  const session = req.session || {};
  return { id: String(session.userId || session.email || "unknown"), role: String(session.role || "viewer") };
}

function asRecord(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, any> : {};
}

function buildBriefingCode() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `BRF-${date}-${randomUUID().slice(0, 6).toUpperCase()}`;
}

function nextActionDate(answers: Record<string, unknown>) {
  const date = String(answers.next_action_date || "").trim();
  if (!date) return null;
  const time = String(answers.next_action_time || "09:00").trim() || "09:00";
  const parsed = new Date(`${date}T${time}:00-03:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function stringOrNull(value: unknown) {
  const text = String(value || "").trim();
  return text || null;
}

function comparable(value: unknown) {
  return String(Array.isArray(value) ? value.join(",") : value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

async function applyCanonicalMappings(
  workspaceId: string,
  briefing: Record<string, any>,
  actorId: string,
  decisions: Array<{ fieldKey: string; decision: "keep" | "replace" | "append" }>
) {
  const sb = requireSupabase();
  const [companyResult, contactResult, resolutionResult] = await Promise.all([
    sb.from("nodere_companies").select("*").eq("workspace_id", workspaceId).eq("id", briefing.company_id).maybeSingle(),
    briefing.primary_contact_id
      ? sb.from("company_contacts").select("*").eq("workspace_id", workspaceId).eq("id", briefing.primary_contact_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    sb.from("briefing_answers").select("field_key,value,original_value,conflict_resolution").eq("workspace_id", workspaceId).eq("briefing_id", briefing.id)
  ]);
  if (companyResult.error) throw companyResult.error;
  if (contactResult.error) throw contactResult.error;
  if (resolutionResult.error) throw resolutionResult.error;
  if (!companyResult.data) throw httpError(404, "Empresa vinculada ao briefing não encontrada.");
  const company = asRecord(companyResult.data);
  const contact = asRecord(contactResult.data);
  const answers = asRecord(briefing.answers);
  const decisionMap = new Map(decisions.map((item) => [item.fieldKey, item.decision]));
  const storedResolutions = new Map((resolutionResult.data ?? []).map((item) => [item.field_key, item]));
  const companyUpdate: Record<string, unknown> = {};
  const contactUpdate: Record<string, unknown> = {};
  const conflicts: Array<{ fieldKey: string; label: string; currentValue: unknown; collectedValue: unknown; decisions: string[] }> = [];
  const resolutions: Array<{ fieldKey: string; decision: "keep" | "replace" | "append"; currentValue: unknown; collectedValue: unknown }> = [];
  for (const field of BRIEFING_FIELDS) {
    const column = field.companyColumn || field.contactColumn;
    const incoming = answers[field.key];
    if (!column || !isAnswered(incoming)) continue;
    const target = field.companyColumn ? companyUpdate : contactUpdate;
    const currentValue = field.companyColumn ? company[column] : contact[column];
    if (!isAnswered(currentValue)) {
      target[column] = incoming;
      continue;
    }
    if (comparable(currentValue) === comparable(incoming)) continue;
    const stored = storedResolutions.get(field.key);
    const storedDecision = stored?.conflict_resolution && comparable(stored.original_value) === comparable(currentValue) && comparable(stored.value) === comparable(incoming)
      ? stored.conflict_resolution as "keep" | "replace" | "append"
      : undefined;
    const decision = decisionMap.get(field.key) || storedDecision;
    if (!decision) {
      conflicts.push({ fieldKey: field.key, label: field.label, currentValue, collectedValue: incoming, decisions: ["keep", "replace", "append"] });
      continue;
    }
    resolutions.push({ fieldKey: field.key, decision, currentValue, collectedValue: incoming });
    if (decision === "replace") target[column] = incoming;
    if (decision === "append") target[column] = [currentValue, incoming].filter(isAnswered).map(String).join("\n");
  }
  if (conflicts.length) return { companyUpdate: {}, contactUpdate: {}, contactId: briefing.primary_contact_id || null, conflicts, resolutions };
  if (Object.keys(companyUpdate).length) {
    const { error } = await sb.from("nodere_companies").update({ ...companyUpdate, updated_at: new Date().toISOString() }).eq("workspace_id", workspaceId).eq("id", briefing.company_id);
    if (error) throw error;
  }
  let contactId = briefing.primary_contact_id || null;
  if (Object.keys(contactUpdate).length) {
    if (contactId) {
      const { error } = await sb.from("company_contacts").update({ ...contactUpdate, updated_at: new Date().toISOString() }).eq("workspace_id", workspaceId).eq("company_id", briefing.company_id).eq("id", contactId);
      if (error) throw error;
    } else if (isAnswered(contactUpdate.name)) {
      contactId = randomUUID();
      const { error } = await sb.from("company_contacts").insert({ id: contactId, workspace_id: workspaceId, company_id: briefing.company_id, ...contactUpdate });
      if (error) throw error;
      const { error: briefingError } = await sb.from("commercial_briefings").update({ primary_contact_id: contactId, updated_by: actorId }).eq("workspace_id", workspaceId).eq("id", briefing.id);
      if (briefingError) throw briefingError;
    }
  }
  return { companyUpdate, contactUpdate, contactId, conflicts, resolutions };
}

async function recordMappingDecisions(
  workspaceId: string,
  briefingId: string,
  decisions: Array<{ fieldKey: string; decision: "keep" | "replace" | "append" }>,
  resolutions: Array<{ fieldKey: string; decision: "keep" | "replace" | "append"; currentValue: unknown; collectedValue: unknown }>
) {
  if (!decisions.length) return;
  const byField = new Map(resolutions.map((item) => [item.fieldKey, item]));
  for (const decision of decisions) {
    const resolution = byField.get(decision.fieldKey);
    if (!resolution) continue;
    const { error } = await requireSupabase().from("briefing_answers").update({
      original_value: resolution.currentValue,
      conflict_resolution: decision.decision,
      updated_at: new Date().toISOString()
    }).eq("workspace_id", workspaceId).eq("briefing_id", briefingId).eq("field_key", decision.fieldKey);
    if (error) throw error;
  }
}

async function ensureBriefingNextAction(workspaceId: string, briefing: Record<string, any>, actorId: string) {
  if (!briefing.next_action || !briefing.next_action_at) return null;
  const sb = requireSupabase();
  const metadata = { briefingId: briefing.id, source: "commercial_briefing" };
  const { data: existing, error } = await sb.from("calendar_events").select("id").eq("workspace_id", workspaceId).contains("metadata", { briefingId: briefing.id }).limit(1).maybeSingle();
  if (error) throw error;
  const startAt = new Date(briefing.next_action_at);
  const endAt = new Date(startAt.getTime() + 30 * 60 * 1000);
  const row = {
    workspace_id: workspaceId,
    company_id: briefing.company_id,
    title: String(briefing.next_action).slice(0, 240),
    type: "follow-up",
    priority: briefing.priority === "urgent" || briefing.priority === "high" ? "high" : briefing.priority === "low" ? "low" : "medium",
    start_at: startAt.toISOString(),
    end_at: endAt.toISOString(),
    notes: `Criada a partir do briefing ${briefing.code}.`,
    created_by: actorId,
    metadata
  };
  if (existing?.id) {
    const { data, error: updateError } = await sb.from("calendar_events").update(row).eq("workspace_id", workspaceId).eq("id", existing.id).select("id").single();
    if (updateError) throw updateError;
    return data;
  }
  const { data, error: insertError } = await sb.from("calendar_events").insert({ id: randomUUID(), ...row }).select("id").single();
  if (insertError) throw insertError;
  return data;
}

function escapePostgrest(value: string) {
  return value.replace(/[,%()]/g, " ").slice(0, 120);
}

function csvCell(value: unknown) {
  const text = Array.isArray(value) ? value.join(" | ") : String(value ?? "");
  const protectedText = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${protectedText.replace(/"/g, '""')}"`;
}

function safeFileName(value: string) {
  return String(value || "arquivo").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100) || "arquivo";
}

function httpError(status: number, message: string) {
  const error = new Error(message) as Error & { status?: number };
  error.status = status;
  return error;
}

function publicError(error: unknown) {
  return error instanceof Error ? error.message.slice(0, 300) : "Falha ao importar registro.";
}

const allowedAttachmentTypes = new Set([
  "image/jpeg", "image/png", "image/webp", "application/pdf", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain",
  "audio/webm", "audio/mp4", "audio/mpeg", "audio/ogg"
]);

export default router;
