import { Router } from "express";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { config } from "../config.js";
import { getSupabase } from "../db/supabase.js";
import { getRequestWorkspaceId } from "../middleware/session.js";
import {
  addInboundMessage,
  addOutboundMessage,
  getConversation,
  getSlaStatus,
  listConversations,
  parseStatusUpdate,
  parseWebhookPayload,
  resolveConversation,
  updateMessageStatus
} from "../services/inbox.js";
import { sendWhatsappMessage } from "../services/whatsapp.js";
import { getCompany } from "../services/companyStore.js";

const router = Router();

router.get("/", async (req, res, next) => {
  const sb = getSupabase();
  if (sb) {
    try {
      const workspaceId = getRequestWorkspaceId(req);
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.min(100, Math.max(1, Number(req.query.limit || 50)));
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      let query = sb
        .from("inbox_messages")
        .select("*", { count: "exact" })
        .eq("workspace_id", workspaceId)
        .order("sent_at", { ascending: false })
        .range(from, to);
      if (req.query.status) query = query.eq("status", String(req.query.status));
      if (req.query.company_id) query = query.eq("company_id", String(req.query.company_id));
      if (req.query.type) query = query.eq("type", String(req.query.type));
      const { data, error, count } = await query;
      if (error) throw error;
      return res.json({ messages: data ?? [], total: count ?? 0, page, limit });
    } catch (error) {
      return next(error);
    }
  }

  const convs = listConversations().map((conv) => ({
    ...conv,
    slaStatus: getSlaStatus(conv),
    messageCount: conv.messages.length,
    lastMessage: conv.messages.at(-1) ?? null
  }));
  res.json({ messages: convs, total: convs.length, page: 1, limit: convs.length });
});

router.get("/unread-count", async (req, res, next) => {
  const sb = getSupabase();
  if (!sb) return res.json({ unread: listConversations().filter((conv) => conv.status !== "resolved").length });
  try {
    const { count, error } = await sb
      .from("inbox_messages")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", getRequestWorkspaceId(req))
      .eq("status", "unread");
    if (error) throw error;
    return res.json({ unread: count ?? 0 });
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const legacy = z.object({
      phone: z.string().min(6),
      message: z.string().min(1),
      companyId: z.string().optional(),
      companyName: z.string().optional()
    }).safeParse(req.body);

    if (legacy.success) {
      const body = legacy.data;
      const conv = getConversation(body.phone);
      if (!conv && (body.companyId || body.companyName)) {
        addInboundMessage(body.phone, body.message);
        const created = getConversation(body.phone);
        if (created) {
          created.companyId = body.companyId;
          created.companyName = body.companyName;
        }
      } else {
        addInboundMessage(body.phone, body.message);
      }
      const updated = getConversation(body.phone);
      return res.status(201).json(updated ? { ...updated, slaStatus: getSlaStatus(updated) } : null);
    }

    const body = inboxMessageSchema.parse(req.body);
    const row = {
      id: randomUUID(),
      workspace_id: getRequestWorkspaceId(req),
      company_id: body.companyId,
      contact_id: body.contactId,
      type: body.type,
      direction: body.direction,
      status: body.status,
      subject: body.subject,
      body: body.body,
      content: body.body,
      channel: body.type,
      lead_id: body.companyId,
      phone_from: body.phoneFrom,
      phone_to: body.phoneTo,
      flag_color: body.flagColor,
      sent_by: body.sentBy,
      sent_at: body.sentAt || new Date().toISOString(),
      metadata: body.metadata ?? {}
    };
    const { data, error } = await requireSupabase().from("inbox_messages").insert(row).select("*").single();
    if (error) throw error;
    return res.status(201).json(data);
  } catch (error) {
    return next(error);
  }
});

router.post("/manual", (req, res, next) => {
  try {
    const body = z.object({
      phone: z.string().min(6),
      content: z.string().min(1),
      leadId: z.string().optional(),
      companyName: z.string().optional()
    }).parse(req.body);
    addInboundMessage(body.phone, body.content);
    const updated = getConversation(body.phone);
    if (updated) {
      updated.companyId = body.leadId;
      updated.companyName = body.companyName;
    }
    return res.status(201).json(updated ? { ...updated, slaStatus: getSlaStatus(updated) } : null);
  } catch (error) {
    return next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const body = z.object({
      status: z.enum(["unread", "read", "flagged", "resolved"]).optional(),
      flagColor: z.string().optional().nullable(),
      body: z.string().optional(),
      subject: z.string().optional().nullable()
    }).parse(req.body);
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.status !== undefined) updates.status = body.status;
    if (body.flagColor !== undefined) updates.flag_color = body.flagColor;
    if (body.body !== undefined) updates.body = body.body;
    if (body.subject !== undefined) updates.subject = body.subject;
    const { data, error } = await requireSupabase()
      .from("inbox_messages")
      .update(updates)
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

router.get("/:phone", (req, res) => {
  const conv = getConversation(req.params.phone);
  if (!conv) return res.status(404).json({ message: "Conversation not found" });
  return res.json({ ...conv, slaStatus: getSlaStatus(conv) });
});

const inboxMessageSchema = z.object({
  companyId: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  type: z.enum(["whatsapp", "email", "ligacao", "reuniao", "interno", "manual"]).default("manual"),
  direction: z.enum(["inbound", "outbound", "manual"]).default("manual"),
  status: z.enum(["unread", "read", "flagged", "resolved"]).default("read"),
  subject: z.string().optional().nullable(),
  body: z.string().min(1),
  phoneFrom: z.string().optional().nullable(),
  phoneTo: z.string().optional().nullable(),
  flagColor: z.string().optional().nullable(),
  sentBy: z.string().optional().nullable(),
  sentAt: z.string().optional().nullable(),
  metadata: z.record(z.unknown()).optional()
});

function requireSupabase() {
  const sb = getSupabase();
  if (!sb) {
    const error = new Error("Supabase não configurado para Inbox persistente.") as Error & { status?: number; code?: string };
    error.status = 503;
    error.code = "SUPABASE_NOT_CONFIGURED";
    throw error;
  }
  return sb;
}

router.post("/:phone/reply", async (req, res, next) => {
  try {
    const body = z.object({
      message: z.string().min(1),
      companyId: z.string().optional()
    }).parse(req.body);

    const phone = req.params.phone;
    const company = body.companyId ? getCompany(body.companyId) : undefined;

    const fakeCompany = company ?? {
      id: "direct",
      phone,
      whatsapp: phone
    } as any;

    const result = await sendWhatsappMessage(fakeCompany, body.message);
    const msg = addOutboundMessage(phone, body.message, (result as any).response?.messages?.[0]?.id);
    return res.json({ message: msg, whatsapp: result });
  } catch (error) {
    return next(error);
  }
});

router.patch("/:phone/resolve", (req, res) => {
  const ok = resolveConversation(req.params.phone);
  if (!ok) return res.status(404).json({ message: "Conversation not found" });
  return res.json({ resolved: true });
});

// Meta webhook verification
router.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === config.webhookSecret) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// Meta webhook incoming events
router.post("/webhook", (req, res) => {
  const messages = parseWebhookPayload(req.body);
  for (const { phone, messageId, text } of messages) {
    addInboundMessage(phone, text, messageId);
  }

  const statuses = parseStatusUpdate(req.body);
  for (const { messageId, status } of statuses) {
    updateMessageStatus(messageId, status);
  }

  res.sendStatus(200);
});

export default router;
