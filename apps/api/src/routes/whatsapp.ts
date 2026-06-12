import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { config } from "../config.js";
import { getSupabase } from "../db/supabase.js";
import { getRequestWorkspaceId, requireWorkspaceSession } from "../middleware/session.js";
import { getCompanyAsync } from "../services/companyStore.js";
import { sendWhatsappMessage } from "../services/whatsapp.js";

const router = Router();

router.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === (process.env.WHATSAPP_VERIFY_TOKEN || config.webhookSecret)) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

router.post("/webhook", async (req, res) => {
  res.sendStatus(200);
  try {
    const entry = req.body?.entry?.[0];
    const value = entry?.changes?.[0]?.value;
    const messages = Array.isArray(value?.messages) ? value.messages : [];
    const phoneNumberId = value?.metadata?.phone_number_id;
    if (!messages.length || !phoneNumberId) return;

    const sb = getSupabase();
    if (!sb) return;
    const { data: setting } = await sb
      .from("nodere_workspace_settings")
      .select("workspace_id")
      .eq("key", "whatsapp_phone_id")
      .eq("value", phoneNumberId)
      .maybeSingle();
    const workspaceId = String(setting?.workspace_id || "default");

    for (const msg of messages) {
      if (msg.type !== "text") continue;
      const phone = String(msg.from || "");
      const body = String(msg.text?.body || "");
      const wamid = String(msg.id || randomUUID());
      const conversation = await findOrCreateConversation(workspaceId, phone, value.contacts?.[0]?.profile?.name || phone);
      await sb.from("whatsapp_messages").upsert({
        workspace_id: workspaceId,
        conversation_id: conversation.id,
        wamid,
        direction: "inbound",
        body,
        status: "read",
        metadata: { webhook: true }
      }, { onConflict: "wamid" });
      try {
        await sb.rpc("increment_unread", { conv_id: conversation.id });
      } catch {
        // Se a função SQL ainda não foi aplicada, o webhook continua estável.
      }
      await sb.from("whatsapp_conversations").update({ last_message_at: new Date().toISOString() }).eq("id", conversation.id);
    }
  } catch (error) {
    console.error("[whatsapp/webhook]", error instanceof Error ? error.message : error);
  }
});

router.use(requireWorkspaceSession);

router.get("/conversations", async (req, res, next) => {
  try {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from("whatsapp_conversations")
      .select("*")
      .eq("workspace_id", getRequestWorkspaceId(req))
      .order("last_message_at", { ascending: false });
    if (error) throw error;
    return res.json(data ?? []);
  } catch (error) {
    return next(error);
  }
});

router.get("/conversations/:id/messages", async (req, res, next) => {
  try {
    const sb = requireSupabase();
    const workspaceId = getRequestWorkspaceId(req);
    const { data, error } = await sb
      .from("whatsapp_messages")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("conversation_id", req.params.id)
      .order("created_at", { ascending: true });
    if (error) throw error;
    await sb.from("whatsapp_conversations").update({ unread_count: 0 }).eq("workspace_id", workspaceId).eq("id", req.params.id);
    return res.json(data ?? []);
  } catch (error) {
    return next(error);
  }
});

router.post("/send", async (req, res, next) => {
  try {
    const body = z.object({
      conversation_id: z.string().optional(),
      company_id: z.string().optional(),
      phone: z.string().optional(),
      body: z.string().min(1)
    }).parse(req.body);
    const workspaceId = getRequestWorkspaceId(req);
    let phone = body.phone || "";
    let company = body.company_id ? await getCompanyAsync(body.company_id, workspaceId) : null;

    if (body.conversation_id) {
      const { data } = await requireSupabase()
        .from("whatsapp_conversations")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("id", body.conversation_id)
        .maybeSingle();
      phone = phone || String(data?.contact_phone || "");
      if (!company && data?.company_id) company = await getCompanyAsync(String(data.company_id), workspaceId);
    }

    const fakeCompany = company || ({ id: "direct", name: "Contato", whatsapp: phone, phone } as any);
    const result = await sendWhatsappMessage(fakeCompany, body.body);
    const conversation = await findOrCreateConversation(workspaceId, phone || fakeCompany.whatsapp || fakeCompany.phone, fakeCompany.name);
    const wamid = (result as any).response?.messages?.[0]?.id || null;
    await requireSupabase().from("whatsapp_messages").insert({
      workspace_id: workspaceId,
      conversation_id: conversation.id,
      wamid,
      direction: "outbound",
      body: body.body,
      status: (result as any).sent ? "sent" : "failed",
      sent_by: (req as any).session?.userId || null,
      metadata: { result }
    });
    await requireSupabase().from("whatsapp_conversations").update({ last_message_at: new Date().toISOString() }).eq("id", conversation.id);
    return res.json({ conversation_id: conversation.id, message: "Mensagem processada.", whatsapp: result });
  } catch (error) {
    return next(error);
  }
});

async function findOrCreateConversation(workspaceId: string, phone: string, contactName?: string) {
  const sb = requireSupabase();
  const cleanPhone = String(phone || "").replace(/\D/g, "");
  let { data, error } = await sb
    .from("whatsapp_conversations")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("contact_phone", cleanPhone)
    .maybeSingle();
  if (error) throw error;
  if (data) return data;
  const inserted = await sb.from("whatsapp_conversations").insert({
    workspace_id: workspaceId,
    contact_phone: cleanPhone,
    contact_name: contactName || cleanPhone,
    last_message_at: new Date().toISOString()
  }).select("*").single();
  if (inserted.error) throw inserted.error;
  return inserted.data;
}

function requireSupabase() {
  const sb = getSupabase();
  if (!sb) {
    const error = new Error("Supabase não configurado para WhatsApp Inbox.") as Error & { status?: number };
    error.status = 503;
    throw error;
  }
  return sb;
}

export default router;
