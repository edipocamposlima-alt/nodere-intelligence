import { Router } from "express";
import { config } from "../config.js";
import { getSupabase } from "../db/supabase.js";
import { addInboundMessage, buildInboxRow, parseStatusUpdate, parseWebhookPayload, updateMessageStatus } from "../services/inbox.js";

const router = Router();

router.get("/whatsapp", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === config.webhookSecret) return res.status(200).send(challenge);
  return res.sendStatus(403);
});

router.post("/whatsapp", async (req, res) => {
  const sb = getSupabase();
  for (const { phone, messageId, text } of parseWebhookPayload(req.body)) {
    addInboundMessage(phone, text, messageId);
    if (sb) {
      const company = await findCompanyByPhone(phone).catch(() => null);
      const row = buildInboxRow({
        workspaceId: String(company?.workspace_id || "default"),
        companyId: company?.id ? String(company.id) : null,
        type: "whatsapp",
        direction: "inbound",
        status: "unread",
        subject: "WhatsApp recebido",
        body: text,
        phoneFrom: phone,
        providerMessageId: messageId,
        companyName: company?.name ? String(company.name) : null,
        metadata: { source: "whatsapp_webhook" }
      });
      await sb.from("inbox_messages").insert(row);
      if (company?.id) {
        await sb.from("communications").insert({
          workspace_id: String(company.workspace_id || "default"),
          company_id: String(company.id),
          type: "whatsapp",
          direction: "inbound",
          subject: "WhatsApp recebido",
          body: text,
          sent_at: new Date().toISOString(),
          status: "delivered",
          metadata: { providerMessageId: messageId, source: "whatsapp_webhook" }
        });
      }
    }
  }
  for (const { messageId, status } of parseStatusUpdate(req.body)) {
    updateMessageStatus(messageId, status);
    if (sb) {
      await sb
        .from("inbox_messages")
        .update({ metadata: { providerMessageId: messageId, providerStatus: status, updatedByWebhookAt: new Date().toISOString() } })
        .filter("metadata->>providerMessageId", "eq", messageId);
    }
  }
  res.sendStatus(200);
});

export default router;

async function findCompanyByPhone(phone: string) {
  const sb = getSupabase();
  if (!sb) return null;
  const digits = phone.replace(/\D/g, "");
  const variants = [phone, digits, `+${digits}`].filter(Boolean);
  for (const candidate of variants) {
    const { data } = await sb
      .from("nodere_companies")
      .select("id, workspace_id, name, phone, whatsapp")
      .or(`phone.eq.${candidate},whatsapp.eq.${candidate}`)
      .limit(1)
      .maybeSingle();
    if (data) return data;
  }
  return null;
}
