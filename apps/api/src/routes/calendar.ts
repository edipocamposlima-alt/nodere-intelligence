import { Router } from "express";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { getSupabase } from "../db/supabase.js";
import { getRequestWorkspaceId, isPrivilegedSession, requireWorkspaceRole, requireWorkspaceSession } from "../middleware/session.js";
import { logRequestMetric } from "../services/metricsStore.js";

const router = Router();

const eventTypes = [
  "ligacao", "call", "reuniao", "meeting", "demonstracao", "demo", "proposta", "proposal",
  "retorno", "followup", "follow-up", "follow_up", "pos_venda", "after_sale", "tarefa", "task",
  "interno", "internal", "postagem", "content_post"
] as const;
const eventPriorities = ["alta", "media", "baixa", "high", "medium", "low"] as const;
const eventStatuses = ["pendente", "confirmado", "realizado", "cancelado", "reagendado", "concluido", "rascunho", "Rascunho"] as const;

const optionalId = z.string().trim().min(1).max(160).optional().nullable();
const isoDate = z.string().datetime({ offset: true });
const listQuerySchema = z.object({
  company_id: z.string().trim().min(1).max(160).optional(),
  operator_id: z.string().trim().min(1).max(160).optional(),
  type: z.enum(eventTypes).optional(),
  status: z.enum(eventStatuses).optional(),
  start: isoDate.optional(),
  end: isoDate.optional()
});

const eventFieldsSchema = z.object({
  companyId: optionalId,
  leadId: optionalId,
  contactId: optionalId,
  title: z.string().trim().min(2).max(240),
  type: z.enum(eventTypes).default("followup"),
  priority: z.enum(eventPriorities).default("media"),
  startAt: isoDate,
  endAt: isoDate,
  notes: z.string().max(100_000).optional().nullable(),
  assignedTo: optionalId,
  status: z.enum(eventStatuses).default("pendente"),
  channel: z.string().trim().max(80).optional().nullable(),
  reminderAt: isoDate.optional().nullable(),
  reminderMinutes: z.number().int().min(0).max(10080).optional().nullable(),
  reminderEnabled: z.boolean().optional().default(false),
  metadata: z.record(z.unknown()).optional()
});

export const eventCreateSchema = eventFieldsSchema.superRefine((value, context) => {
  if (new Date(value.endAt).getTime() <= new Date(value.startAt).getTime()) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["endAt"], message: "O término deve ser posterior ao início." });
  }
  if (value.companyId && value.leadId && value.companyId !== value.leadId) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["leadId"], message: "Lead e empresa devem representar o mesmo registro." });
  }
});

const eventUpdateSchema = eventFieldsSchema.partial();

router.use(requireWorkspaceSession);

router.get("/", async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const session = (req as any).session;
    const filters = listQuerySchema.parse(req.query);
    let query = requireSupabase()
      .from("calendar_events")
      .select("*")
      .eq("workspace_id", workspaceId);
    if (filters.company_id) query = query.eq("company_id", filters.company_id);
    if (filters.operator_id) query = query.eq("assigned_to", filters.operator_id);
    if (filters.type) query = query.eq("type", filters.type);
    if (filters.status) query = query.eq("status", filters.status);
    // An event belongs to the range when it overlaps it, not only when it is fully contained in it.
    if (filters.start) query = query.gte("end_at", filters.start);
    if (filters.end) query = query.lte("start_at", filters.end);
    if (!isPrivilegedSession(req) && session?.role === "operator") {
      query = query.or(`assigned_to.eq.${session.userId},created_by.eq.${session.userId}`);
    }
    const { data, error } = await query.order("start_at", { ascending: true });
    if (error) throw error;
    return res.json(data ?? []);
  } catch (error) {
    return next(error);
  }
});

router.post("/", requireWorkspaceRole("owner", "admin", "operator"), async (req, res, next) => {
  try {
    const body = eventCreateSchema.parse(req.body);
    const session = (req as any).session;
    const workspaceId = getRequestWorkspaceId(req);
    const relations = await resolveEventRelations(workspaceId, {
      companyId: body.companyId ?? body.leadId,
      contactId: body.contactId,
      assignedTo: session?.role === "operator" ? session.userId : body.assignedTo || session?.userId
    });
    const row = {
      id: randomUUID(),
      workspace_id: workspaceId,
      company_id: relations.companyId,
      contact_id: relations.contactId,
      title: body.title,
      type: body.type,
      priority: body.priority,
      start_at: body.startAt,
      end_at: body.endAt,
      notes: body.notes,
      assigned_to: relations.assignedTo,
      status: body.status,
      channel: body.channel,
      created_by: session?.userId,
      reminder_at: body.reminderAt,
      reminder_minutes: body.reminderMinutes,
      reminder_enabled: body.reminderEnabled,
      metadata: body.metadata ?? {}
    };
    const { data, error } = await requireSupabase().from("calendar_events").insert(row).select("*").single();
    if (error) throw error;
    if (["reuniao", "meeting", "demonstracao"].includes(String(body.type).toLowerCase())) {
      logRequestMetric(req, "meeting_scheduled", row.id, { companyId: body.companyId || null, startAt: body.startAt });
    }
    return res.status(201).json(data);
  } catch (error) {
    return next(error);
  }
});

router.patch("/:id", requireWorkspaceRole("owner", "admin", "operator"), async (req, res, next) => {
  try {
    const body = eventUpdateSchema.parse(req.body);
    const workspaceId = getRequestWorkspaceId(req);
    const eventId = String(req.params.id);
    const session = (req as any).session;
    const current = await findEvent(workspaceId, eventId);
    if (!current) throw httpError(404, "Evento não encontrado.", "CALENDAR_EVENT_NOT_FOUND");
    if (!canMutateCalendarEvent(session?.role, session?.userId, current)) {
      throw httpError(403, "Você não tem permissão para alterar este evento.", "CALENDAR_EVENT_FORBIDDEN");
    }

    const startAt = body.startAt ?? String(current.start_at);
    const endAt = body.endAt ?? String(current.end_at);
    validateEventRange(startAt, endAt);
    if (body.companyId && body.leadId && body.companyId !== body.leadId) {
      throw httpError(400, "Lead e empresa devem representar o mesmo registro.", "CALENDAR_RELATION_MISMATCH");
    }
    const relations = await resolveEventRelations(workspaceId, {
      companyId: body.companyId !== undefined ? body.companyId : body.leadId !== undefined ? body.leadId : current.company_id,
      contactId: body.contactId !== undefined ? body.contactId : current.contact_id,
      assignedTo: session?.role === "operator"
        ? session.userId
        : body.assignedTo !== undefined ? body.assignedTo : current.assigned_to
    });
    const row = mapEventUpdate(body);
    row.company_id = relations.companyId;
    row.contact_id = relations.contactId;
    row.assigned_to = relations.assignedTo;
    const { data, error } = await requireSupabase()
      .from("calendar_events")
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq("workspace_id", workspaceId)
      .eq("id", eventId)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw httpError(404, "Evento não encontrado.", "CALENDAR_EVENT_NOT_FOUND");
    return res.json(data);
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", requireWorkspaceRole("owner", "admin", "operator"), async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const eventId = String(req.params.id);
    const session = (req as any).session;
    const current = await findEvent(workspaceId, eventId);
    if (!current) throw httpError(404, "Evento não encontrado.", "CALENDAR_EVENT_NOT_FOUND");
    if (!canMutateCalendarEvent(session?.role, session?.userId, current)) {
      throw httpError(403, "Você não tem permissão para excluir este evento.", "CALENDAR_EVENT_FORBIDDEN");
    }
    const { data, error } = await requireSupabase()
      .from("calendar_events")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("id", eventId)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw httpError(404, "Evento não encontrado.", "CALENDAR_EVENT_NOT_FOUND");
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

function mapEventUpdate(input: z.infer<typeof eventUpdateSchema>) {
  const row: Record<string, unknown> = {};
  if (input.companyId !== undefined) row.company_id = input.companyId;
  if (input.contactId !== undefined) row.contact_id = input.contactId;
  if (input.title !== undefined) row.title = input.title;
  if (input.type !== undefined) row.type = input.type;
  if (input.priority !== undefined) row.priority = input.priority;
  if (input.startAt !== undefined) row.start_at = input.startAt;
  if (input.endAt !== undefined) row.end_at = input.endAt;
  if (input.notes !== undefined) row.notes = input.notes;
  if (input.assignedTo !== undefined) row.assigned_to = input.assignedTo;
  if (input.status !== undefined) row.status = input.status;
  if (input.channel !== undefined) row.channel = input.channel;
  if (input.reminderAt !== undefined) row.reminder_at = input.reminderAt;
  if (input.reminderMinutes !== undefined) row.reminder_minutes = input.reminderMinutes;
  if (input.reminderEnabled !== undefined) row.reminder_enabled = input.reminderEnabled;
  if (input.metadata !== undefined) row.metadata = input.metadata;
  return row;
}

export function validateEventRange(startAt: string, endAt: string) {
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    throw httpError(400, "Data de início ou término inválida.", "CALENDAR_INVALID_DATE");
  }
  if (end <= start) {
    throw httpError(400, "O término deve ser posterior ao início.", "CALENDAR_INVALID_RANGE");
  }
}

export function canMutateCalendarEvent(role: string | undefined, userId: string | undefined, event: Record<string, unknown>) {
  if (role === "owner" || role === "admin") return true;
  if (role !== "operator" || !userId) return false;
  return event.assigned_to === userId || event.created_by === userId;
}

async function findEvent(workspaceId: string, eventId: string) {
  const { data, error } = await requireSupabase()
    .from("calendar_events")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", eventId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function resolveEventRelations(workspaceId: string, input: {
  companyId?: string | null;
  contactId?: string | null;
  assignedTo?: string | null;
}) {
  let companyId = input.companyId || null;
  const contactId = input.contactId || null;
  const assignedTo = input.assignedTo || null;
  const sb = requireSupabase();

  if (companyId) {
    const { data, error } = await sb
      .from("nodere_companies")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("id", companyId)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw httpError(400, "Empresa ou lead não pertence ao workspace.", "CALENDAR_COMPANY_INVALID");
  }

  if (contactId) {
    const { data, error } = await sb
      .from("company_contacts")
      .select("id,company_id")
      .eq("workspace_id", workspaceId)
      .eq("id", contactId)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw httpError(400, "Contato não pertence ao workspace.", "CALENDAR_CONTACT_INVALID");
    if (companyId && data.company_id !== companyId) {
      throw httpError(400, "Contato não pertence à empresa vinculada.", "CALENDAR_CONTACT_COMPANY_MISMATCH");
    }
    companyId = companyId || data.company_id;
  }

  if (assignedTo) {
    const { data, error } = await sb
      .from("nodere_platform_users")
      .select("id,active")
      .eq("workspace_id", workspaceId)
      .eq("id", assignedTo)
      .maybeSingle();
    if (error) throw error;
    if (!data || data.active === false) {
      throw httpError(400, "Operador responsável não pertence ao workspace ou está inativo.", "CALENDAR_OPERATOR_INVALID");
    }
  }

  return { companyId, contactId, assignedTo };
}

function httpError(status: number, message: string, code: string) {
  const error = new Error(message) as Error & { status: number; code: string };
  error.status = status;
  error.code = code;
  return error;
}

function requireSupabase() {
  const sb = getSupabase();
  if (!sb) {
    const error = new Error("Supabase não configurado para calendário.") as Error & { status?: number; code?: string };
    error.status = 503;
    error.code = "SUPABASE_NOT_CONFIGURED";
    throw error;
  }
  return sb;
}

export default router;
