import { config } from "../config.js";

type ProviderName = "openai" | "anthropic";
type ProviderStatus = "ok" | "degraded" | "down";

export class AiUnavailableError extends Error {
  retryAfter = 300;
  status = 503;

  constructor(message = "AI temporarily unavailable") {
    super(message);
    this.name = "AiUnavailableError";
  }
}

let providerHealthCache:
  | { checkedAt: number; providers: Record<ProviderName, ProviderStatus> }
  | null = null;

export async function callAI(systemPrompt: string, userPrompt: string) {
  const providers = orderedProviders();
  let lastError: unknown;

  for (const provider of providers) {
    const startedAt = Date.now();
    try {
      const content = provider === "openai"
        ? await callOpenAI(systemPrompt, userPrompt)
        : await callAnthropic(systemPrompt, userPrompt);
      console.log(`[AI] provider=${provider} latency=${Date.now() - startedAt}ms`);
      return { provider, content };
    } catch (error) {
      lastError = error;
      const retryable = isRetryableAiError(error);
      console.warn(`[AI] provider=${provider} status=failed retryable=${retryable} latency=${Date.now() - startedAt}ms`);
      if (!retryable) break;
    }
  }

  const message = lastError instanceof Error && lastError.message
    ? `IA indisponível: ${lastError.message}`
    : "IA indisponível no momento.";
  const err = new AiUnavailableError(message);
  (err as Error & { cause?: unknown }).cause = lastError;
  throw err;
}

export async function getAiProviderHealth() {
  if (providerHealthCache && Date.now() - providerHealthCache.checkedAt < 5 * 60 * 1000) {
    return providerHealthCache.providers;
  }
  const providers: Record<ProviderName, ProviderStatus> = {
    openai: config.openai.apiKey ? "ok" : "down",
    anthropic: config.anthropic.apiKey ? "ok" : "down"
  };
  providerHealthCache = { checkedAt: Date.now(), providers };
  return providers;
}

function orderedProviders(): ProviderName[] {
  const primary = config.ai.providerPrimary === "anthropic" ? "anthropic" : "openai";
  return primary === "openai" ? ["openai", "anthropic"] : ["anthropic", "openai"];
}

async function callOpenAI(systemPrompt: string, userPrompt: string) {
  if (!config.openai.apiKey) throw retryable("OPENAI_API_KEY ausente.");
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.openai.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: config.openai.model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7
    })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw providerError(response.status, payload?.error?.message || "OpenAI falhou.");
  return String(payload?.choices?.[0]?.message?.content ?? "{}");
}

async function callAnthropic(systemPrompt: string, userPrompt: string) {
  if (!config.anthropic.apiKey) throw retryable("ANTHROPIC_API_KEY ausente.");
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": config.anthropic.apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: config.anthropic.model,
      max_tokens: 1600,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }]
    })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw providerError(response.status, payload?.error?.message || "Anthropic falhou.");
  const text = payload?.content?.find?.((item: { type?: string }) => item.type === "text")?.text;
  return String(text ?? "{}");
}

function providerError(status: number, message: string) {
  const err = new Error(message) as Error & { status?: number; retryable?: boolean };
  err.status = status;
  err.retryable = status === 429 || status === 503;
  return err;
}

function retryable(message: string) {
  const err = new Error(message) as Error & { retryable?: boolean };
  err.retryable = true;
  return err;
}

function isRetryableAiError(error: unknown) {
  return Boolean((error as { retryable?: boolean })?.retryable);
}
