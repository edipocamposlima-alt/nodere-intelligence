import Stripe from "stripe";
import { randomUUID } from "node:crypto";
import { Plan, PlanId, BillingStatus, UsageEvent, UsageEventType } from "../types.js";
import { config } from "../config.js";
import { appendAuditLog } from "./auditLog.js";

export const PLANS: Plan[] = [
  {
    id: "demo",
    name: "Demo",
    monthlyCredits: 200,
    priceMonthly: 0,
    features: ["200 créditos/mês", "Busca Google Places", "Score de oportunidade", "CRM básico"]
  },
  {
    id: "starter",
    name: "Starter",
    monthlyCredits: 1000,
    priceMonthly: 9700,
    stripePriceId: config.stripe.prices.starter,
    features: ["1.000 créditos/mês", "Diagnóstico IA", "Export PDF", "WhatsApp templates", "Suporte por email"]
  },
  {
    id: "pro",
    name: "Pro",
    monthlyCredits: 5000,
    priceMonthly: 29700,
    stripePriceId: config.stripe.prices.pro,
    features: ["5.000 créditos/mês", "Sequências de email", "Caixa de entrada", "Google Ads Intelligence", "Relatórios de receita"]
  },
  {
    id: "agency",
    name: "Agency",
    monthlyCredits: 20000,
    priceMonthly: 79700,
    stripePriceId: config.stripe.prices.agency,
    features: ["20.000 créditos/mês", "Multi-operadores", "Ranking & metas", "Audit log completo", "Suporte dedicado"]
  }
];

const usageLog: UsageEvent[] = [];

let billingState: {
  planId: PlanId;
  balance: number;
  used: number;
  resetAt: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: string;
} = {
  planId: "demo",
  balance: 200,
  used: 0,
  resetAt: nextResetDate()
};

function nextResetDate() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1, 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function getPlans(): Plan[] {
  return PLANS;
}

export function getBillingStatus(): BillingStatus {
  const plan = PLANS.find((p) => p.id === billingState.planId) ?? PLANS[0];
  return {
    plan,
    balance: billingState.balance,
    used: billingState.used,
    resetAt: billingState.resetAt,
    stripeCustomerId: billingState.stripeCustomerId,
    stripeSubscriptionId: billingState.stripeSubscriptionId,
    subscriptionStatus: billingState.subscriptionStatus,
    gated: billingState.balance <= 0
  };
}

export function recordUsage(type: UsageEventType, amount: number, description: string, operatorId?: string) {
  const event: UsageEvent = { id: randomUUID(), type, amount, description, operatorId, at: new Date().toISOString() };
  usageLog.unshift(event);
  billingState.used += amount;
  billingState.balance = Math.max(0, billingState.balance - amount);
  if (usageLog.length > 5000) usageLog.pop();
  return event;
}

export function getUsageLog(limit = 200) {
  return usageLog.slice(0, limit);
}

export async function createCheckoutSession(planId: PlanId, customerId?: string): Promise<string> {
  const plan = PLANS.find((p) => p.id === planId);
  if (!plan?.stripePriceId) throw new Error("Plano não disponível para checkout");
  if (!config.stripe.secretKey) throw new Error("Stripe não configurado");

  const stripe = new Stripe(config.stripe.secretKey);
  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    success_url: config.stripe.successUrl,
    cancel_url: config.stripe.cancelUrl
  };
  if (customerId) params.customer = customerId;

  const session = await stripe.checkout.sessions.create(params);
  appendAuditLog("billing", "checkout_started", `Checkout iniciado para plano ${plan.name}`, { metadata: { planId } });
  return session.url!;
}

export async function createPortalSession(customerId: string): Promise<string> {
  if (!config.stripe.secretKey) throw new Error("Stripe não configurado");
  const stripe = new Stripe(config.stripe.secretKey);
  const session = await stripe.billingPortal.sessions.create({ customer: customerId, return_url: config.stripe.successUrl });
  return session.url;
}

export async function handleStripeWebhook(rawBody: Buffer, signature: string) {
  if (!config.stripe.secretKey || !config.stripe.webhookSecret) throw new Error("Stripe não configurado");
  const stripe = new Stripe(config.stripe.secretKey);
  const event = stripe.webhooks.constructEvent(rawBody, signature, config.stripe.webhookSecret);

  if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;
    const priceId = sub.items.data[0]?.price.id;
    const plan = PLANS.find((p) => p.stripePriceId === priceId) ?? PLANS[0];
    const periodEnd: number | undefined = (sub as any).current_period_end;
    billingState = {
      planId: plan.id,
      balance: sub.status === "active" ? plan.monthlyCredits : billingState.balance,
      used: sub.status === "active" ? 0 : billingState.used,
      resetAt: periodEnd ? new Date(periodEnd * 1000).toISOString() : nextResetDate(),
      stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
      stripeSubscriptionId: sub.id,
      subscriptionStatus: sub.status
    };
    appendAuditLog("billing", `subscription_${event.type.split(".")[2]}`, `Assinatura ${plan.name} — ${sub.status}`, {
      metadata: { planId: plan.id, subscriptionId: sub.id }
    });
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    billingState = { planId: "demo", balance: PLANS[0].monthlyCredits, used: 0, resetAt: nextResetDate(), subscriptionStatus: "canceled" };
    appendAuditLog("billing", "subscription_canceled", "Assinatura cancelada, voltando ao plano Demo", { metadata: { subscriptionId: sub.id } });
  }

  return event.type;
}
