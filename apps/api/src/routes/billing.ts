import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { getBillingStatus, getPlans, createCheckoutSession, createPortalSession, handleStripeWebhook, getUsageLog, getPlanLinks, saveBillingWaitlist } from "../services/billing.js";
import { getRequestWorkspaceId } from "../middleware/session.js";
import { config } from "../config.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    res.json(await getBillingStatus(getRequestWorkspaceId(req)));
  } catch (error) {
    next(error);
  }
});

router.get("/plans", (_req, res) => {
  res.json(getPlans());
});

router.get("/plan-links", (_req, res) => {
  res.json(getPlanLinks());
});

router.get("/usage", (req, res) => {
  const limit = Math.min(500, Number(req.query.limit ?? 100));
  res.json(getUsageLog(limit));
});

const waitlistSchema = z.object({
  email: z.string().email("E-mail inválido"),
  plan: z.enum(["starter", "pro", "agency"]).optional()
});

router.post("/waitlist", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = waitlistSchema.parse(req.body);
    const item = await saveBillingWaitlist({
      email: payload.email,
      plan: payload.plan,
      workspaceId: getRequestWorkspaceId(req)
    });
    res.status(201).json({ ok: true, item });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: err.issues[0]?.message || "Dados inválidos" });
    next(err);
  }
});

router.post("/checkout", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = (req as any).session;
    const workspaceId = session?.workspaceId;
    if (!workspaceId) return res.status(401).json({ message: "Login com workspace obrigatório para iniciar checkout." });
    const body = checkoutSchema.parse(req.body ?? {});
    const url = await createCheckoutSession({
      planId: body.plan,
      billingCycle: body.billingCycle,
      workspaceId,
      customerId: body.customerId
    });
    res.json({ url });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: err.issues[0]?.message || "Dados inválidos" });
    const msg = err instanceof Error ? err.message : "";
    if (msg === "Plano não disponível para checkout" || msg === "Stripe não configurado") {
      return res.status(400).json({ message: msg });
    }
    next(err);
  }
});

const checkoutSchema = z.object({
  plan: z.enum(["starter", "pro", "agency"]).optional(),
  planId: z.enum(["starter", "pro", "agency"]).optional(),
  billingCycle: z.enum(["monthly", "yearly"]).default("monthly"),
  customerId: z.string().optional()
}).transform((input, ctx) => {
  const plan = input.plan || input.planId;
  if (!plan) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "plan obrigatório" });
    return z.NEVER;
  }
  return { ...input, plan };
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
  if (!config.stripe.secretKey || !config.stripe.webhookSecret) return res.json({ received: true, type: "stripe_not_configured" });
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
