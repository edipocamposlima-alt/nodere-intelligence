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
    priceYearly: 97000,
    stripePriceId: config.stripe.prices.starterMonthly,
    stripePriceMonthlyId: config.stripe.prices.starterMonthly,
    stripePriceYearlyId: config.stripe.prices.starterYearly,
    paymentLinkUrl: config.stripe.paymentLinks.starter,
    features: ["200 créditos/mês", "1 operador", "Diagnóstico IA", "Export PDF", "WhatsApp templates"]
  },
  {
    id: "pro",
    name: "Pro",
    monthlyCredits: 600,
    priceMonthly: 19700,
    priceYearly: 197000,
    stripePriceId: config.stripe.prices.proMonthly,
    stripePriceMonthlyId: config.stripe.prices.proMonthly,
    stripePriceYearlyId: config.stripe.prices.proYearly,
    paymentLinkUrl: config.stripe.paymentLinks.pro,
    features: ["600 créditos/mês", "3 operadores", "Caixa de entrada", "Relatórios comerciais", "Suporte prioritário"]
  },
  {
    id: "agency",
    name: "Agency",
    monthlyCredits: 999999,
    priceMonthly: 39700,
    priceYearly: 397000,
    stripePriceId: config.stripe.prices.agencyMonthly,
    stripePriceMonthlyId: config.stripe.prices.agencyMonthly,
    stripePriceYearlyId: config.stripe.prices.agencyYearly,
    paymentLinkUrl: config.stripe.paymentLinks.agency,
    features: ["Créditos ilimitados", "10 operadores", "White-label", "Audit log completo", "Suporte dedicado"]
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthlyCredits: 999999,
    priceMonthly: 0,
    priceYearly: 0,
    features: ["Créditos e operadores sob contrato", "SLA dedicado", "Implantação assistida", "Governança avançada", "Suporte executivo"]
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

export async function getBillingStatus(workspaceId?: string): Promise<BillingStatus> {
  if (workspaceId) {
    const persisted = await getPersistedBillingStatus(workspaceId).catch(() => null);
    if (persisted) return persisted;
  }
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

export async function createCheckoutSession(input: {
  planId: Exclude<PlanId, "demo" | "enterprise">;
  billingCycle: "monthly" | "yearly";
  workspaceId: string;
  customerId?: string;
}): Promise<string> {
  const { planId, billingCycle, workspaceId, customerId } = input;
  const plan = PLANS.find((p) => p.id === planId);
  if (!plan) throw new Error("Plano não disponível para checkout");
  if (plan?.paymentLinkUrl) return plan.paymentLinkUrl;
  const priceId = getStripePriceId(plan, billingCycle);
  if (!priceId) throw new Error("Plano não disponível para checkout");
  if (!config.stripe.secretKey) throw new Error("Stripe não configurado");

  const stripe = new Stripe(config.stripe.secretKey);
  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: config.stripe.successUrl,
    cancel_url: config.stripe.cancelUrl,
    client_reference_id: workspaceId,
    metadata: {
      workspace_id: workspaceId,
      plan: planId,
      billing_cycle: billingCycle
    },
    subscription_data: {
      metadata: {
        workspace_id: workspaceId,
        plan: planId,
        billing_cycle: billingCycle
      }
    }
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
  if (error) {
    const unavailable = new Error(
      "Tabela billing_waitlist ausente no Supabase. Aplique apps/api/src/db/schema.sql para ativar o formulário de interesse."
    ) as Error & { status?: number; code?: string };
    unavailable.status = 503;
    unavailable.code = "BILLING_SCHEMA_UNAVAILABLE";
    throw unavailable;
  }
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

async function downgradeWorkspaceToDemo(workspaceId: string) {
  const sb = getSupabase();
  if (!sb) return;
  const demo = PLANS[0];
  await sb.from("nodere_workspaces").update({
    plan: demo.id,
    credits: demo.monthlyCredits,
    credits_used: 0,
    plan_started_at: null,
    plan_renews_at: null,
    expires_at: null,
    updated_at: new Date().toISOString()
  }).eq("id", workspaceId);
}

async function getPersistedBillingStatus(workspaceId: string): Promise<BillingStatus | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from("nodere_billing_subscriptions")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  const plan = PLANS.find((p) => p.id === data.plan) ?? PLANS[0];
  const creditsLimit = Number(data.credits_limit ?? plan.monthlyCredits);
  return {
    plan,
    balance: creditsLimit,
    used: 0,
    resetAt: String(data.current_period_end || nextResetDate()),
    stripeCustomerId: data.stripe_customer_id || undefined,
    stripeSubscriptionId: data.stripe_subscription_id || undefined,
    subscriptionStatus: data.status || undefined,
    gated: data.status === "canceled" || data.status === "unpaid" || data.status === "past_due"
  };
}

function getStripePriceId(plan: Plan | undefined, billingCycle: "monthly" | "yearly") {
  if (!plan) return "";
  if (billingCycle === "yearly") return plan.stripePriceYearlyId || plan.stripePriceId || "";
  return plan.stripePriceMonthlyId || plan.stripePriceId || "";
}

function seatsForPlan(planId: string) {
  if (planId === "enterprise") return 999;
  if (planId === "agency") return 10;
  if (planId === "pro") return 3;
  if (planId === "starter") return 1;
  return 1;
}

async function isStripeEventProcessed(stripeEventId: string) {
  const sb = getSupabase();
  if (!sb) return false;
  const { data } = await sb
    .from("nodere_stripe_events")
    .select("id")
    .eq("stripe_event_id", stripeEventId)
    .maybeSingle();
  return Boolean(data?.id);
}

async function recordStripeEvent(event: Stripe.Event) {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.from("nodere_stripe_events").insert({
    stripe_event_id: event.id,
    event_type: event.type,
    payload: event as unknown as Record<string, unknown>
  });
  if (error && !String(error.message || "").includes("duplicate")) throw error;
}

async function upsertBillingSubscription(input: {
  workspaceId: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  planId: string;
  billingCycle?: string | null;
  status?: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  metadata?: Record<string, unknown>;
}) {
  const sb = getSupabase();
  if (!sb) return;
  const plan = PLANS.find((item) => item.id === input.planId) ?? PLANS[0];
  const row = {
    workspace_id: input.workspaceId,
    stripe_customer_id: input.stripeCustomerId || null,
    stripe_subscription_id: input.stripeSubscriptionId || null,
    plan: plan.id,
    billing_cycle: input.billingCycle || "monthly",
    status: input.status || "active",
    current_period_start: input.currentPeriodStart || null,
    current_period_end: input.currentPeriodEnd || null,
    cancel_at_period_end: Boolean(input.cancelAtPeriodEnd),
    seats_limit: seatsForPlan(plan.id),
    credits_limit: plan.monthlyCredits,
    metadata: input.metadata || {},
    updated_at: new Date().toISOString()
  };

  const onConflict = row.stripe_subscription_id ? "stripe_subscription_id" : "workspace_id";
  const { error } = await sb.from("nodere_billing_subscriptions").upsert(row, { onConflict });
  if (error) throw error;
}

function planIdFromPrice(priceId?: string): PlanId {
  const plan = PLANS.find((item) =>
    item.stripePriceMonthlyId === priceId ||
    item.stripePriceYearlyId === priceId ||
    item.stripePriceId === priceId
  );
  return plan?.id ?? "demo";
}

function billingCycleFromPrice(priceId?: string) {
  const yearly = PLANS.some((item) => item.stripePriceYearlyId && item.stripePriceYearlyId === priceId);
  return yearly ? "yearly" : "monthly";
}

export async function handleStripeWebhook(rawBody: Buffer, signature: string) {
  if (!config.stripe.secretKey || !config.stripe.webhookSecret) return "stripe_not_configured";
  const stripe = new Stripe(config.stripe.secretKey);
  const event = stripe.webhooks.constructEvent(rawBody, signature, config.stripe.webhookSecret);
  if (await isStripeEventProcessed(event.id)) return `${event.type}:duplicate`;

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const workspaceId = session.metadata?.workspace_id || session.client_reference_id || undefined;
    const planId = session.metadata?.plan || session.metadata?.plan_id || undefined;
    if (workspaceId && planId) {
      await upsertBillingSubscription({
        workspaceId,
        stripeCustomerId: typeof session.customer === "string" ? session.customer : session.customer?.id,
        stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : session.subscription?.id,
        planId,
        billingCycle: session.metadata?.billing_cycle || "monthly",
        status: "checkout_completed",
        metadata: { checkoutSessionId: session.id }
      });
      await activateWorkspacePlan(workspaceId, planId);
      appendAuditLog("billing", "checkout_completed", `Checkout concluído para plano ${planId}`, {
        metadata: { workspaceId, planId, checkoutSessionId: session.id }
      });
    }
  }

  if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;
    const priceId = sub.items.data[0]?.price.id;
    const plan = PLANS.find((p) => p.id === planIdFromPrice(priceId)) ?? PLANS[0];
    const periodEnd: number | undefined = (sub as any).current_period_end;
    const periodStart: number | undefined = (sub as any).current_period_start;
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
    if (workspaceId) {
      await upsertBillingSubscription({
        workspaceId,
        stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
        stripeSubscriptionId: sub.id,
        planId: plan.id,
        billingCycle: sub.metadata?.billing_cycle || billingCycleFromPrice(priceId),
        status: sub.status,
        currentPeriodStart: periodStart ? new Date(periodStart * 1000).toISOString() : null,
        currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
        metadata: { priceId }
      });
      await activateWorkspacePlan(workspaceId, plan.id, billingState.resetAt);
    }
    appendAuditLog("billing", `subscription_${event.type.split(".")[2]}`, `Assinatura ${plan.name} — ${sub.status}`, {
      metadata: { planId: plan.id, subscriptionId: sub.id }
    });
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    billingState = { planId: "demo", balance: PLANS[0].monthlyCredits, used: 0, resetAt: nextResetDate(), subscriptionStatus: "canceled" };
    const workspaceId = sub.metadata?.workspace_id || sub.metadata?.workspaceId || undefined;
    if (workspaceId) {
      await upsertBillingSubscription({
        workspaceId,
        stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
        stripeSubscriptionId: sub.id,
        planId: "demo",
        billingCycle: sub.metadata?.billing_cycle || "monthly",
        status: "canceled",
        cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
        metadata: { deleted: true }
      });
      await downgradeWorkspaceToDemo(workspaceId);
    }
    appendAuditLog("billing", "subscription_canceled", "Assinatura cancelada, voltando ao plano Demo", { metadata: { subscriptionId: sub.id } });
  }

  await recordStripeEvent(event);
  return event.type;
}
