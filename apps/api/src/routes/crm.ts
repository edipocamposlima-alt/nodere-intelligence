import { Router } from "express";
import { randomUUID } from "node:crypto";
import PDFDocument from "pdfkit";
import { parse as parseCsvSync } from "csv-parse/sync";
import { z } from "zod";
import { getSupabase } from "../db/supabase.js";
import { getRequestWorkspaceId } from "../middleware/session.js";
import {
  addNote,
  createTask,
  getCompanyAsync,
  listCompaniesAsync,
  listNotes,
  listTasks,
  saveCompanies,
  updateCompany,
  updateStatus
} from "../services/companyStore.js";

const router = Router();

router.get("/cards", async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 25)));
    const stage = String(req.query.stage || "");
    const ownerId = String(req.query.owner_id || "");
    const city = String(req.query.city || "").toLowerCase();
    const q = String(req.query.q || "").toLowerCase();
    const minScore = Number(req.query.min_score || 0);
    const sort = String(req.query.sort || "score");
    const order = String(req.query.order || "desc") === "asc" ? 1 : -1;
    const all = await listCompaniesAsync(getRequestWorkspaceId(req));
    const filtered = all.filter((item) =>
      (!stage || item.status === stage) &&
      (!ownerId || (item as any).ownerId === ownerId) &&
      (!city || item.city.toLowerCase().includes(city)) &&
      (!q || item.name.toLowerCase().includes(q)) &&
      item.score >= minScore
    );
    filtered.sort((a, b) => {
      const av = sort === "company_name" ? a.name : sort === "created_at" ? a.createdAt : a.score;
      const bv = sort === "company_name" ? b.name : sort === "created_at" ? b.createdAt : b.score;
      return String(av).localeCompare(String(bv), "pt-BR", { numeric: true }) * order;
    });
    const start = (page - 1) * limit;
    res.json({ data: filtered.slice(start, start + limit), page, limit, total: filtered.length });
  } catch (error) {
    next(error);
  }
});

router.patch("/cards/bulk-stage", async (req, res, next) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : [];
    const stage = String(req.body?.stage || "Novo Lead");
    const updated = [];
    for (const id of ids) {
      const item = await updateStatus(id, stage as any, getRequestWorkspaceId(req));
      if (item) updated.push(item);
    }
    res.json({ updated });
  } catch (error) {
    next(error);
  }
});

router.get("/leads", async (req, res, next) => {
  try {
    const leads = await listCompaniesAsync(getRequestWorkspaceId(req));
    res.json(leads);
  } catch (error) {
    next(error);
  }
});

router.post("/leads", async (req, res, next) => {
  try {
    const body = leadSchema.parse(req.body ?? {});
    const now = new Date().toISOString();
    const lead = {
      id: `crm-${randomUUID()}`,
      name: body.name,
      category: body.category || "Empresa",
      city: body.city || "",
      state: body.state || "",
      address: body.address || "",
      phone: body.phone || "",
      whatsapp: body.whatsapp || "",
      website: body.website || "",
      status: body.status || "Novo Lead",
      score: body.score ?? 50,
      opportunityLevel: body.opportunityLevel || "Media",
      detectedOpportunities: [],
      suggestions: [],
      notes: [],
      source: "manual",
      createdAt: now,
      updatedAt: now
    } as any;
    const [saved] = await saveCompanies([lead], getRequestWorkspaceId(req));
    res.status(201).json(saved);
  } catch (error) {
    next(error);
  }
});

router.get("/leads/export.csv", async (req, res, next) => {
  try {
    const leads = await listCompaniesAsync(getRequestWorkspaceId(req));
    const headers = ["id", "name", "category", "city", "state", "status", "score", "phone", "whatsapp", "website"];
    const csv = [
      headers.join(","),
      ...leads.map((lead) => headers.map((field) => csvCell((lead as any)[field])).join(","))
    ].join("\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=\"crm-leads-nodere.csv\"");
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

router.post("/leads/import", async (req, res, next) => {
  try {
    const csv = String(req.body?.csv || "");
    if (!csv.trim()) return res.status(400).json({ message: "Informe o campo csv." });
    const rows = parseCsvSync(csv, { columns: true, skipEmptyLines: true, trim: true }) as Array<Record<string, string>>;
    const now = new Date().toISOString();
    const leads = rows
      .filter((row) => row.name || row.nome)
      .map((row) => ({
        id: `csv-${randomUUID()}`,
        name: row.name || row.nome,
        category: row.category || row.segmento || "",
        city: row.city || row.cidade || "",
        state: row.state || row.uf || "",
        address: row.address || row.endereco || "",
        phone: row.phone || row.telefone || "",
        whatsapp: row.whatsapp || "",
        website: row.website || row.site || "",
        status: row.status || "Novo Lead",
        score: Number(row.score || 50),
        opportunityLevel: row.opportunityLevel || "Media",
        detectedOpportunities: [],
        suggestions: [],
        notes: [],
        source: "import",
        createdAt: now,
        updatedAt: now
      } as any));
    const saved = await saveCompanies(leads, getRequestWorkspaceId(req));
    res.status(201).json({ imported: saved.length, leads: saved });
  } catch (error) {
    next(error);
  }
});

router.get("/leads/:id", async (req, res, next) => {
  try {
    const lead = await getCompanyAsync(req.params.id, getRequestWorkspaceId(req));
    if (!lead) return res.status(404).json({ message: "Lead não encontrado." });
    res.json(lead);
  } catch (error) {
    next(error);
  }
});

router.patch("/leads/:id", async (req, res, next) => {
  try {
    const lead = await updateCompany(req.params.id, req.body ?? {}, getRequestWorkspaceId(req));
    if (!lead) return res.status(404).json({ message: "Lead não encontrado." });
    res.json(lead);
  } catch (error) {
    next(error);
  }
});

router.get("/leads/:id/contacts", async (req, res, next) => {
  try {
    const { data, error } = await requireSupabase()
      .from("company_contacts")
      .select("*")
      .eq("workspace_id", getRequestWorkspaceId(req))
      .eq("company_id", req.params.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data ?? []);
  } catch (error) {
    next(error);
  }
});

router.post("/leads/:id/contacts", async (req, res, next) => {
  try {
    const body = contactSchema.parse(req.body ?? {});
    const row = {
      id: randomUUID(),
      workspace_id: getRequestWorkspaceId(req),
      company_id: req.params.id,
      name: body.name,
      role: body.role,
      email: body.email,
      phone: body.phone,
      whatsapp: body.whatsapp,
      linkedin_url: body.linkedinUrl,
      notes: body.notes,
      custom_fields: body.customFields ?? {}
    };
    const { data, error } = await requireSupabase().from("company_contacts").insert(row).select("*").single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

router.get("/leads/:id/activities", async (req, res, next) => {
  try {
    const notes = await listNotes(req.params.id, getRequestWorkspaceId(req));
    const sb = getSupabase();
    if (!sb) return res.json(notes.map((note) => ({ ...note, type: "note" })));
    const { data, error } = await sb
      .from("communications")
      .select("*")
      .eq("workspace_id", getRequestWorkspaceId(req))
      .eq("company_id", req.params.id)
      .order("sent_at", { ascending: false });
    if (error && isMissingSupabaseRelation(error)) {
      return res.json(notes.map((note) => ({ ...note, type: "note" })));
    }
    if (error) throw error;
    res.json([...(data ?? []), ...notes.map((note) => ({ ...note, type: "note" }))]);
  } catch (error) {
    next(error);
  }
});

router.post("/leads/:id/activities", async (req, res, next) => {
  try {
    const body = activitySchema.parse(req.body ?? {});
    if (body.type === "note") {
      const note = await addNote(req.params.id, body.body, getRequestWorkspaceId(req));
      return res.status(201).json({ ...note, type: "note" });
    }
    const row = {
      id: randomUUID(),
      workspace_id: getRequestWorkspaceId(req),
      company_id: req.params.id,
      type: body.type,
      direction: body.direction || "manual",
      subject: body.subject,
      body: body.body,
      sent_by: body.sentBy,
      sent_at: body.sentAt || new Date().toISOString(),
      status: body.status || "sent",
      metadata: body.metadata ?? {}
    };
    const { data, error } = await requireSupabase().from("communications").insert(row).select("*").single();
    if (error && isMissingSupabaseRelation(error)) {
      const note = await addNote(req.params.id, body.body, getRequestWorkspaceId(req));
      return res.status(201).json({ ...note, type: body.type });
    }
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

router.get("/leads/:id/tasks", async (req, res, next) => {
  try {
    res.json(await listTasks(req.params.id, getRequestWorkspaceId(req)));
  } catch (error) {
    next(error);
  }
});

router.post("/leads/:id/tasks", async (req, res, next) => {
  try {
    const task = await createTask(req.params.id, taskSchema.parse(req.body ?? {}), getRequestWorkspaceId(req));
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

router.get("/leads/:id/proposal.pdf", async (req, res, next) => {
  try {
    const lead = await getCompanyAsync(req.params.id, getRequestWorkspaceId(req));
    if (!lead) return res.status(404).json({ message: "Lead não encontrado." });
    const doc = new PDFDocument({ margin: 48 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => {
      const pdf = Buffer.concat(chunks);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="proposta-${safeFileName(lead.name)}.pdf"`);
      res.send(pdf);
    });
    doc.fontSize(20).text("Proposta Comercial NODERE Nexus", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`Lead: ${lead.name}`);
    doc.text(`Segmento: ${lead.category || "Não informado"}`);
    doc.text(`Cidade: ${[lead.city, lead.state].filter(Boolean).join(" / ") || "Não informada"}`);
    doc.text(`Score: ${lead.score}/100 (${lead.opportunityLevel})`);
    doc.moveDown();
    doc.fontSize(12).text("Oportunidades detectadas:");
    for (const item of lead.detectedOpportunities || []) doc.text(`- ${item}`);
    doc.moveDown();
    doc.text("Próximos passos sugeridos:");
    for (const item of lead.suggestions || []) doc.text(`- ${item}`);
    doc.end();
  } catch (error) {
    next(error);
  }
});

const leadSchema = z.object({
  name: z.string().min(2),
  category: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  website: z.string().optional(),
  status: z.string().optional(),
  score: z.coerce.number().min(0).max(100).optional(),
  opportunityLevel: z.enum(["Alta", "Media", "Baixa"]).optional()
});

const contactSchema = z.object({
  name: z.string().min(2),
  role: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  linkedinUrl: z.string().optional(),
  notes: z.string().optional(),
  customFields: z.record(z.unknown()).optional()
});

const activitySchema = z.object({
  type: z.string().default("note"),
  direction: z.string().optional(),
  subject: z.string().optional(),
  body: z.string().min(1),
  sentBy: z.string().optional(),
  sentAt: z.string().optional(),
  status: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

const taskSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  dueAt: z.string().optional(),
  priority: z.string().optional(),
  channel: z.string().optional()
});

function requireSupabase() {
  const sb = getSupabase();
  if (!sb) {
    const error = new Error("Supabase não configurado para CRM.") as Error & { status?: number; code?: string };
    error.status = 503;
    error.code = "SUPABASE_NOT_CONFIGURED";
    throw error;
  }
  return sb;
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function safeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "lead";
}

function isMissingSupabaseRelation(error: unknown) {
  const source = error as { code?: unknown; message?: unknown };
  const text = String(source?.message || "");
  return source?.code === "PGRST205" || text.includes("Could not find the table");
}

export default router;
