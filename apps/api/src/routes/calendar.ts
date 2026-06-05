import { Router } from "express";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { getSupabase } from "../db/supabase.js";
import { getRequestWorkspaceId } from "../middleware/session.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    let query = requireSupabase()
      .from("calendar_events")
      .select("*")
      .eq("workspace_id", workspaceId);
    if (req.query.company_id) query = query.eq("company_id", String(req.query.company_id));
    if (req.query.operator_id) query = query.eq("assigned_to", String(req.query.operator_id));
    if (req.query.type) query = query.eq("type", String(req.query.type));
    if (req.query.status) query = query.eq("status", String(req.query.status));
    if (req.query.start) query = query.gte("start_at", String(req.query.start));
    if (req.query.end) query = query.lte("end_at", String(req.query.end));
    const { data, error } = await query.order("start_at", { ascending: true });
    if (error) throw error;
    return res.json(data ?? []);
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const body = eventSchema.parse(req.body);
    const row = {
      id: randomUUID(),
      workspace_id: getRequestWorkspaceId(req),
      company_id: body.companyId,
      title: body.title,
      type: body.type,
      priority: body.priority,
      start_at: body.startAt,
      end_at: body.endAt,
      notes: body.notes,
      assigned_to: body.assignedTo,
      status: body.status,
      channel: body.channel,
      created_by: (req as any).session?.userId,
      metadata: body.metadata ?? {}
    };
    const { data, error } = await requireSupabase().from("calendar_events").insert(row).select("*").single();
    if (error) throw error;
    return res.status(201).json(data);
  } catch (error) {
    return next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const body = eventSchema.partial().parse(req.body);
    const row = mapEventUpdate(body);
    const { data, error } = await requireSupabase()
      .from("calendar_events")
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq("workspace_id", getRequestWorkspaceId(req))
      .eq("id", req.params.id)
      .select("*")
      .single();
    if (error) throw error;
    return res.json(data);
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { error } = await requireSupabase()
      .from("calendar_events")
      .delete()
      .eq("workspace_id", getRequestWorkspaceId(req))
      .eq("id", req.params.id);
    if (error) throw error;
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

const eventSchema = z.object({
  companyId: z.string().optional().nullable(),
  title: z.string().min(2),
  type: z.string().default("follow-up"),
  priority: z.string().default("medium"),
  startAt: z.string(),
  endAt: z.string(),
  notes: z.string().optional().nullable(),
  assignedTo: z.string().optional().nullable(),
  status: z.string().default("pendente"),
  channel: z.string().optional().nullable(),
  metadata: z.record(z.unknown()).optional()
});

function mapEventUpdate(input: Partial<z.infer<typeof eventSchema>>) {
  const row: Record<string, unknown> = {};
  if (input.companyId !== undefined) row.company_id = input.companyId;
  if (input.title !== undefined) row.title = input.title;
  if (input.type !== undefined) row.type = input.type;
  if (input.priority !== undefined) row.priority = input.priority;
  if (input.startAt !== undefined) row.start_at = input.startAt;
  if (input.endAt !== undefined) row.end_at = input.endAt;
  if (input.notes !== undefined) row.notes = input.notes;
  if (input.assignedTo !== undefined) row.assigned_to = input.assignedTo;
  if (input.status !== undefined) row.status = input.status;
  if (input.channel !== undefined) row.channel = input.channel;
  if (input.metadata !== undefined) row.metadata = input.metadata;
  return row;
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
