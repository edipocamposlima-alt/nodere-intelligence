import { config } from "../config.js";
import { generateMeteredAiText } from "./aiGateway.js";

type ProviderName = "openai" | "anthropic";
type ProviderStatus = "ok" | "degraded" | "down";

type MeteredAiContext = {
  workspaceId: string;
  session: { userId?: string; email?: string; role?: string };
  action: string;
  agentId?: string;
  modelId?: string;
};

let providerHealthCache:
  | { checkedAt: number; providers: Record<ProviderName, ProviderStatus> }
  | null = null;

export async function callAI(systemPrompt: string, userPrompt: string, context: MeteredAiContext) {
  return generateMeteredAiText({
    workspaceId: context.workspaceId,
    session: context.session,
    systemPrompt,
    userPrompt,
    action: context.action,
    agentId: context.agentId,
    modelId: context.modelId
  });
}

export async function getAiProviderHealth() {
  if (providerHealthCache && Date.now() - providerHealthCache.checkedAt < 5 * 60 * 1000) {
    return providerHealthCache.providers;
  }
  const providers: Record<ProviderName, ProviderStatus> = {
    openai: await probeProvider("openai"),
    anthropic: await probeProvider("anthropic")
  };
  providerHealthCache = { checkedAt: Date.now(), providers };
  return providers;
}

async function probeProvider(provider: ProviderName): Promise<ProviderStatus> {
  const apiKey = provider === "openai" ? config.openai.apiKey : config.anthropic.apiKey;
  if (!apiKey) return "down";

  const url = provider === "openai"
    ? "https://api.openai.com/v1/models?limit=1"
    : "https://api.anthropic.com/v1/models?limit=1";
  const headers: Record<string, string> = provider === "openai"
    ? { Authorization: `Bearer ${apiKey}` }
    : { "x-api-key": apiKey, "anthropic-version": "2023-06-01" };

  try {
    const response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(8_000)
    });
    if (response.ok) return "ok";
    if (response.status === 401 || response.status === 403) return "down";
    return "degraded";
  } catch {
    return "degraded";
  }
}
