import { Router, type Request } from "express";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { config } from "../config.js";
import { getSupabase } from "../db/supabase.js";
import { getRequestWorkspaceId, requireWorkspaceMutation, requireWorkspaceRole } from "../middleware/session.js";
import {
  addInboundMessage,
  addOutboundMessage,
  buildInboxRow,
  getConversation,
  getSlaStatus,
  getWhatsappTemplate,
  listConversations,
  listWhatsappTemplates,
  normalizeAttachments,
  parseStatusUpdate,
  parseWebhookPayload,
  resolveConversation,
  sortInboxChronologically,
  updateMessageStatus
} from "../services/inbox.js";
import { sendWhatsappMessage } from "../services/whatsapp.js";
import { getCompany } from "../services/companyStore.js";
import { isMissingSupabaseSchema } from "../utils/supabaseErrors.js";

const router = Router();
router.use(requireWorkspaceMutation("owner", "admin", "operator"));
const canReadInbox = requireWorkspaceRole("owner", "admin", "operator", "viewer");
const canMutateInbox = requireWorkspaceRole("owner", "admin", "operator");

router.get("/", canReadInbox, async (req, res, next) => {
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
      if (isMissingSupabaseSchema(error)) {
        return res.json({ messages: [], total: 0, page: 1, limit: 50 });
      }
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

router.get("/unread-count", canReadInbox, async (req, res, next) => {
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
    if (isMissingSupabaseSchema(error)) return res.json({ unread: 0 });
    return next(error);
  }
});

router.get("/templates", canReadInbox, (_req, res) => {
  res.json({ templates: listWhatsappTemplates() });
});

router.get("/company/:companyId", canReadInbox, async (req, res, next) => {
  const sb = getSupabase();
  if (!sb) return res.json({ messages: [], total: 0 });
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const { data, error } = await sb
      .from("inbox_messages")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("company_id", req.params.companyId)
      .order("sent_at", { ascending: true });
    if (error) throw error;
    return res.json({ messages: sortInboxChronologically(data ?? []), total: data?.length ?? 0 });
  } catch (error) {
    if (isMissingSupabaseSchema(error)) return res.json({ messages: [], total: 0 });
    return next(error);
  }
});

router.post("/", canMutateInbox, async (req, res, next) => {
  try {
    const legacy = z.object({
      phone: z.string().min(6),
      message: z.string().min(1),
      companyId: z.string().optional(),
      companyName: z.string().optional(),
      direction: z.enum(["inbound", "outbound", "manual"]).optional(),
      templateKey: z.string().optional(),
      attachments: z.array(z.record(z.unknown())).optional()
    }).safeParse(req.body);

    if (legacy.success) {
      const body = legacy.data;
      const sb = getSupabase();
      if (sb) {
        const row = {
          id: randomUUID(),
          ...buildInboxRow({
            workspaceId: getRequestWorkspaceId(req),
            companyId: body.companyId || null,
            type: "whatsapp",
            direction: body.direction || "manual",
            status: body.direction === "inbound" ? "unread" : "read",
            subject: body.templateKey ? getWhatsappTemplate(body.templateKey)?.name || "WhatsApp" : "WhatsApp",
            body: body.message,
            phoneFrom: body.direction === "inbound" ? body.phone : null,
            phoneTo: body.direction === "outbound" ? body.phone : null,
            sentBy: "Operador",
            templateKey: body.templateKey || null,
            companyName: body.companyName || null,
            attachments: normalizeAttachments(body.attachments)
          })
        };
        const { data, error } = await sb.from("inbox_messages").insert(row).select("*").single();
        if (error) throw error;
        await mirrorInboxToCommunication(req, data).catch(() => undefined);
        return res.status(201).json(data);
      }
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
      ...buildInboxRow({
        workspaceId: getRequestWorkspaceId(req),
        companyId: body.companyId,
        contactId: body.contactId,
        type: body.type,
        direction: body.direction,
        status: body.status,
        subject: body.subject,
        body: body.body,
        phoneFrom: body.phoneFrom,
        phoneTo: body.phoneTo,
        flagColor: body.flagColor,
        sentBy: body.sentBy,
        sentAt: body.sentAt,
        providerMessageId: body.providerMessageId,
        templateKey: body.templateKey,
        attachments: normalizeAttachments(body.attachments),
        metadata: body.metadata
      })
    };
    const { data, error } = await requireSupabase().from("inbox_messages").insert(row).select("*").single();
    if (error) throw error;
    await mirrorInboxToCommunication(req, data).catch(() => undefined);
    return res.status(201).json(data);
  } catch (error) {
    return next(error);
  }
});

router.post("/manual", canMutateInbox, (req, res, next) => {
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

router.patch("/:id", canMutateInbox, async (req, res, next) => {
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

router.get("/:phone", canReadInbox, (req, res) => {
  const phone = String(req.params.phone);
  const conv = getConversation(phone);
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
  providerMessageId: z.string().optional().nullable(),
  templateKey: z.string().optional().nullable(),
  attachments: z.array(z.record(z.unknown())).optional(),
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

router.post("/:phone/reply", canMutateInbox, async (req, res, next) => {
  try {
    const body = z.object({
      message: z.string().min(1),
      companyId: z.string().optional(),
      templateKey: z.string().optional(),
      attachments: z.array(z.record(z.unknown())).optional()
    }).parse(req.body);

    const phone = String(req.params.phone);
    const company = body.companyId ? getCompany(body.companyId) : undefined;

    const fakeCompany = company ?? {
      id: "direct",
      phone,
      whatsapp: phone
    } as any;

    const result = await sendWhatsappMessage(fakeCompany, body.message);
    const msg = addOutboundMessage(phone, body.message, (result as any).response?.messages?.[0]?.id);
    const sb = getSupabase();
    if (sb) {
      const row = {
        id: randomUUID(),
        ...buildInboxRow({
          workspaceId: getRequestWorkspaceId(req),
          companyId: body.companyId || null,
          type: "whatsapp",
          direction: "outbound",
          status: "read",
          subject: body.templateKey ? getWhatsappTemplate(body.templateKey)?.name || "WhatsApp enviado" : "WhatsApp enviado",
          body: body.message,
          phoneTo: phone,
          sentBy: "Operador",
          providerMessageId: (result as any).response?.messages?.[0]?.id,
          templateKey: body.templateKey,
          attachments: normalizeAttachments(body.attachments),
          metadata: { whatsapp: result }
        })
      };
      const { data, error } = await sb.from("inbox_messages").insert(row).select("*").single();
      if (error) throw error;
      await mirrorInboxToCommunication(req, data).catch(() => undefined);
      return res.json({ message: data, whatsapp: result });
    }
    return res.json({ message: msg, whatsapp: result });
  } catch (error) {
    return next(error);
  }
});

router.patch("/:phone/resolve", canMutateInbox, (req, res) => {
  const ok = resolveConversation(String(req.params.phone));
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

async function mirrorInboxToCommunication(req: Request, inboxRow: Record<string, any>) {
  if (!inboxRow.company_id) return;
  const metadata = inboxRow.metadata && typeof inboxRow.metadata === "object" ? inboxRow.metadata : {};
  const { error } = await requireSupabase()
    .from("communications")
    .insert({
      id: randomUUID(),
      workspace_id: getRequestWorkspaceId(req),
      company_id: inboxRow.company_id,
      contact_id: inboxRow.contact_id || null,
      type: "whatsapp",
      direction: inboxRow.direction || "manual",
      subject: inboxRow.subject || "WhatsApp",
      body: inboxRow.body || inboxRow.content || "",
      sent_by: inboxRow.sent_by || null,
      sent_at: inboxRow.sent_at || new Date().toISOString(),
      status: inboxRow.direction === "inbound" ? "delivered" : "sent",
      metadata: {
        ...metadata,
        inboxMessageId: inboxRow.id,
        attachments: normalizeAttachments(metadata.attachments)
      }
    });
  if (error) throw error;
}
