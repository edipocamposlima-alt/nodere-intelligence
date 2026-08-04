import { randomUUID } from "node:crypto";
import { Router } from "express";
import sanitizeHtml from "sanitize-html";
import { z } from "zod";
import { config } from "../config.js";
import { getSupabase } from "../db/supabase.js";
import { getRequestWorkspaceId, requireWorkspaceRole } from "../middleware/session.js";
import { createSmtpTransport } from "../services/emailSender.js";
import { emitDomainEvent } from "../services/domainEvents.js";

const router = Router();
const canEdit = requireWorkspaceRole("owner", "admin", "operator");
const MAX_ATTACHMENT_COUNT = 10;
const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;
const allowedEmailAttachmentTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/webp"
]);

const channelSchema = z.enum(["email", "whatsapp", "internal"]);
const templateSchema = z.object({
  name: z.string().min(2).max(160),
  channel: channelSchema,
  category: z.string().max(80).optional(),
  subject: z.string().max(240).optional(),
  bodyText: z.string().max(50_000).optional(),
  bodyHtml: z.string().max(100_000).optional(),
  signature: z.string().max(10_000).optional(),
  active: z.boolean().optional()
});

const composeSchema = z.object({
  companyId: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  threadId: z.string().optional().nullable(),
  channel: z.enum(["email", "whatsapp"]),
  recipient: z.string().min(5).max(320),
  subject: z.string().max(240).optional(),
  bodyText: z.string().max(50_000).optional(),
  bodyHtml: z.string().max(100_000).optional(),
  attachmentRefs: z.array(z.string().min(1)).max(MAX_ATTACHMENT_COUNT).optional(),
  consentConfirmed: z.boolean(),
  idempotencyKey: z.string().min(8).max(180)
}).superRefine((value, context) => {
  if (!value.consentConfirmed) context.addIssue({ code: z.ZodIssueCode.custom, path: ["consentConfirmed"], message: "Confirme a base de contato e o consentimento antes de criar a saída." });
  if (value.channel === "email" && !z.string().email().safeParse(value.recipient).success) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["recipient"], message: "Destinatário de e-mail inválido." });
  }
  if (value.channel === "whatsapp" && normalizePhone(value.recipient).length < 12) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["recipient"], message: "WhatsApp deve conter DDI e DDD." });
  }
});

router.get("/status", async (req, res, next) => {
  try {
    const { data, error } = await requireSupabase().from("integration_connections").select("provider, status, account_label, last_verified_at, last_error").eq("workspace_id", getRequestWorkspaceId(req));
    if (error) throw error;
    const persisted = new Map((data ?? []).map((item) => [item.provider, item]));
    res.json({
      email: persisted.get("smtp") ?? { provider: "smtp", status: config.smtp.host && config.smtp.user && config.smtp.pass ? "configured" : "not_configured" },
      gmail: persisted.get("gmail") ?? { provider: "gmail", status: "not_configured" },
      whatsapp: persisted.get("whatsapp") ?? { provider: "whatsapp", status: "assisted", account_label: "Abertura assistida via wa.me" }
    });
  } catch (error) {
    next(error);
  }
});

router.get("/attachments", async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const companyId = String(req.query.companyId || "").trim();
    const sb = requireSupabase();
    let companyFilesQuery = sb.from("company_files").select("id,company_id,filename,file_type,file_size,created_at").eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(100);
    let briefingsQuery = sb.from("commercial_briefings").select("id,company_id,code,title").eq("workspace_id", workspaceId).is("archived_at", null).limit(100);
    if (companyId) {
      companyFilesQuery = companyFilesQuery.eq("company_id", companyId);
      briefingsQuery = briefingsQuery.eq("company_id", companyId);
    }
    const [companyFilesResult, briefingsResult] = await Promise.all([companyFilesQuery, briefingsQuery]);
    if (companyFilesResult.error) throw companyFilesResult.error;
    if (briefingsResult.error) throw briefingsResult.error;
    const briefings = briefingsResult.data ?? [];
    const briefingIds = briefings.map((item) => item.id);
    const briefingLabel = new Map(briefings.map((item) => [item.id, `${item.code || "Briefing"} · ${item.title || "Sem título"}`]));
    let briefingAttachments: any[] = [];
    if (briefingIds.length) {
      const result = await sb.from("commercial_briefing_attachments").select("id,briefing_id,original_name,mime_type,size_bytes,created_at").eq("workspace_id", workspaceId).in("briefing_id", briefingIds).is("deleted_at", null).order("created_at", { ascending: false }).limit(100);
      if (result.error) throw result.error;
      briefingAttachments = result.data ?? [];
    }
    res.json([
      ...(companyFilesResult.data ?? []).map((file) => ({ ref: `company-file:${file.id}`, source: "company-file", companyId: file.company_id, name: file.filename, mimeType: file.file_type, sizeBytes: Number(file.file_size || 0), context: "Arquivo da empresa" })),
      ...briefingAttachments.map((file) => ({ ref: `briefing:${file.id}`, source: "briefing", briefingId: file.briefing_id, name: file.original_name, mimeType: file.mime_type, sizeBytes: Number(file.size_bytes || 0), context: briefingLabel.get(file.briefing_id) || "Briefing comercial" }))
    ]);
  } catch (error) {
    next(error);
  }
});

router.get("/templates", async (req, res, next) => {
  try {
    let query = requireSupabase().from("nodere_communication_templates").select("*").eq("workspace_id", getRequestWorkspaceId(req)).order("updated_at", { ascending: false });
    if (req.query.archived !== "true") query = query.is("archived_at", null);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data ?? []);
  } catch (error) {
    next(error);
  }
});

router.post("/templates", canEdit, async (req, res, next) => {
  try {
    const input = templateSchema.parse(req.body ?? {});
    const actor = sessionActor(req);
    const row = templateRow(input, getRequestWorkspaceId(req), actor.id);
    const { data, error } = await requireSupabase().from("nodere_communication_templates").insert(row).select("*").single();
    if (error) throw error;
    const { error: versionError } = await requireSupabase().from("communication_template_versions").insert({
      id: randomUUID(), workspace_id: getRequestWorkspaceId(req), template_id: data.id,
      version: 1, snapshot: data, change_reason: "Criação do modelo", created_by: actor.id
    });
    if (versionError) throw versionError;
    await audit(req, "communication.template.create", "communication_template", row.id, null, data);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

router.patch("/templates/:id", canEdit, async (req, res, next) => {
  try {
    const input = templateSchema.partial().parse(req.body ?? {});
    const actor = sessionActor(req);
    const workspaceId = getRequestWorkspaceId(req);
    const { data: current, error: currentError } = await requireSupabase().from("nodere_communication_templates").select("*").eq("workspace_id", workspaceId).eq("id", req.params.id).maybeSingle();
    if (currentError) throw currentError;
    if (!current) return res.status(404).json({ message: "Modelo não encontrado." });
    const nextVersion = Number(current.current_version || 1) + 1;
    const update: Record<string, unknown> = { updated_by: actor.id, current_version: nextVersion };
    if (input.name !== undefined) update.name = input.name;
    if (input.channel !== undefined) update.channel = input.channel;
    if (input.category !== undefined) update.category = input.category;
    if (input.subject !== undefined) update.subject = input.subject;
    if (input.bodyText !== undefined) update.body_text = input.bodyText;
    if (input.bodyHtml !== undefined) update.body_html = sanitizeCommunicationHtml(input.bodyHtml);
    if (input.signature !== undefined) update.signature = sanitizeCommunicationHtml(input.signature);
    if (input.active !== undefined) update.active = input.active;
    if (req.body?.archived === true) update.archived_at = new Date().toISOString();
    if (req.body?.archived === false) update.archived_at = null;
    const { data, error } = await requireSupabase().from("nodere_communication_templates").update(update).eq("workspace_id", workspaceId).eq("id", req.params.id).select("*").single();
    if (error) throw error;
    const { error: versionError } = await requireSupabase().from("communication_template_versions").insert({
      id: randomUUID(), workspace_id: workspaceId, template_id: current.id,
      version: nextVersion, snapshot: data, change_reason: String(req.body?.changeReason || "Atualização do modelo").slice(0, 500), created_by: actor.id
    });
    if (versionError) throw versionError;
    await audit(req, "communication.template.update", "communication_template", String(req.params.id), current, data);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get("/templates/:id/versions", async (req, res, next) => {
  try {
    const { data, error } = await requireSupabase().from("communication_template_versions").select("*").eq("workspace_id", getRequestWorkspaceId(req)).eq("template_id", req.params.id).order("version", { ascending: false });
    if (error) throw error;
    res.json(data ?? []);
  } catch (error) {
    next(error);
  }
});

router.post("/templates/:id/duplicate", canEdit, async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const actor = sessionActor(req);
    const { data: current, error } = await requireSupabase().from("nodere_communication_templates").select("*").eq("workspace_id", workspaceId).eq("id", req.params.id).maybeSingle();
    if (error) throw error;
    if (!current) return res.status(404).json({ message: "Modelo não encontrado." });
    const row = { ...current, id: randomUUID(), name: `${current.name} — cópia`, current_version: 1, archived_at: null, created_by: actor.id, updated_by: actor.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    const { data, error: insertError } = await requireSupabase().from("nodere_communication_templates").insert(row).select("*").single();
    if (insertError) throw insertError;
    const { error: versionError } = await requireSupabase().from("communication_template_versions").insert({ id: randomUUID(), workspace_id: workspaceId, template_id: data.id, version: 1, snapshot: data, change_reason: `Duplicado de ${current.id}`, created_by: actor.id });
    if (versionError) throw versionError;
    await audit(req, "communication.template.duplicate", "communication_template", data.id, current, data);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

router.get("/threads", async (req, res, next) => {
  try {
    const workspaceId = getRequestWorkspaceId(req);
    const companyId = String(req.query.companyId || "").trim();
    let query = requireSupabase()
      .from("communication_threads")
      .select("*, nodere_companies!communication_threads_company_id_fkey(id, name), company_contacts(id, name, email, whatsapp)")
      .eq("workspace_id", workspaceId)
      .order("last_event_at", { ascending: false, nullsFirst: false })
      .limit(500);
    if (companyId) query = query.eq("company_id", companyId);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data ?? []);
  } catch (error) {
    next(error);
  }
});

router.get("/threads/:id/events", async (req, res, next) => {
  try {
    const { data, error } = await requireSupabase().from("communication_events").select("*").eq("workspace_id", getRequestWorkspaceId(req)).eq("thread_id", req.params.id).order("occurred_at", { ascending: true }).limit(1_000);
    if (error) throw error;
    res.json(data ?? []);
  } catch (error) {
    next(error);
  }
});

router.post("/compose", canEdit, async (req, res, next) => {
  try {
    const input = composeSchema.parse(req.body ?? {});
    const workspaceId = getRequestWorkspaceId(req);
    const actor = sessionActor(req);
    const { data: replay, error: replayError } = await requireSupabase()
      .from("communication_outbox")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("idempotency_key", input.idempotencyKey)
      .maybeSingle();
    if (replayError) throw replayError;
    if (replay) return res.json({ ...replay, replayed: true, providerMode: replay.channel === "whatsapp" ? "assisted" : "smtp" });
    const sanitizedHtml = sanitizeCommunicationHtml(input.bodyHtml || "");
    const text = String(input.bodyText || stripHtml(sanitizedHtml)).trim();
    if (!text && !sanitizedHtml) return res.status(422).json({ message: "Escreva a mensagem antes de salvar." });
    let threadId = input.threadId || "";
    if (threadId) {
      const { data: thread, error } = await requireSupabase().from("communication_threads").select("id").eq("workspace_id", workspaceId).eq("id", threadId).maybeSingle();
      if (error) throw error;
      if (!thread) return res.status(404).json({ message: "Conversa não encontrada." });
    } else {
      threadId = randomUUID();
      const { error } = await requireSupabase().from("communication_threads").insert({
        id: threadId, workspace_id: workspaceId, company_id: input.companyId || null,
        contact_id: input.contactId || null, channel: input.channel, subject: input.subject || null,
        status: "pending", last_event_at: new Date().toISOString(), created_by: actor.id
      });
      if (error) throw error;
    }
    const payload = {
      recipient: input.channel === "whatsapp" ? normalizePhone(input.recipient) : input.recipient.trim().toLowerCase(),
      subject: input.subject || "",
      bodyText: text,
      bodyHtml: sanitizedHtml,
      attachmentRefs: input.attachmentRefs ?? [],
      consentConfirmed: input.consentConfirmed,
      consentConfirmedAt: new Date().toISOString(),
      consentConfirmedBy: actor.id
    };
    const outbox = {
      id: randomUUID(), workspace_id: workspaceId, thread_id: threadId,
      company_id: input.companyId || null, contact_id: input.contactId || null,
      channel: input.channel, idempotency_key: input.idempotencyKey,
      payload, status: "draft", created_by: actor.id
    };
    const { data, error } = await requireSupabase().from("communication_outbox").upsert(outbox, { onConflict: "workspace_id,idempotency_key", ignoreDuplicates: true }).select("*").single();
    if (error) throw error;
    await appendEvent({
      workspaceId, threadId, companyId: input.companyId, contactId: input.contactId,
      eventType: "draft_created", direction: "outbound", status: "draft",
      subject: payload.subject, bodyText: payload.bodyText, bodyHtml: payload.bodyHtml,
      attachmentRefs: payload.attachmentRefs, actorId: actor.id,
      metadata: { outboxId: data.id, assisted: input.channel === "whatsapp" }
    });
    await audit(req, "communication.compose", "communication_outbox", data.id, null, { ...data, payload: { ...payload, bodyHtml: "[sanitized]" } });
    res.status(201).json({ ...data, providerMode: input.channel === "whatsapp" ? "assisted" : "smtp" });
  } catch (error) {
    next(error);
  }
});

router.post("/outbox/:id/approve", canEdit, async (req, res, next) => {
  try {
    const confirmation = z.object({ confirmed: z.literal(true) }).parse(req.body ?? {});
    void confirmation;
    const workspaceId = getRequestWorkspaceId(req);
    const actor = sessionActor(req);
    const { data: item, error } = await requireSupabase().from("communication_outbox").select("*").eq("workspace_id", workspaceId).eq("id", req.params.id).maybeSingle();
    if (error) throw error;
    if (!item) return res.status(404).json({ message: "Mensagem da outbox não encontrada." });
    if (!["draft", "failed"].includes(item.status)) return res.status(409).json({ message: `Mensagem já está no estado ${item.status}.`, item });
    if (Number(item.attempt_count || 0) >= 5) return res.status(409).json({ code: "OUTBOX_RETRY_LIMIT", message: "O limite de cinco tentativas foi atingido. Revise a mensagem e o provedor." });
    if (item.next_attempt_at && new Date(item.next_attempt_at).getTime() > Date.now()) return res.status(409).json({ code: "OUTBOX_BACKOFF", message: "A nova tentativa está em período de espera.", retryAt: item.next_attempt_at });
    const payload = asRecord(item.payload);
    if (payload.consentConfirmed !== true) return res.status(422).json({ code: "COMMUNICATION_CONSENT_REQUIRED", message: "Consentimento ou base de contato não confirmado." });
    const unresolvedVariables = Array.from(new Set(`${String(payload.subject || "")} ${String(payload.bodyText || "")} ${String(payload.bodyHtml || "")}`.match(/\{\{\s*[a-zA-Z0-9_.-]+\s*\}\}/g) || []));
    if (unresolvedVariables.length) return res.status(422).json({ code: "UNRESOLVED_TEMPLATE_VARIABLES", message: "Resolva as variáveis obrigatórias antes do envio.", variables: unresolvedVariables });
    if (isQuietHours()) return res.status(409).json({ code: "COMMUNICATION_QUIET_HOURS", message: "Envio bloqueado fora do horário comercial configurado (08h–20h, America/Sao_Paulo). O rascunho foi preservado." });
    if (item.channel === "whatsapp") {
      const url = `https://wa.me/${normalizePhone(String(payload.recipient || ""))}?text=${encodeURIComponent(String(payload.bodyText || ""))}`;
      const { data, error: updateError } = await requireSupabase().from("communication_outbox").update({
        status: "pending", approved_by: actor.id, approved_at: new Date().toISOString(), last_error: null
      }).eq("workspace_id", workspaceId).eq("id", item.id).select("*").single();
      if (updateError) throw updateError;
      await appendEvent({ workspaceId, threadId: item.thread_id, companyId: item.company_id, contactId: item.contact_id, eventType: "assisted_open_requested", direction: "outbound", status: "pending_confirmation", subject: String(payload.subject || ""), bodyText: String(payload.bodyText || ""), bodyHtml: String(payload.bodyHtml || ""), attachmentRefs: arrayOfStrings(payload.attachmentRefs), actorId: actor.id, metadata: { outboxId: item.id, mode: "assisted" } });
      return res.json({ item: data, mode: "assisted", url, message: "Abra o WhatsApp e confirme o envio manualmente depois." });
    }
    const transport = createSmtpTransport();
    if (!transport) return res.status(409).json({ code: "EMAIL_PROVIDER_NOT_CONFIGURED", message: "SMTP/Gmail ainda não está configurado. O rascunho foi preservado." });
    const attachments = await resolveEmailAttachments(workspaceId, arrayOfStrings(payload.attachmentRefs));
    const { data: processing, error: processingError } = await requireSupabase().from("communication_outbox").update({ status: "processing", approved_by: actor.id, approved_at: new Date().toISOString(), attempt_count: Number(item.attempt_count || 0) + 1 }).eq("workspace_id", workspaceId).eq("id", item.id).eq("status", item.status).select("*").maybeSingle();
    if (processingError) throw processingError;
    if (!processing) return res.status(409).json({ message: "A mensagem já foi processada em outra sessão." });
    try {
      const sent = await transport.sendMail({
        from: `"NODERE" <${config.smtp.from || config.smtp.user}>`,
        to: String(payload.recipient || ""),
        subject: String(payload.subject || "Mensagem NODERE"),
        text: String(payload.bodyText || ""),
        html: sanitizeCommunicationHtml(String(payload.bodyHtml || "")) || undefined,
        attachments
      });
      const providerMessageId = String(sent.messageId || "");
      const { data, error: updateError } = await requireSupabase().from("communication_outbox").update({ status: "sent", provider_message_id: providerMessageId, last_error: null, next_attempt_at: null }).eq("workspace_id", workspaceId).eq("id", item.id).select("*").single();
      if (updateError) throw updateError;
      await appendEvent({ workspaceId, threadId: item.thread_id, companyId: item.company_id, contactId: item.contact_id, eventType: "message_sent", direction: "outbound", status: "sent", subject: String(payload.subject || ""), bodyText: String(payload.bodyText || ""), bodyHtml: String(payload.bodyHtml || ""), attachmentRefs: arrayOfStrings(payload.attachmentRefs), actorId: actor.id, providerMessageId, metadata: { outboxId: item.id } });
      await requireSupabase().from("communication_threads").update({ status: "open", last_event_at: new Date().toISOString() }).eq("workspace_id", workspaceId).eq("id", item.thread_id);
      return res.json({ item: data, mode: "smtp" });
    } catch (sendError) {
      const reason = sendError instanceof Error ? sendError.message.slice(0, 500) : "Falha no provedor de e-mail.";
      const attempts = Number(item.attempt_count || 0) + 1;
      const retryAt = new Date(Date.now() + Math.min(60, 2 ** attempts) * 60 * 1000).toISOString();
      await requireSupabase().from("communication_outbox").update({ status: "failed", last_error: reason, next_attempt_at: retryAt }).eq("workspace_id", workspaceId).eq("id", item.id);
      await appendEvent({ workspaceId, threadId: item.thread_id, companyId: item.company_id, contactId: item.contact_id, eventType: "message_failed", direction: "outbound", status: "failed", subject: String(payload.subject || ""), bodyText: String(payload.bodyText || ""), bodyHtml: "", attachmentRefs: [], actorId: actor.id, metadata: { outboxId: item.id, reason } });
      throw httpError(502, "O provedor recusou o envio. O conteúdo foi preservado para nova tentativa.");
    }
  } catch (error) {
    next(error);
  }
});

router.post("/outbox/:id/confirm-assisted", canEdit, async (req, res, next) => {
  try {
    const input = z.object({ sent: z.boolean(), note: z.string().max(500).optional() }).parse(req.body ?? {});
    const workspaceId = getRequestWorkspaceId(req);
    const actor = sessionActor(req);
    const { data: item, error } = await requireSupabase().from("communication_outbox").select("*").eq("workspace_id", workspaceId).eq("id", req.params.id).eq("channel", "whatsapp").maybeSingle();
    if (error) throw error;
    if (!item) return res.status(404).json({ message: "Mensagem assistida não encontrada." });
    const payload = asRecord(item.payload);
    const status = input.sent ? "sent" : "cancelled";
    const { data, error: updateError } = await requireSupabase().from("communication_outbox").update({ status, last_error: input.note || null }).eq("workspace_id", workspaceId).eq("id", item.id).select("*").single();
    if (updateError) throw updateError;
    await appendEvent({ workspaceId, threadId: item.thread_id, companyId: item.company_id, contactId: item.contact_id, eventType: input.sent ? "assisted_send_confirmed" : "assisted_send_cancelled", direction: "outbound", status, subject: String(payload.subject || ""), bodyText: String(payload.bodyText || ""), bodyHtml: String(payload.bodyHtml || ""), attachmentRefs: arrayOfStrings(payload.attachmentRefs), actorId: actor.id, metadata: { outboxId: item.id, note: input.note || "" } });
    await audit(req, input.sent ? "communication.assisted.confirm" : "communication.assisted.cancel", "communication_outbox", item.id, item, data, input.note);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

function templateRow(input: z.infer<typeof templateSchema>, workspaceId: string, actorId: string) {
  return {
    id: randomUUID(), workspace_id: workspaceId, name: input.name, channel: input.channel,
    category: input.category || null, subject: input.subject || null,
    body_text: input.bodyText || "", body_html: sanitizeCommunicationHtml(input.bodyHtml || ""),
    signature: input.signature ? sanitizeCommunicationHtml(input.signature) : null, active: input.active ?? true,
    created_by: actorId, updated_by: actorId
  };
}

export function sanitizeCommunicationHtml(value: string) {
  return sanitizeHtml(value, {
    allowedTags: ["p", "br", "strong", "em", "u", "s", "blockquote", "ul", "ol", "li", "h1", "h2", "h3", "h4", "span", "a", "hr"],
    allowedAttributes: { a: ["href", "target", "rel"], span: ["style"], p: ["style"], h1: ["style"], h2: ["style"], h3: ["style"] },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedStyles: {
      "*": {
        color: [/^#[0-9a-f]{3,6}$/i, /^rgb\([0-9, ]+\)$/i],
        "background-color": [/^#[0-9a-f]{3,6}$/i, /^rgb\([0-9, ]+\)$/i],
        "text-align": [/^(left|right|center|justify)$/],
        "font-size": [/^(10|12|14|16|18|20|24|28|32|40|48)px$/],
        "font-family": [/^[a-zA-Z0-9 ,'-]{1,80}$/]
      }
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer nofollow" })
    }
  });
}

async function appendEvent(input: {
  workspaceId: string; threadId: string; companyId?: string | null; contactId?: string | null;
  eventType: string; direction: "inbound" | "outbound" | "internal"; status: string;
  subject: string; bodyText: string; bodyHtml: string; attachmentRefs: string[];
  actorId: string; providerMessageId?: string; metadata?: Record<string, unknown>;
}) {
  const { error } = await requireSupabase().from("communication_events").insert({
    id: randomUUID(), workspace_id: input.workspaceId, thread_id: input.threadId,
    company_id: input.companyId || null, contact_id: input.contactId || null,
    event_type: input.eventType, direction: input.direction, status: input.status,
    subject: input.subject || null, body_text: input.bodyText,
    body_html: sanitizeCommunicationHtml(input.bodyHtml), attachment_refs: input.attachmentRefs,
    provider_message_id: input.providerMessageId || null, metadata: input.metadata || {}, actor_id: input.actorId
  });
  if (error) throw error;
  await emitDomainEvent({
    workspaceId: input.workspaceId,
    aggregateType: input.companyId ? "lead" : "communication_thread",
    aggregateId: input.companyId || input.threadId,
    eventType: `communication.${input.eventType}`,
    actorId: input.actorId,
    payload: { threadId: input.threadId, contactId: input.contactId || null, channel: input.metadata?.channel || null, direction: input.direction, status: input.status, providerMessageId: input.providerMessageId || null }
  });
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
  if (!client) throw httpError(503, "Supabase não configurado para comunicações.");
  return client;
}

function sessionActor(req: any) {
  const session = req.session || {};
  return { id: String(session.userId || session.email || "unknown"), role: String(session.role || "viewer") };
}

function normalizePhone(value: string) {
  const digits = String(value || "").replace(/\D/g, "");
  if ((digits.length === 10 || digits.length === 11) && !digits.startsWith("55")) return `55${digits}`;
  return digits;
}

function isQuietHours(now = new Date()) {
  const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", hour: "2-digit", hour12: false }).format(now));
  return hour < 8 || hour >= 20;
}

function stripHtml(value: string) {
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, " ").trim();
}

function asRecord(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, any> : {};
}

function arrayOfStrings(value: unknown) {
  return Array.isArray(value) ? value.map(String).filter(Boolean).slice(0, MAX_ATTACHMENT_COUNT) : [];
}

export function parseAttachmentRef(value: string) {
  const match = /^(briefing|company-file):([a-zA-Z0-9-]{8,})$/.exec(String(value || "").trim());
  return match ? { source: match[1] as "briefing" | "company-file", id: match[2] } : null;
}

export async function resolveEmailAttachments(workspaceId: string, refs: string[]) {
  const uniqueRefs = [...new Set(refs)];
  if (uniqueRefs.length > MAX_ATTACHMENT_COUNT) throw httpError(422, `Selecione no máximo ${MAX_ATTACHMENT_COUNT} anexos.`);
  const parsed = uniqueRefs.map(parseAttachmentRef);
  if (parsed.some((item) => !item)) throw httpError(422, "Referência de anexo inválida. Selecione novamente o arquivo no NODERE.");
  if (!parsed.length) return [];
  const sb = requireSupabase();
  const briefingIds = parsed.filter((item) => item?.source === "briefing").map((item) => item!.id);
  const companyFileIds = parsed.filter((item) => item?.source === "company-file").map((item) => item!.id);
  const resolved = new Map<string, { ref: string; bucket: string; path: string; filename: string; mimeType: string; expectedSize: number }>();
  if (briefingIds.length) {
    const result = await sb.from("commercial_briefing_attachments").select("id,storage_bucket,storage_path,original_name,mime_type,size_bytes").eq("workspace_id", workspaceId).in("id", briefingIds).is("deleted_at", null);
    if (result.error) throw result.error;
    for (const item of result.data ?? []) resolved.set(`briefing:${item.id}`, { ref: `briefing:${item.id}`, bucket: item.storage_bucket, path: item.storage_path, filename: item.original_name, mimeType: item.mime_type, expectedSize: Number(item.size_bytes || 0) });
  }
  if (companyFileIds.length) {
    const result = await sb.from("company_files").select("id,storage_path,filename,file_type,file_size").eq("workspace_id", workspaceId).in("id", companyFileIds);
    if (result.error) throw result.error;
    for (const item of result.data ?? []) resolved.set(`company-file:${item.id}`, { ref: `company-file:${item.id}`, bucket: "client-files", path: item.storage_path, filename: item.filename, mimeType: item.file_type || "application/octet-stream", expectedSize: Number(item.file_size || 0) });
  }
  if (resolved.size !== uniqueRefs.length) throw httpError(404, "Um ou mais anexos não existem neste workspace. O envio foi bloqueado.");
  let totalBytes = 0;
  const attachments = [];
  for (const ref of uniqueRefs) {
    const item = resolved.get(ref)!;
    if (!item.path.startsWith(`${workspaceId}/`)) throw httpError(403, "O caminho de um anexo não pertence a este workspace.");
    if (!allowedEmailAttachmentTypes.has(item.mimeType)) throw httpError(415, `O tipo ${item.mimeType} não é permitido em e-mails.`);
    if (item.expectedSize > MAX_ATTACHMENT_BYTES) throw httpError(413, "Um anexo excede o limite total de 20 MB.");
    const downloaded = await sb.storage.from(item.bucket).download(item.path);
    if (downloaded.error || !downloaded.data) throw httpError(502, `Não foi possível carregar o anexo ${safeAttachmentName(item.filename)}.`);
    const content = Buffer.from(await downloaded.data.arrayBuffer());
    totalBytes += content.length;
    if (totalBytes > MAX_ATTACHMENT_BYTES) throw httpError(413, "Os anexos excedem o limite total de 20 MB.");
    attachments.push({ filename: safeAttachmentName(item.filename), content, contentType: item.mimeType });
  }
  return attachments;
}

function safeAttachmentName(value: string) {
  return String(value || "anexo").replace(/[\r\n\"\\/]+/g, "-").replace(/[^\p{L}\p{N}._() -]/gu, "-").slice(0, 180) || "anexo";
}

function httpError(status: number, message: string) {
  const error = new Error(message) as Error & { status?: number };
  error.status = status;
  return error;
}

export default router;
