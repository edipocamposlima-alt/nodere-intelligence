import { Router, type Request } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getSupabase } from "../db/supabase.js";
import { getRequestWorkspaceId } from "../middleware/session.js";
import { addNote, getCompanyAsync, listCompaniesAsync, saveCompanies, updateCompany, updateStatus } from "../services/companyStore.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const stage = String(req.query.stage || "");
    const search = String(req.query.search || req.query.q || "").toLowerCase();
    const leads = (await listCompaniesAsync(workspaceId)).filter((lead) =>
      (!stage || lead.status === stage) &&
      (!search || [lead.name, lead.category, lead.city, lead.state, lead.phone, lead.whatsapp, lead.website].filter(Boolean).join(" ").toLowerCase().includes(search))
    );
    res.json(leads);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const body = leadSchema.parse(req.body ?? {});
    const now = new Date().toISOString();
    const company = {
      id: `lead-${randomUUID()}`,
      name: body.name,
      legalName: body.legalName,
      cnpj: body.cnpj,
      category: body.category || "Empresa",
      city: body.city || "",
      state: body.state || "",
      address: body.address || "",
      phone: body.phone || "",
      whatsapp: body.whatsapp || "",
      website: body.website || "",
      status: body.status || "Novo Lead",
      score: body.score ?? 50,
      opportunityLevel: body.temperature === "Quente" ? "Alta" : body.temperature === "Frio" ? "Baixa" : "Media",
      detectedOpportunities: [],
      suggestions: [],
      notes: body.notes ? [{ id: randomUUID(), companyId: "", body: body.notes, createdAt: now }] : [],
      source: "manual",
      createdAt: now,
      updatedAt: now,
      emailPrincipal: body.email || "",
      serviceInterest: body.serviceInterest || "",
      temperature: body.temperature || "Morno"
    } as any;
    const [saved] = await saveCompanies([company], getRequestWorkspaceId(req));
    await recordActivity(req, saved.id, "note", "Lead criado", "Lead criado manualmente no CRM inteligente.").catch(() => undefined);
    res.status(201).json(saved);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const lead = await getCompanyAsync(req.params.id, getRequestWorkspaceId(req));
    if (!lead) return res.status(404).json({ message: "Lead não encontrado." });
    res.json(lead);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const updated = await updateCompany(req.params.id, req.body ?? {}, getRequestWorkspaceId(req));
    if (!updated) return res.status(404).json({ message: "Lead não encontrado." });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/stage", async (req, res, next) => {
  try {
    const body = stageSchema.parse(req.body ?? {});
    const workspaceId = getRequestWorkspaceId(req);
    const current = await getCompanyAsync(req.params.id, workspaceId);
    if (!current) return res.status(404).json({ message: "Lead não encontrado." });
    const updated = await updateStatus(req.params.id, body.newStage as any, workspaceId);
    await recordActivity(req, req.params.id, "stage_change", `Etapa alterada para ${body.newStage}`, body.reason || "", {
      from: current.status,
      to: body.newStage,
      reason: body.reason || ""
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const updated = await updateCompany(req.params.id, { status: "Perdido", isArchived: true } as any, getRequestWorkspaceId(req));
    if (!updated) return res.status(404).json({ message: "Lead não encontrado." });
    await recordActivity(req, req.params.id, "note", "Lead arquivado", "Soft delete/arquivamento executado.");
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.get("/:id/activities", async (req, res, next) => {
  try {
    const sb = getSupabase();
    if (!sb) return res.json([]);
    const { data, error } = await sb
      .from("communications")
      .select("*")
      .eq("workspace_id", getRequestWorkspaceId(req))
      .eq("company_id", req.params.id)
      .order("sent_at", { ascending: false });
    if (error && isMissingRelation(error)) return res.json([]);
    if (error) throw error;
    res.json(data ?? []);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/activities", async (req, res, next) => {
  try {
    const body = activitySchema.parse(req.body ?? {});
    if (body.type === "note") {
      const note = await addNote(req.params.id, body.body || body.content || "", getRequestWorkspaceId(req));
      await recordActivity(req, req.params.id, "note", body.title || "Observação", body.body || body.content || "").catch(() => undefined);
      return res.status(201).json({ ...note, type: "note" });
    }
    const activity = await recordActivity(req, req.params.id, body.type, body.title || body.type, body.body || body.content || "", body.metadata ?? {});
    res.status(201).json(activity);
  } catch (error) {
    next(error);
  }
});

router.get("/:id/contacts", async (req, res, next) => {
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

router.post("/:id/contacts", async (req, res, next) => {
  try {
    const body = contactSchema.parse(req.body ?? {});
    const row = {
      id: randomUUID(),
      workspace_id: getRequestWorkspaceId(req),
      company_id: req.params.id,
      name: body.name,
      role: body.role || "",
      email: body.email || "",
      phone: body.phone || "",
      whatsapp: body.whatsapp || "",
      linkedin_url: body.linkedinUrl || "",
      notes: body.notes || "",
      is_decision_maker: Boolean(body.isDecisionMaker)
    };
    let { data, error } = await requireSupabase().from("company_contacts").insert(row).select("*").single();
    if (error && isMissingColumn(error, "is_decision_maker")) {
      const fallbackRow = { ...row };
      delete (fallbackRow as Partial<typeof row>).is_decision_maker;
      const fallback = await requireSupabase().from("company_contacts").insert(fallbackRow).select("*").single();
      data = fallback.data;
      error = fallback.error;
    }
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

router.put("/:id/contacts/:contactId", async (req, res, next) => {
  try {
    const body = contactSchema.partial().parse(req.body ?? {});
    const updates = {
      name: body.name,
      role: body.role,
      email: body.email,
      phone: body.phone,
      whatsapp: body.whatsapp,
      linkedin_url: body.linkedinUrl,
      notes: body.notes,
      is_decision_maker: body.isDecisionMaker
    };
    let { data, error } = await requireSupabase()
      .from("company_contacts")
      .update(updates)
      .eq("workspace_id", getRequestWorkspaceId(req))
      .eq("company_id", req.params.id)
      .eq("id", req.params.contactId)
      .select("*")
      .single();
    if (error && isMissingColumn(error, "is_decision_maker")) {
      const fallbackUpdates = { ...updates };
      delete (fallbackUpdates as Partial<typeof updates>).is_decision_maker;
      const fallback = await requireSupabase()
        .from("company_contacts")
        .update(fallbackUpdates)
        .eq("workspace_id", getRequestWorkspaceId(req))
        .eq("company_id", req.params.id)
        .eq("id", req.params.contactId)
        .select("*")
        .single();
      data = fallback.data;
      error = fallback.error;
    }
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
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
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.get("/:id/deals", async (req, res, next) => {
  try {
    const { data, error } = await requireSupabase()
      .from("company_contracts")
      .select("*, catalog_items(*)")
      .eq("workspace_id", getRequestWorkspaceId(req))
      .eq("company_id", req.params.id)
      .order("created_at", { ascending: false });
    if (error && isMissingRelation(error)) return res.json([]);
    if (error) throw error;
    res.json(data ?? []);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/deals", async (req, res, next) => {
  try {
    const body = dealSchema.parse(req.body ?? {});
    const itemName = body.itemName || "Negociação comercial";
    let catalogItemId = body.catalogItemId || "";
    if (!catalogItemId) {
      catalogItemId = await ensureCatalogItem(getRequestWorkspaceId(req), itemName, body.itemType || "service", Number(body.unitPrice || body.totalPrice || 0));
    }
    const row = {
      id: randomUUID(),
      workspace_id: getRequestWorkspaceId(req),
      company_id: req.params.id,
      catalog_item_id: catalogItemId,
      quantity: body.quantity || 1,
      contracted_price: body.totalPrice ?? body.unitPrice ?? 0,
      status: body.status || "negotiating",
      notes: body.notes || "",
      contracted_at: body.startedAt || new Date().toISOString().slice(0, 10)
    };
    const { data, error } = await requireSupabase().from("company_contracts").insert(row).select("*, catalog_items(*)").single();
    if (error) throw error;
    await recordActivity(req, req.params.id, "proposal_sent", `Negociação registrada: ${itemName}`, body.notes || "", { dealId: row.id });
    res.status(201).json({ ...data, item_name: itemName, total_price: row.contracted_price });
  } catch (error) {
    next(error);
  }
});

router.put("/:id/deals/:dealId", async (req, res, next) => {
  try {
    const body = dealSchema.partial().parse(req.body ?? {});
    const { data, error } = await requireSupabase()
      .from("company_contracts")
      .update({
        quantity: body.quantity,
        contracted_price: body.totalPrice ?? body.unitPrice,
        status: body.status,
        notes: body.notes,
        updated_at: new Date().toISOString()
      })
      .eq("workspace_id", getRequestWorkspaceId(req))
      .eq("company_id", req.params.id)
      .eq("id", req.params.dealId)
      .select("*, catalog_items(*)")
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

const leadSchema = z.object({
  name: z.string().min(2),
  legalName: z.string().optional().nullable(),
  cnpj: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  temperature: z.string().optional().nullable(),
  serviceInterest: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  score: z.coerce.number().min(0).max(100).optional()
});

const stageSchema = z.object({
  newStage: z.string().min(2),
  reason: z.string().optional()
});

const activitySchema = z.object({
  type: z.string().min(2),
  title: z.string().optional(),
  body: z.string().optional(),
  content: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

const contactSchema = z.object({
  name: z.string().min(2),
  role: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  linkedinUrl: z.string().optional(),
  isDecisionMaker: z.boolean().optional(),
  notes: z.string().optional()
});

const dealSchema = z.object({
  catalogItemId: z.string().optional(),
  itemName: z.string().optional(),
  itemType: z.enum(["service", "product"]).optional(),
  description: z.string().optional(),
  quantity: z.coerce.number().optional(),
  unitPrice: z.coerce.number().optional(),
  totalPrice: z.coerce.number().optional(),
  status: z.string().optional(),
  startedAt: z.string().optional(),
  endedAt: z.string().optional(),
  notes: z.string().optional()
});

async function recordActivity(req: Request, companyId: string, type: string, title: string, body = "", metadata: Record<string, unknown> = {}) {
  const row = {
    id: randomUUID(),
    workspace_id: getRequestWorkspaceId(req),
    company_id: companyId,
    type,
    direction: "manual",
    subject: title,
    body,
    sent_at: new Date().toISOString(),
    status: "sent",
    metadata
  };
  const { data, error } = await requireSupabase().from("communications").insert(row).select("*").single();
  if (error) throw error;
  return data;
}

async function ensureCatalogItem(workspaceId: string, name: string, type: "service" | "product", price: number) {
  const sb = requireSupabase();
  const { data: existing, error: loadError } = await sb
    .from("catalog_items")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("name", name)
    .maybeSingle();
  if (loadError && !isMissingRelation(loadError)) throw loadError;
  if (existing?.id) return String(existing.id);
  const { data, error } = await sb
    .from("catalog_items")
    .insert({
      id: randomUUID(),
      workspace_id: workspaceId,
      code: `CRM-${String(Date.now()).slice(-6)}`,
      name,
      category: "CRM",
      type,
      status: "active",
      description_short: name,
      price
    })
    .select("id")
    .single();
  if (error) throw error;
  return String(data.id);
}

function requireSupabase() {
  const sb = getSupabase();
  if (!sb) {
    const error = new Error("Supabase não configurado no backend.");
    (error as Error & { status?: number }).status = 503;
    throw error;
  }
  return sb;
}

function isMissingRelation(error: unknown) {
  const code = String((error as { code?: unknown })?.code || "");
  const message = String((error as { message?: unknown })?.message || "");
  return code === "42P01" || code === "PGRST205" || message.includes("Could not find the table");
}

function isMissingColumn(error: unknown, column: string) {
  const code = String((error as { code?: unknown })?.code || "");
  const message = String((error as { message?: unknown })?.message || "");
  return code === "PGRST204" || message.includes(column);
}

export default router;
