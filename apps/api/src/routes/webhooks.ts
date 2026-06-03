import { Router } from "express";
import { config } from "../config.js";
import { addInboundMessage, parseStatusUpdate, parseWebhookPayload, updateMessageStatus } from "../services/inbox.js";

const router = Router();

router.get("/whatsapp", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === config.webhookSecret) return res.status(200).send(challenge);
  return res.sendStatus(403);
});

router.post("/whatsapp", (req, res) => {
  for (const { phone, messageId, text } of parseWebhookPayload(req.body)) {
    addInboundMessage(phone, text, messageId);
  }
  for (const { messageId, status } of parseStatusUpdate(req.body)) {
    updateMessageStatus(messageId, status);
  }
  res.sendStatus(200);
});

export default router;
