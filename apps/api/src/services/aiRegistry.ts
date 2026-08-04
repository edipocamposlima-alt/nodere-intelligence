import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import { config } from "../config.js";
import { getSupabase } from "../db/supabase.js";

export type AiModelRecord = {
  id: string;
  provider: "openai" | "anthropic";
  providerModelId: string;
  label: string;
  capabilityTier: "efficient" | "balanced" | "frontier";
  inputCostUsdPerMillion: number;
  cachedInputCostUsdPerMillion: number;
  outputCostUsdPerMillion: number;
  reasoningEffort: "none" | "low" | "medium" | "high" | "xhigh" | "max";
  allowedRoles: string[];
  enabled: boolean;
  providerAvailable: boolean;
  availabilityCheckedAt: string | null;
  supportsResponses: boolean;
  supportsTools: boolean;
  supportsWebSearch: boolean;
  supportsAudio: boolean;
  rateLimitProfile: Record<string, unknown>;
  discoverySource: string;
  availabilityError: string | null;
};

export type AiAgentRecord = {
  id: string;
  workspaceId: string | null;
  label: string;
  description: string;
  systemPrompt: string;
  defaultModelId: string;
  allowedModelIds: string[];
  allowedTools: string[];
  enabled: boolean;
};

export async function listAvailableModels(role?: string | null) {
  await refreshAiModelAvailability({ maxAgeMs: 15 * 60_000 }).catch(() => undefined);
  const sb = requireAiDatabase();
  const { data, error } = await sb
    .from("nodere_ai_model_registry")
    .select("*")
    .eq("enabled", true)
    .order("input_cost_usd_per_million", { ascending: true });
  if (error) throw error;
  return (data ?? [])
    .map(mapModel)
    .filter((model) => providerConfigured(model.provider))
    .filter((model) => model.providerAvailable || !model.availabilityCheckedAt)
    .filter((model) => !role || isModelAllowedForRole(model, role));
}

export async function refreshAiModelAvailability(options: { force?: boolean; maxAgeMs?: number } = {}) {
  const sb = requireAiDatabase();
  const maxAgeMs = options.maxAgeMs ?? 15 * 60_000;
  const { data: rows, error: listError } = await sb
    .from("nodere_ai_model_registry")
    .select("id, provider, provider_model_id, availability_checked_at")
    .eq("enabled", true);
  if (listError) {
    if (isAvailabilitySchemaMissing(listError)) return { refreshed: false, reason: "migration_pending" as const };
    throw listError;
  }
  const now = Date.now();
  const needsRefresh = options.force || (rows ?? []).some((row) => {
    const checkedAt = Date.parse(String(row.availability_checked_at || ""));
    return !Number.isFinite(checkedAt) || now - checkedAt > maxAgeMs;
  });
  if (!needsRefresh) return { refreshed: false, reason: "fresh" as const };

  const checkedAt = new Date().toISOString();
  const openAiRows = (rows ?? []).filter((row) => row.provider === "openai");
  if (openAiRows.length) {
    if (!config.openai.apiKey) {
      await updateProviderAvailability(sb, openAiRows.map((row) => String(row.id)), [], checkedAt, "OPENAI_API_KEY não configurada");
    } else {
      try {
        const response = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${config.openai.apiKey}`, Accept: "application/json" },
          signal: AbortSignal.timeout(12_000)
        });
        const body = await response.json().catch(() => ({})) as { data?: Array<{ id?: string }>; error?: { message?: string } };
        if (!response.ok) throw new Error(body.error?.message || `OpenAI retornou HTTP ${response.status}`);
        const discovered = new Set((body.data || []).map((item) => String(item.id || "")).filter(Boolean));
        const availableIds = openAiRows
          .filter((row) => discovered.has(String(row.provider_model_id)))
          .map((row) => String(row.id));
        await updateProviderAvailability(sb, openAiRows.map((row) => String(row.id)), availableIds, checkedAt, null);
      } catch (error) {
        const message = error instanceof Error ? error.message.slice(0, 500) : "Falha ao consultar o catálogo OpenAI";
        await updateProviderAvailability(sb, openAiRows.map((row) => String(row.id)), [], checkedAt, message);
      }
    }
  }

  const anthropicRows = (rows ?? []).filter((row) => row.provider === "anthropic");
  if (anthropicRows.length) {
    const availableIds = config.anthropic.apiKey ? anthropicRows.map((row) => String(row.id)) : [];
    await updateProviderAvailability(sb, anthropicRows.map((row) => String(row.id)), availableIds, checkedAt, config.anthropic.apiKey ? null : "ANTHROPIC_API_KEY não configurada");
  }
  return { refreshed: true, checkedAt };
}

export async function getAvailableModel(modelId?: string | null, constraints?: {
  role?: string | null;
  allowedModelIds?: string[];
}) {
  const models = (await listAvailableModels(constraints?.role))
    .filter((model) => isModelAllowedForAgent(model.id, constraints?.allowedModelIds));
  const requestedId = modelId || config.ai.defaultModelId;
  const requested = models.find((model) => model.id === requestedId);
  if (requested) return requested;
  const fallback = models.find((model) => model.id === config.ai.defaultModelId) ?? models[0];
  if (!fallback) throw serviceError("AI_PROVIDER_UNAVAILABLE", "Nenhum modelo de IA habilitado possui credencial de provedor no backend.", 503);
  if (modelId) throw serviceError("AI_MODEL_UNAVAILABLE", "O modelo solicitado não está habilitado ou o provedor não está configurado.", 400);
  return fallback;
}

export async function selectAutomaticModel(input: {
  role?: string | null;
  allowedModelIds?: string[];
  agentId?: string;
  messagesJson: string;
}) {
  const models = (await listAvailableModels(input.role))
    .filter((model) => isModelAllowedForAgent(model.id, input.allowedModelIds));
  if (!models.length) throw serviceError("AI_PROVIDER_UNAVAILABLE", "Nenhum modelo automático está disponível para este papel e agente.", 503);
  const complexity = estimateRoutingComplexity(input.messagesJson, input.agentId || "");
  const preferredTiers: AiModelRecord["capabilityTier"][] = complexity === "frontier"
    ? ["frontier", "balanced", "efficient"]
    : complexity === "balanced"
      ? ["balanced", "efficient", "frontier"]
      : ["efficient", "balanced", "frontier"];
  for (const tier of preferredTiers) {
    const candidate = models.find((model) => model.capabilityTier === tier);
    if (candidate) return candidate;
  }
  return models[0];
}

export async function listAvailableAgents(workspaceId: string) {
  const sb = requireAiDatabase();
  const { data, error } = await sb
    .from("nodere_ai_agents")
    .select("*")
    .eq("enabled", true)
    .order("label", { ascending: true });
  if (error) throw error;
  return (data ?? [])
    .map(mapAgent)
    .filter((agent) => agent.workspaceId === null || agent.workspaceId === workspaceId);
}

export async function getAvailableAgent(workspaceId: string, agentId?: string | null) {
  const agents = await listAvailableAgents(workspaceId);
  const requestedId = agentId || config.ai.defaultAgentId;
  const agent = agents.find((item) => item.id === requestedId);
  if (!agent) throw serviceError("AI_AGENT_UNAVAILABLE", "O agente solicitado não está habilitado para este workspace.", 400);
  return agent;
}

export function resolveLanguageModel(model: AiModelRecord): LanguageModel {
  if (model.provider === "openai") {
    if (!config.openai.apiKey) throw serviceError("OPENAI_NOT_CONFIGURED", "OpenAI não está configurada no backend.", 503);
    return createOpenAI({ apiKey: config.openai.apiKey }).responses(model.providerModelId);
  }
  if (!config.anthropic.apiKey) throw serviceError("ANTHROPIC_NOT_CONFIGURED", "Anthropic não está configurada no backend.", 503);
  return createAnthropic({ apiKey: config.anthropic.apiKey })(model.providerModelId);
}

export function providerConfigured(provider: AiModelRecord["provider"]) {
  return provider === "openai" ? Boolean(config.openai.apiKey) : Boolean(config.anthropic.apiKey);
}

export function isModelAllowedForRole(model: AiModelRecord, role?: string | null) {
  return model.allowedRoles.includes(normalizeRole(role || "viewer"));
}

export function isModelAllowedForAgent(modelId: string, allowedModelIds?: string[]) {
  return !allowedModelIds?.length || allowedModelIds.includes(modelId);
}

function mapModel(row: Record<string, unknown>): AiModelRecord {
  return {
    id: String(row.id),
    provider: row.provider === "anthropic" ? "anthropic" : "openai",
    providerModelId: String(row.provider_model_id),
    label: String(row.label),
    capabilityTier: String(row.capability_tier) as AiModelRecord["capabilityTier"],
    inputCostUsdPerMillion: Number(row.input_cost_usd_per_million || 0),
    cachedInputCostUsdPerMillion: Number(row.cached_input_cost_usd_per_million || 0),
    outputCostUsdPerMillion: Number(row.output_cost_usd_per_million || 0),
    reasoningEffort: String(row.reasoning_effort || "medium") as AiModelRecord["reasoningEffort"],
    allowedRoles: Array.isArray(row.allowed_roles) ? row.allowed_roles.map(String) : ["owner", "admin", "operator", "viewer"],
    enabled: Boolean(row.enabled),
    providerAvailable: row.provider_available === undefined ? true : Boolean(row.provider_available),
    availabilityCheckedAt: row.availability_checked_at ? String(row.availability_checked_at) : null,
    supportsResponses: row.supports_responses === undefined ? true : Boolean(row.supports_responses),
    supportsTools: Boolean(row.supports_tools),
    supportsWebSearch: Boolean(row.supports_web_search),
    supportsAudio: Boolean(row.supports_audio),
    rateLimitProfile: row.rate_limit_profile && typeof row.rate_limit_profile === "object" ? row.rate_limit_profile as Record<string, unknown> : {},
    discoverySource: String(row.discovery_source || "curated_registry"),
    availabilityError: row.availability_error ? String(row.availability_error) : null
  };
}

async function updateProviderAvailability(
  sb: ReturnType<typeof requireAiDatabase>,
  allIds: string[],
  availableIds: string[],
  checkedAt: string,
  errorMessage: string | null
) {
  if (!allIds.length) return;
  const available = new Set(availableIds);
  const updates = allIds.map(async (id) => {
    const { error } = await sb.from("nodere_ai_model_registry").update({
      provider_available: available.has(id),
      availability_checked_at: checkedAt,
      availability_error: errorMessage,
      discovery_source: "provider_catalog"
    }).eq("id", id);
    if (error) throw error;
  });
  await Promise.all(updates);
}

function isAvailabilitySchemaMissing(error: unknown) {
  const text = error instanceof Error ? error.message : JSON.stringify(error);
  return text.includes("availability_checked_at") || text.includes("provider_available") || text.includes("42703");
}

function mapAgent(row: Record<string, unknown>): AiAgentRecord {
  return {
    id: String(row.id),
    workspaceId: row.workspace_id ? String(row.workspace_id) : null,
    label: String(row.label),
    description: String(row.description),
    systemPrompt: String(row.system_prompt),
    defaultModelId: String(row.default_model_id),
    allowedModelIds: Array.isArray(row.allowed_model_ids) ? row.allowed_model_ids.map(String) : [String(row.default_model_id)],
    allowedTools: Array.isArray(row.allowed_tools) ? row.allowed_tools.map(String) : [],
    enabled: Boolean(row.enabled)
  };
}

function normalizeRole(role: string) {
  return ["owner", "admin", "operator", "viewer"].includes(role) ? role : "viewer";
}

function estimateRoutingComplexity(messagesJson: string, agentId: string) {
  const characters = messagesJson.length;
  const normalized = messagesJson.toLowerCase();
  const highComplexitySignals = ["contrato", "proposta completa", "auditoria", "estratégia", "comparar versões", "briefing completo"];
  const mediumComplexitySignals = ["diagnóstico", "pipeline", "planejamento", "relatório", "briefing", "follow-up"];
  if (characters > 40_000 || agentId === "proposal-strategist" || highComplexitySignals.some((signal) => normalized.includes(signal))) return "frontier" as const;
  if (characters > 8_000 || mediumComplexitySignals.some((signal) => normalized.includes(signal))) return "balanced" as const;
  return "efficient" as const;
}

function requireAiDatabase() {
  const sb = getSupabase();
  if (!sb) throw serviceError("AI_DATABASE_UNAVAILABLE", "Supabase não está configurado para persistir a operação de IA.", 503);
  return sb;
}

function serviceError(code: string, message: string, status: number) {
  const error = new Error(message) as Error & { code?: string; status?: number };
  error.code = code;
  error.status = status;
  return error;
}
