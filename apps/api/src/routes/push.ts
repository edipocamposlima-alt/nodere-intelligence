import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getRequestWorkspaceId, requireWorkspaceSession } from "../middleware/session.js";
import { getSupabase } from "../db/supabase.js";
import { getVapidPublicKey } from "../services/pushService.js";

const router = Router();

router.get("/status", (_req, res) => {
  const available = Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
  res.json({
    available,
    status: available ? "available" : "not_configured",
    message: available
      ? "Notificações push disponíveis."
      : "Notificações push indisponíveis no momento. Configure VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY para ativar envio real."
  });
});

router.get("/vapid-public-key", (_req, res) => {
  const publicKey = getVapidPublicKey();
  if (!publicKey) return res.status(503).json({ error: "Push not configured" });
  return res.json({ publicKey });
});

router.post("/subscribe", requireWorkspaceSession, async (req, res, next) => {
  try {
    const body = z.object({
      endpoint: z.string().url(),
      keys: z.object({ p256dh: z.string(), auth: z.string() })
    }).parse(req.body);
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ status: "not_configured", message: "Supabase não configurado para salvar push subscriptions." });
    const session = (req as any).session;
    const { error } = await sb.from("push_subscriptions").upsert({
      id: randomUUID(),
      workspace_id: getRequestWorkspaceId(req),
      user_id: session.userId || session.email,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      created_at: new Date().toISOString()
    }, { onConflict: "endpoint" });
    if (error) throw error;
    res.json({
      status: process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY ? "enabled" : "not_configured",
      message: process.env.VAPID_PUBLIC_KEY ? "Notificações habilitadas." : "Subscription salva; configure VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY para envio real."
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/unsubscribe", requireWorkspaceSession, async (req, res, next) => {
  try {
    const endpoint = typeof req.body?.endpoint === "string" ? req.body.endpoint : "";
    const sb = getSupabase();
    if (sb && endpoint) await sb.from("push_subscriptions").delete().eq("endpoint", endpoint);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
