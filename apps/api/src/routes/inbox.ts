import { Router } from "express";
import { z } from "zod";
import { config } from "../config.js";
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

router.get("/", (_req, res) => {
  const convs = listConversations().map((conv) => ({
    ...conv,
    slaStatus: getSlaStatus(conv),
    messageCount: conv.messages.length,
    lastMessage: conv.messages.at(-1) ?? null
  }));
  res.json(convs);
});

router.post("/", (req, res, next) => {
  try {
    const body = z.object({
      phone: z.string().min(6),
      message: z.string().min(1),
      companyId: z.string().optional(),
      companyName: z.string().optional()
    }).parse(req.body);
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

router.get("/:phone", (req, res) => {
  const conv = getConversation(req.params.phone);
  if (!conv) return res.status(404).json({ message: "Conversation not found" });
  return res.json({ ...conv, slaStatus: getSlaStatus(conv) });
});

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
