import { Router, type Request } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getSupabase } from "../db/supabase.js";
import { getRequestWorkspaceId, requireWorkspaceRole } from "../middleware/session.js";
import { addNote, getCompanyAsync, listCompaniesAsync, saveCompanies, updateCompany, updateStatus } from "../services/companyStore.js";

const router = Router();
const canEditCrm = requireWorkspaceRole("owner", "admin", "operator");

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

router.post("/", canEditCrm, async (req, res, next) => {
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
    const lead = await getCompanyAsync(String(req.params.id), getRequestWorkspaceId(req));
    if (!lead) return res.status(404).json({ message: "Lead não encontrado." });
    res.json(lead);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", canEditCrm, async (req, res, next) => {
  try {
    const updated = await updateCompany(String(req.params.id), req.body ?? {}, getRequestWorkspaceId(req));
    if (!updated) return res.status(404).json({ message: "Lead não encontrado." });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/stage", canEditCrm, async (req, res, next) => {
  try {
    const body = stageSchema.parse(req.body ?? {});
    const workspaceId = getRequestWorkspaceId(req);
    const current = await getCompanyAsync(String(req.params.id), workspaceId);
    if (!current) return res.status(404).json({ message: "Lead não encontrado." });
    const updated = await updateStatus(String(req.params.id), body.newStage as any, workspaceId);
    await recordActivity(req, String(req.params.id), "stage_change", `Etapa alterada para ${body.newStage}`, body.reason || "", {
      from: current.status,
      to: body.newStage,
      reason: body.reason || ""
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", canEditCrm, async (req, res, next) => {
  try {
    const updated = await updateCompany(String(req.params.id), { status: "Perdido", isArchived: true } as any, getRequestWorkspaceId(req));
    if (!updated) return res.status(404).json({ message: "Lead não encontrado." });
    await recordActivity(req, String(req.params.id), "note", "Lead arquivado", "Soft delete/arquivamento executado.");
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
    if (error && isMissingRelation(error)) throw crmSchemaRequired("communications");
    if (error) throw error;
    res.json(data ?? []);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/activities", canEditCrm, async (req, res, next) => {
  try {
    const body = activitySchema.parse(req.body ?? {});
    if (body.type === "note") {
      await addNote(String(req.params.id), body.body || body.content || "", getRequestWorkspaceId(req));
      const activity = await recordActivity(req, String(req.params.id), "note", body.title || "Observação", body.body || body.content || "", {
        ...(body.metadata ?? {}),
        responsible: body.responsible || body.metadata?.responsible || "",
        nextAction: body.nextAction || body.metadata?.nextAction || ""
      }, body.occurredAt);
      return res.status(201).json(activity);
    }
    const activity = await recordActivity(
      req,
      String(req.params.id),
      body.type,
      body.title || body.type,
      body.body || body.content || "",
      {
        ...(body.metadata ?? {}),
        responsible: body.responsible || body.metadata?.responsible || "",
        nextAction: body.nextAction || body.metadata?.nextAction || ""
      },
      body.occurredAt
    );
    res.status(201).json(activity);
  } catch (error) {
    next(error);
  }
});

router.put("/:id/activities/:activityId", canEditCrm, async (req, res, next) => {
  try {
    const body = activitySchema.partial().parse(req.body ?? {});
    const updates: Record<string, unknown> = {};
    if (body.type !== undefined) updates.type = body.type;
    if (body.title !== undefined) updates.subject = body.title;
    if (body.body !== undefined || body.content !== undefined) updates.body = body.body ?? body.content ?? "";
    if (body.occurredAt !== undefined) updates.sent_at = body.occurredAt;
    if (body.responsible !== undefined) updates.sent_by = body.responsible || null;
    if (body.metadata !== undefined || body.nextAction !== undefined || body.responsible !== undefined) {
      const { data: current, error: loadError } = await requireSupabase()
        .from("communications")
        .select("metadata")
        .eq("workspace_id", getRequestWorkspaceId(req))
        .eq("company_id", req.params.id)
        .eq("id", req.params.activityId)
        .single();
      if (loadError) throw loadError;
      updates.metadata = {
        ...((current?.metadata as Record<string, unknown> | null) ?? {}),
        ...(body.metadata ?? {}),
        ...(body.nextAction !== undefined ? { nextAction: body.nextAction } : {}),
        ...(body.responsible !== undefined ? { responsible: body.responsible } : {})
      };
    }
    const { data, error } = await requireSupabase()
      .from("communications")
      .update(updates)
      .eq("workspace_id", getRequestWorkspaceId(req))
      .eq("company_id", req.params.id)
      .eq("id", req.params.activityId)
      .select("*")
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id/activities/:activityId", canEditCrm, async (req, res, next) => {
  try {
    const { error } = await requireSupabase()
      .from("communications")
      .delete()
      .eq("workspace_id", getRequestWorkspaceId(req))
      .eq("company_id", req.params.id)
      .eq("id", req.params.activityId);
    if (error) throw error;
    res.json({ ok: true });
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

router.post("/:id/contacts", canEditCrm, async (req, res, next) => {
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
      is_decision_maker: Boolean(body.isDecisionMaker || body.influenceLevel === "decisor"),
      custom_fields: {
        influenceLevel: body.influenceLevel || "operacional",
        department: body.department || "",
        contactType: body.contactType || "comercial",
        isPrimary: Boolean(body.isPrimary),
        isFinancial: Boolean(body.isFinancial),
        isTechnical: Boolean(body.isTechnical)
      }
    };
    let { data, error } = await requireSupabase().from("company_contacts").insert(row).select("*").single();
    if (error && (isMissingColumn(error, "is_decision_maker") || isMissingColumn(error, "custom_fields"))) {
      const fallbackRow = { ...row };
      delete (fallbackRow as Partial<typeof row>).is_decision_maker;
      delete (fallbackRow as Partial<typeof row>).custom_fields;
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

router.put("/:id/contacts/:contactId", canEditCrm, async (req, res, next) => {
  try {
    const body = contactSchema.partial().parse(req.body ?? {});
    const { data: currentContact } = await requireSupabase()
      .from("company_contacts")
      .select("custom_fields")
      .eq("workspace_id", getRequestWorkspaceId(req))
      .eq("company_id", req.params.id)
      .eq("id", req.params.contactId)
      .maybeSingle();
    const currentFields = (currentContact?.custom_fields as Record<string, unknown> | null) ?? {};
    const updates = {
      name: body.name,
      role: body.role,
      email: body.email,
      phone: body.phone,
      whatsapp: body.whatsapp,
      linkedin_url: body.linkedinUrl,
      notes: body.notes,
      is_decision_maker: body.isDecisionMaker ?? (body.influenceLevel ? body.influenceLevel === "decisor" : undefined),
      custom_fields: {
        ...currentFields,
        ...(body.influenceLevel !== undefined ? { influenceLevel: body.influenceLevel } : {}),
        ...(body.department !== undefined ? { department: body.department } : {}),
        ...(body.contactType !== undefined ? { contactType: body.contactType } : {}),
        ...(body.isPrimary !== undefined ? { isPrimary: body.isPrimary } : {}),
        ...(body.isFinancial !== undefined ? { isFinancial: body.isFinancial } : {}),
        ...(body.isTechnical !== undefined ? { isTechnical: body.isTechnical } : {})
      }
    };
    let { data, error } = await requireSupabase()
      .from("company_contacts")
      .update(updates)
      .eq("workspace_id", getRequestWorkspaceId(req))
      .eq("company_id", req.params.id)
      .eq("id", req.params.contactId)
      .select("*")
      .single();
    if (error && (isMissingColumn(error, "is_decision_maker") || isMissingColumn(error, "custom_fields"))) {
      const fallbackUpdates = { ...updates };
      delete (fallbackUpdates as Partial<typeof updates>).is_decision_maker;
      delete (fallbackUpdates as Partial<typeof updates>).custom_fields;
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

router.delete("/:id/contacts/:contactId", canEditCrm, async (req, res, next) => {
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
    if (error && isMissingRelation(error)) throw crmSchemaRequired("company_contracts");
    if (error) throw error;
    res.json(data ?? []);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/deals", canEditCrm, async (req, res, next) => {
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
      contracted_at: body.startedAt || new Date().toISOString().slice(0, 10),
      started_at: body.startedAt || null,
      ended_at: body.endedAt || null,
      item_name: itemName,
      description: body.description || ""
    };
    const { data, error } = await requireSupabase().from("company_contracts").insert(row).select("*, catalog_items(*)").single();
    if (error) throw error;
    await recordActivity(req, String(req.params.id), "proposal_sent", `Negociação registrada: ${itemName}`, body.notes || "", { dealId: row.id });
    res.status(201).json({ ...data, item_name: itemName, total_price: row.contracted_price });
  } catch (error) {
    next(error);
  }
});

router.put("/:id/deals/:dealId", canEditCrm, async (req, res, next) => {
  try {
    const body = dealSchema.partial().parse(req.body ?? {});
    const { data, error } = await requireSupabase()
      .from("company_contracts")
      .update({
        quantity: body.quantity,
        contracted_price: body.totalPrice ?? body.unitPrice,
        status: body.status,
        notes: body.notes,
        ended_at: body.endedAt,
        item_name: body.itemName,
        description: body.description,
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

router.delete("/:id/deals/:dealId", canEditCrm, async (req, res, next) => {
  try {
    const { error } = await requireSupabase()
      .from("company_contracts")
      .delete()
      .eq("workspace_id", getRequestWorkspaceId(req))
      .eq("company_id", req.params.id)
      .eq("id", req.params.dealId);
    if (error) throw error;
    await recordActivity(req, String(req.params.id), "note", "Negociação removida", "Uma negociação foi removida da ficha comercial.");
    res.json({ ok: true });
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
  metadata: z.record(z.string(), z.unknown()).optional(),
  occurredAt: z.string().optional(),
  responsible: z.string().optional(),
  nextAction: z.string().optional()
});

const contactSchema = z.object({
  name: z.string().min(2),
  role: z.string().optional(),
  department: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  linkedinUrl: z.string().optional(),
  isDecisionMaker: z.boolean().optional(),
  influenceLevel: z.enum(["decisor", "influenciador", "operacional"]).optional(),
  contactType: z.string().optional(),
  isPrimary: z.boolean().optional(),
  isFinancial: z.boolean().optional(),
  isTechnical: z.boolean().optional(),
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

async function recordActivity(req: Request, companyId: string, type: string, title: string, body = "", metadata: Record<string, unknown> = {}, occurredAt?: string) {
  const row = {
    id: randomUUID(),
    workspace_id: getRequestWorkspaceId(req),
    company_id: companyId,
    type,
    direction: "manual",
    subject: title,
    body,
    sent_by: String(metadata.responsible || "") || null,
    sent_at: occurredAt || new Date().toISOString(),
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

function crmSchemaRequired(table: string) {
  return Object.assign(
    new Error(`A tabela ${table} ainda não existe no Supabase. Aplique packages/database/block03_crm_inteligente_existing_schema.sql.`),
    { status: 503, code: "CRM_SCHEMA_REQUIRED" }
  );
}

export default router;
