import { Router, Request, Response, NextFunction } from "express";
import { getBillingStatus, getPlans, createCheckoutSession, createPortalSession, handleStripeWebhook, getUsageLog } from "../services/billing.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json(getBillingStatus());
});

router.get("/plans", (_req, res) => {
  res.json(getPlans());
});

router.get("/usage", (req, res) => {
  const limit = Math.min(500, Number(req.query.limit ?? 100));
  res.json(getUsageLog(limit));
});

router.post("/checkout", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { planId, customerId } = req.body;
    const url = await createCheckoutSession(planId, customerId);
    res.json({ url });
  } catch (err) {
    next(err);
  }
});

router.post("/portal", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customerId } = req.body;
    if (!customerId) return res.status(400).json({ message: "customerId obrigatório" });
    const url = await createPortalSession(customerId);
    res.json({ url });
  } catch (err) {
    next(err);
  }
});

export async function stripeWebhookHandler(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"];
  if (!sig) return res.status(400).json({ message: "Assinatura Stripe ausente" });
  try {
    const eventType = await handleStripeWebhook(req.body as Buffer, sig as string);
    res.json({ received: true, type: eventType });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro no webhook";
    res.status(400).json({ message });
  }
}

export default router;
