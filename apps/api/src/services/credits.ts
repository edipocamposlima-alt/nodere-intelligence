import { CreditAccount } from "../types.js";
import { getSupabase, hasSupabase } from "../db/supabase.js";
import { randomUUID } from "node:crypto";

const TRIAL_CREDITS = 20;
const TRIAL_DAYS = 14;
const COST_SEARCH = 1;
const COST_ENRICHMENT = 1;

type WorkspaceCredits = CreditAccount & {
  total: number;
  expiresAt: string | null;
  trialExpiresAt: string | null;
  renewalAt: string | null;
  log: Array<{ type: string; amount: number; description: string; at: string }>;
};

const accounts = new Map<string, WorkspaceCredits>();

export async function getCredits(workspaceId = "default"): Promise<CreditAccount> {
  const account = await ensureAccount(workspaceId);
  return { balance: account.balance, used: account.used, plan: account.plan, resetAt: account.resetAt };
}

export async function getCreditStatus(workspaceId = "default") {
  const account = await ensureAccount(workspaceId);
  const trialExpired = account.plan === "trial" && Boolean(account.trialExpiresAt) && new Date(account.trialExpiresAt!).getTime() < Date.now();
  return {
    total: account.total,
    used: account.used,
    remaining: account.balance,
    plan: account.plan,
    expires_at: account.expiresAt,
    trial_expires_at: account.trialExpiresAt,
    renewal_at: account.renewalAt,
    resetAt: account.renewalAt || "",
    blocked: account.balance <= 0 || trialExpired,
    trialExpired
  };
}

export function consumeSearch(description: string, workspaceId = "default") {
  return consume(COST_SEARCH, "search", description, workspaceId);
}

export function consumeEnrichment(companyName: string, workspaceId = "default") {
  return consume(COST_ENRICHMENT, "enrichment", companyName, workspaceId);
}

export function consumeCredit(type = "manual", description = "Uso operacional", workspaceId = "default") {
  return consume(1, type, description, workspaceId);
}

async function consume(amount: number, type: string, description: string, workspaceId: string) {
  if (hasSupabase()) {
    const sb = getSupabase()!;
    const { data, error } = await sb.rpc("nodere_consume_credits", {
      p_workspace_id: workspaceId,
      p_idempotency_key: `operation:${type}:${randomUUID()}`,
      p_amount: amount,
      p_metadata: { type, description }
    });
    if (error) {
      const message = String(error.message || "");
      if (message.includes("CREDITS_EXHAUSTED")) {
        const exhausted = new Error("Créditos esgotados — faça upgrade") as Error & { status?: number; code?: string };
        exhausted.status = 402;
        exhausted.code = "CREDITS_EXHAUSTED";
        throw exhausted;
      }
      const unavailable = new Error("Ledger de créditos indisponível. A operação não foi cobrada nem executada.") as Error & { status?: number; code?: string };
      unavailable.status = 503;
      unavailable.code = "CREDIT_LEDGER_UNAVAILABLE";
      throw unavailable;
    }
    accounts.delete(workspaceId);
    const row = Array.isArray(data) ? data[0] : data;
    return Number(row?.available_credit ?? 0);
  }

  const account = await ensureAccount(workspaceId);
  const trialExpired = account.plan === "trial" && Boolean(account.trialExpiresAt) && new Date(account.trialExpiresAt!).getTime() < Date.now();
  if (trialExpired || account.balance <= 0) {
    const err = new Error(trialExpired ? "Trial expirado — escolha um plano para continuar buscando empresas." : "Créditos esgotados — faça upgrade") as Error & { status?: number; code?: string };
    err.status = 402;
    err.code = "CREDITS_EXHAUSTED";
    throw err;
  }
  account.used += amount;
  account.balance = Math.max(0, account.balance - amount);
  account.log.push({ type, amount, description, at: new Date().toISOString() });
  await persistAccount(workspaceId, account);
  return account.balance;
}

async function ensureAccount(workspaceId: string) {
  if (hasSupabase()) {
    const persisted = await loadPersistedAccount(workspaceId);
    if (persisted) {
      accounts.set(workspaceId, persisted);
      return persisted;
    }
  }
  if (!accounts.has(workspaceId)) {
    accounts.set(workspaceId, {
      total: TRIAL_CREDITS,
      balance: TRIAL_CREDITS,
      used: 0,
      plan: "trial",
      resetAt: "",
      expiresAt: trialExpiryDate(),
      trialExpiresAt: trialExpiryDate(),
      renewalAt: null,
      log: []
    });
  }
  return accounts.get(workspaceId)!;
}

async function loadPersistedAccount(workspaceId: string): Promise<WorkspaceCredits | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from("nodere_workspaces")
    .select("*")
    .eq("id", workspaceId)
    .maybeSingle();
  if (error || !data) return null;
  const wallet = await sb
    .from("nodere_credit_wallets")
    .select("available_credit,held_credit,lifetime_spent_credit")
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  const plan = String(data.plan ?? "trial");
  const legacyBalance = Math.max(0, Number(data.credits ?? TRIAL_CREDITS));
  const balance = wallet.data && !wallet.error ? Math.max(0, Number(wallet.data.available_credit || 0)) : legacyBalance;
  const total = plan === "agency" ? 1800 : plan === "pro" ? 600 : plan === "starter" ? 200 : plan === "enterprise" ? balanceFromRow(data) : TRIAL_CREDITS;
  const used = Math.max(0, Number(data.credits_used ?? (total - balance)));
  const trialExpiresAt = String(data.trial_expires_at ?? data.expires_at ?? trialExpiryDate());
  const renewalAt = plan === "trial" ? null : String(data.plan_renews_at ?? data.expires_at ?? "");
  return {
    total,
    balance,
    used,
    plan,
    resetAt: renewalAt || "",
    expiresAt: plan === "trial" ? trialExpiresAt : renewalAt,
    trialExpiresAt,
    renewalAt,
    log: []
  };
}

function balanceFromRow(data: Record<string, unknown>) {
  return Math.max(0, Number(data.credits ?? 0) + Number(data.credits_used ?? 0));
}

async function persistAccount(workspaceId: string, account: WorkspaceCredits) {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.from("nodere_workspaces").update({
    credits: account.balance,
    credits_used: account.used,
    updated_at: new Date().toISOString()
  }).eq("id", workspaceId);
  if (error && String(error.message || "").includes("credits_used")) {
    await sb.from("nodere_workspaces").update({
      credits: account.balance,
      updated_at: new Date().toISOString()
    }).eq("id", workspaceId);
  }
}

function trialExpiryDate() {
  const d = new Date();
  d.setDate(d.getDate() + TRIAL_DAYS);
  return d.toISOString();
}
