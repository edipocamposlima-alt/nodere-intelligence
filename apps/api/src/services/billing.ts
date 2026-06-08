import Stripe from "stripe";
import { randomUUID } from "node:crypto";
import { Plan, PlanId, BillingStatus, UsageEvent, UsageEventType } from "../types.js";
import { config } from "../config.js";
import { appendAuditLog } from "./auditLog.js";
import { getSupabase } from "../db/supabase.js";

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
    monthlyCredits: 200,
    priceMonthly: 9700,
    stripePriceId: config.stripe.prices.starter,
    paymentLinkUrl: config.stripe.paymentLinks.starter,
    features: ["200 créditos/mês", "1 operador", "Diagnóstico IA", "Export PDF", "WhatsApp templates"]
  },
  {
    id: "pro",
    name: "Pro",
    monthlyCredits: 600,
    priceMonthly: 19700,
    stripePriceId: config.stripe.prices.pro,
    paymentLinkUrl: config.stripe.paymentLinks.pro,
    features: ["600 créditos/mês", "3 operadores", "Caixa de entrada", "Relatórios comerciais", "Suporte prioritário"]
  },
  {
    id: "agency",
    name: "Agency",
    monthlyCredits: 999999,
    priceMonthly: 39700,
    stripePriceId: config.stripe.prices.agency,
    paymentLinkUrl: config.stripe.paymentLinks.agency,
    features: ["Créditos ilimitados", "10 operadores", "White-label", "Audit log completo", "Suporte dedicado"]
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

export function getPlanLinks() {
  return {
    starter: config.stripe.paymentLinks.starter || null,
    pro: config.stripe.paymentLinks.pro || null,
    agency: config.stripe.paymentLinks.agency || null
  };
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
  if (plan?.paymentLinkUrl) return plan.paymentLinkUrl;
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

export async function saveBillingWaitlist(input: { email: string; plan?: string; workspaceId?: string | null }) {
  const sb = getSupabase();
  if (!sb) {
    const error = new Error("Banco de dados não configurado para salvar interesse em faturamento.") as Error & { status?: number; code?: string };
    error.status = 503;
    error.code = "PERSISTENCE_UNAVAILABLE";
    throw error;
  }
  const { data, error } = await sb.from("billing_waitlist").insert({
    email: input.email.trim().toLowerCase(),
    plan: input.plan || null,
    workspace_id: input.workspaceId || null
  }).select("id, email, plan, created_at").single();
  if (error) throw error;
  return data;
}

async function activateWorkspacePlan(workspaceId: string, planId: string, renewalAt?: string | null) {
  const plan = PLANS.find((item) => item.id === planId && item.id !== "demo");
  if (!plan) return;
  const sb = getSupabase();
  if (!sb) return;
  const updates = {
    plan: plan.id,
    credits: plan.monthlyCredits,
    credits_used: 0,
    plan_started_at: new Date().toISOString(),
    plan_renews_at: renewalAt || null,
    expires_at: renewalAt || null,
    updated_at: new Date().toISOString()
  };
  const { error } = await sb.from("nodere_workspaces").update(updates).eq("id", workspaceId);
  if (error && (String(error.message || "").includes("credits_used") || String(error.message || "").includes("plan_"))) {
    await sb.from("nodere_workspaces").update({
      plan: plan.id,
      credits: plan.monthlyCredits,
      expires_at: renewalAt || null,
      updated_at: new Date().toISOString()
    }).eq("id", workspaceId);
  }
}

export async function handleStripeWebhook(rawBody: Buffer, signature: string) {
  if (!config.stripe.secretKey || !config.stripe.webhookSecret) return "stripe_not_configured";
  const stripe = new Stripe(config.stripe.secretKey);
  const event = stripe.webhooks.constructEvent(rawBody, signature, config.stripe.webhookSecret);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const workspaceId = session.metadata?.workspace_id || session.client_reference_id || undefined;
    const planId = session.metadata?.plan || session.metadata?.plan_id || undefined;
    if (workspaceId && planId) {
      await activateWorkspacePlan(workspaceId, planId);
      appendAuditLog("billing", "checkout_completed", `Checkout concluído para plano ${planId}`, {
        metadata: { workspaceId, planId, checkoutSessionId: session.id }
      });
    }
  }

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
    const workspaceId = sub.metadata?.workspace_id || sub.metadata?.workspaceId || undefined;
    if (workspaceId) await activateWorkspacePlan(workspaceId, plan.id, billingState.resetAt);
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
