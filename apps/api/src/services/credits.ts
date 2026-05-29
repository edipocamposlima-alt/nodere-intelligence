import { CreditAccount } from "../types.js";

const MONTHLY_CREDITS = 200;
const COST_SEARCH = 5;
const COST_ENRICHMENT = 1;

const account: CreditAccount & { log: Array<{ type: string; amount: number; description: string; at: string }> } = {
  balance: MONTHLY_CREDITS,
  used: 0,
  plan: "Demo",
  resetAt: nextResetDate(),
  log: []
};

export function getCredits(): CreditAccount {
  return { balance: account.balance, used: account.used, plan: account.plan, resetAt: account.resetAt };
}

export function consumeSearch(description: string) {
  return consume(COST_SEARCH, "search", description);
}

export function consumeEnrichment(companyName: string) {
  return consume(COST_ENRICHMENT, "enrichment", companyName);
}

function consume(amount: number, type: string, description: string) {
  account.used += amount;
  account.balance = Math.max(0, account.balance - amount);
  account.log.push({ type, amount, description, at: new Date().toISOString() });
  return account.balance;
}

function nextResetDate() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1, 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
