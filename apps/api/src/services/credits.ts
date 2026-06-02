import { CreditAccount } from "../types.js";

const TRIAL_CREDITS = 20;
const COST_SEARCH = 1;
const COST_ENRICHMENT = 1;

type WorkspaceCredits = CreditAccount & {
  total: number;
  expiresAt: string;
  log: Array<{ type: string; amount: number; description: string; at: string }>;
};

const accounts = new Map<string, WorkspaceCredits>();

export function getCredits(workspaceId = "default"): CreditAccount {
  const account = ensureAccount(workspaceId);
  return { balance: account.balance, used: account.used, plan: account.plan, resetAt: account.resetAt };
}

export function getCreditStatus(workspaceId = "default") {
  const account = ensureAccount(workspaceId);
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

function consume(amount: number, type: string, description: string, workspaceId: string) {
  const account = ensureAccount(workspaceId);
  if (new Date(account.expiresAt).getTime() < Date.now() || account.balance <= 0) {
    const err = new Error("Créditos esgotados — faça upgrade") as Error & { status?: number; code?: string };
    err.status = 402;
    err.code = "CREDITS_EXHAUSTED";
    throw err;
  }
  account.used += amount;
  account.balance = Math.max(0, account.balance - amount);
  account.log.push({ type, amount, description, at: new Date().toISOString() });
  return account.balance;
}

function ensureAccount(workspaceId: string) {
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
