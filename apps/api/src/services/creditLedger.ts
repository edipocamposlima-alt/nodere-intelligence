import type { LanguageModelUsage } from "ai";
import { config } from "../config.js";
import { getSupabase } from "../db/supabase.js";
import type { AiModelRecord } from "./aiRegistry.js";

export type CreditWallet = {
  available: number;
  held: number;
  lifetimeSpent: number;
  creditsPerUsd: number;
};

export async function getCreditWallet(workspaceId: string): Promise<CreditWallet> {
  const sb = requireAiDatabase();
  const { data, error } = await sb
    .from("nodere_credit_wallets")
    .select("available_credit,held_credit,lifetime_spent_credit,credits_per_usd")
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw serviceError("AI_WALLET_UNAVAILABLE", "Carteira de créditos não encontrada. A migração AI-first precisa ser aplicada.", 503);
  return {
    available: Number(data.available_credit || 0),
    held: Number(data.held_credit || 0),
    lifetimeSpent: Number(data.lifetime_spent_credit || 0),
    creditsPerUsd: Number(data.credits_per_usd || config.ai.creditsPerUsd)
  };
}

export function estimateReservationCredit(input: {
  messagesJson: string;
  model: AiModelRecord;
  creditsPerUsd: number;
}) {
  const estimatedInputTokens = Math.ceil(input.messagesJson.length / 2);
  const estimatedUsd = (
    estimatedInputTokens * input.model.inputCostUsdPerMillion +
    config.ai.maxOutputTokens * input.model.outputCostUsdPerMillion
  ) / 1_000_000;
  return roundCredit(Math.max(0.01, estimatedUsd * input.creditsPerUsd * config.ai.reservationBuffer));
}

export function calculateActualCost(model: AiModelRecord, usage: LanguageModelUsage, creditsPerUsd: number) {
  const inputTokens = usage.inputTokens ?? 0;
  const cachedInputTokens = usage.inputTokenDetails.cacheReadTokens ?? 0;
  const cacheWriteTokens = usage.inputTokenDetails.cacheWriteTokens ?? 0;
  const uncachedInputTokens = usage.inputTokenDetails.noCacheTokens ?? Math.max(0, inputTokens - cachedInputTokens - cacheWriteTokens);
  const outputTokens = usage.outputTokens ?? 0;
  const providerCostUsd = (
    uncachedInputTokens * model.inputCostUsdPerMillion +
    cachedInputTokens * model.cachedInputCostUsdPerMillion +
    cacheWriteTokens * model.inputCostUsdPerMillion * 1.25 +
    outputTokens * model.outputCostUsdPerMillion
  ) / 1_000_000;
  return {
    providerCostUsd,
    chargedCredit: providerCostUsd > 0 ? roundCredit(providerCostUsd * creditsPerUsd) : 0,
    inputTokens,
    cachedInputTokens,
    outputTokens,
    cacheWriteTokens
  };
}

export async function reserveAiCredits(workspaceId: string, executionId: string, amount: number) {
  return callLedgerRpc("nodere_ai_reserve_credits", {
    p_workspace_id: workspaceId,
    p_execution_id: executionId,
    p_idempotency_key: `ai:${executionId}:reserve`,
    p_amount: amount
  });
}

export async function captureAiCredits(input: {
  workspaceId: string;
  executionId: string;
  amount: number;
  providerCostUsd: number;
  metadata: Record<string, unknown>;
}) {
  return callLedgerRpc("nodere_ai_capture_credits", {
    p_workspace_id: input.workspaceId,
    p_execution_id: input.executionId,
    p_idempotency_key: `ai:${input.executionId}:capture`,
    p_actual_amount: input.amount,
    p_provider_cost_usd: input.providerCostUsd,
    p_metadata: input.metadata
  });
}

export async function releaseAiCredits(workspaceId: string, executionId: string, reason: string) {
  return callLedgerRpc("nodere_ai_release_credits", {
    p_workspace_id: workspaceId,
    p_execution_id: executionId,
    p_idempotency_key: `ai:${executionId}:release`,
    p_metadata: { reason }
  });
}

async function callLedgerRpc(name: string, params: Record<string, unknown>) {
  const sb = requireAiDatabase();
  const { data, error } = await sb.rpc(name, params);
  if (error) {
    const message = String(error.message || "");
    if (message.includes("CREDITS_EXHAUSTED")) throw serviceError("CREDITS_EXHAUSTED", "Créditos insuficientes para reservar esta execução de IA.", 402);
    if (String(error.code) === "PGRST202" || message.includes("Could not find the function")) {
      throw serviceError("AI_LEDGER_UNAVAILABLE", "O ledger transacional de créditos ainda não está disponível no banco.", 503);
    }
    throw error;
  }
  return Array.isArray(data) ? data[0] : data;
}

function roundCredit(value: number) {
  return Math.ceil(value * 10_000) / 10_000;
}

function requireAiDatabase() {
  const sb = getSupabase();
  if (!sb) throw serviceError("AI_DATABASE_UNAVAILABLE", "Supabase não está configurado para o ledger de créditos.", 503);
  return sb;
}

function serviceError(code: string, message: string, status: number) {
  const error = new Error(message) as Error & { code?: string; status?: number };
  error.code = code;
  error.status = status;
  return error;
}
