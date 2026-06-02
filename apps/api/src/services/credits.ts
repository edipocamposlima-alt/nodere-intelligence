import { CreditAccount } from "../types.js";
import { getSupabase, hasSupabase } from "../db/supabase.js";

const TRIAL_CREDITS = 20;
const COST_SEARCH = 1;
const COST_ENRICHMENT = 1;

type WorkspaceCredits = CreditAccount & {
  total: number;
  expiresAt: string;
  log: Array<{ type: string; amount: number; description: string; at: string }>;
};

const accounts = new Map<string, WorkspaceCredits>();

export async function getCredits(workspaceId = "default"): Promise<CreditAccount> {
  const account = await ensureAccount(workspaceId);
  return { balance: account.balance, used: account.used, plan: account.plan, resetAt: account.resetAt };
}

export async function getCreditStatus(workspaceId = "default") {
  const account = await ensureAccount(workspaceId);
  return {
    total: account.total,
    used: account.used,
    remaining: account.balance,
    plan: account.plan,
    expires_at: account.expiresAt,
    resetAt: account.resetAt
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
  const account = await ensureAccount(workspaceId);
  if (new Date(account.expiresAt).getTime() < Date.now() || account.balance <= 0) {
    const err = new Error("Créditos esgotados — faça upgrade") as Error & { status?: number; code?: string };
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
      resetAt: nextResetDate(),
      expiresAt: trialExpiryDate(),
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
    .select("id, plan, credits, expires_at")
    .eq("id", workspaceId)
    .maybeSingle();
  if (error || !data) return null;
  const plan = String(data.plan ?? "trial");
  const total = plan === "agency" ? 999999 : plan === "pro" ? 600 : plan === "starter" ? 200 : TRIAL_CREDITS;
  const balance = Math.max(0, Number(data.credits ?? TRIAL_CREDITS));
  const used = Math.max(0, total - balance);
  return {
    total,
    balance,
    used,
    plan,
    resetAt: nextResetDate(),
    expiresAt: String(data.expires_at ?? trialExpiryDate()),
    log: []
  };
}

async function persistAccount(workspaceId: string, account: WorkspaceCredits) {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from("nodere_workspaces").update({
    credits: account.balance,
    updated_at: new Date().toISOString()
  }).eq("id", workspaceId);
}

function nextResetDate() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1, 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function trialExpiryDate() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString();
}
