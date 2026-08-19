export type AiProviderErrorClassification = {
  code:
    | "AI_PROVIDER_QUOTA_EXHAUSTED"
    | "AI_PROVIDER_RATE_LIMITED"
    | "AI_PROVIDER_AUTH_FAILED"
    | "AI_MODEL_ACCESS_DENIED"
    | "AI_PROVIDER_TIMEOUT"
    | "AI_PROVIDER_NETWORK_ERROR"
    | "AI_CONTEXT_LIMIT_EXCEEDED"
    | "AI_PROVIDER_REQUEST_FAILED";
  message: string;
  status: number;
  retryable: boolean;
  providerStatus?: number;
};

export function classifyAiProviderError(error: unknown): AiProviderErrorClassification {
  const evidence = collectErrorEvidence(error);
  const normalized = evidence.text.toLowerCase();

  if (matches(normalized, [
    "insufficient_quota",
    "billing_hard_limit_reached",
    "billing_not_active",
    "payment_required",
    "quota exceeded",
    "exceeded your current quota",
    "credit balance"
  ]) || evidence.status === 402) {
    return {
      code: "AI_PROVIDER_QUOTA_EXHAUSTED",
      message: "A quota de faturamento do provedor de IA está esgotada. Os créditos internos da NODERE não foram consumidos. Adicione saldo no provedor e tente novamente.",
      status: 402,
      retryable: false,
      providerStatus: evidence.status
    };
  }

  if (matches(normalized, ["rate_limit_exceeded", "rate limit", "too many requests"]) || evidence.status === 429) {
    return {
      code: "AI_PROVIDER_RATE_LIMITED",
      message: "O provedor de IA atingiu um limite temporário de requisições. Aguarde alguns instantes e tente novamente.",
      status: 429,
      retryable: true,
      providerStatus: evidence.status
    };
  }

  if (matches(normalized, ["invalid_api_key", "incorrect api key", "authentication_error", "invalid x-api-key"]) || evidence.status === 401) {
    return {
      code: "AI_PROVIDER_AUTH_FAILED",
      message: "A autenticação segura com o provedor de IA falhou. A chave do backend precisa ser revisada pela equipe técnica.",
      status: 503,
      retryable: false,
      providerStatus: evidence.status
    };
  }

  if (matches(normalized, ["model_not_found", "does not have access to model", "permission_denied", "model access"]) || evidence.status === 403) {
    return {
      code: "AI_MODEL_ACCESS_DENIED",
      message: "O modelo selecionado não está disponível para este projeto do provedor. Selecione outro modelo ou revise o acesso técnico.",
      status: 503,
      retryable: false,
      providerStatus: evidence.status
    };
  }

  if (matches(normalized, ["context_length_exceeded", "maximum context length", "max_tokens"])) {
    return {
      code: "AI_CONTEXT_LIMIT_EXCEEDED",
      message: "A conversa excedeu o limite de contexto do modelo. Inicie uma nova conversa ou reduza o conteúdo enviado.",
      status: 400,
      retryable: false,
      providerStatus: evidence.status
    };
  }

  if (matches(normalized, ["timeout", "timed out", "aborterror", "deadline exceeded"]) || evidence.name === "AbortError") {
    return {
      code: "AI_PROVIDER_TIMEOUT",
      message: "O provedor de IA demorou mais do que o limite seguro. Tente novamente em alguns instantes.",
      status: 504,
      retryable: true,
      providerStatus: evidence.status
    };
  }

  if (matches(normalized, ["fetch failed", "network", "econnreset", "enotfound", "socket hang up"])) {
    return {
      code: "AI_PROVIDER_NETWORK_ERROR",
      message: "A conexão com o provedor de IA falhou temporariamente. Tente novamente em alguns instantes.",
      status: 503,
      retryable: true,
      providerStatus: evidence.status
    };
  }

  return {
    code: "AI_PROVIDER_REQUEST_FAILED",
    message: "O provedor de IA não concluiu a solicitação. Nenhum crédito interno foi consumido; tente novamente.",
    status: evidence.status && evidence.status >= 400 && evidence.status <= 599 ? evidence.status : 502,
    retryable: evidence.status === undefined || evidence.status >= 500,
    providerStatus: evidence.status
  };
}

export function asAiProviderServiceError(error: unknown) {
  const classified = classifyAiProviderError(error);
  const serviceError = new Error(classified.message) as Error & {
    code: string;
    status: number;
    reason: string;
    providerStatus?: number;
  };
  serviceError.code = classified.code;
  serviceError.status = classified.status;
  serviceError.reason = classified.retryable ? "retryable" : "configuration_or_quota";
  serviceError.providerStatus = classified.providerStatus;
  return serviceError;
}

function collectErrorEvidence(error: unknown) {
  const seen = new Set<unknown>();
  const texts: string[] = [];
  let status: number | undefined;
  let name = "";
  let current: unknown = error;

  for (let depth = 0; current && depth < 5 && !seen.has(current); depth += 1) {
    seen.add(current);
    if (current instanceof Error) {
      name ||= current.name;
      texts.push(current.name, current.message);
    }
    if (typeof current === "object") {
      const value = current as Record<string, unknown>;
      for (const key of ["code", "type", "responseBody", "data", "body", "error", "message"]) {
        const candidate = value[key];
        if (typeof candidate === "string") texts.push(candidate);
        else if (candidate && typeof candidate === "object") {
          try { texts.push(JSON.stringify(candidate)); } catch { /* circular provider payload */ }
        }
      }
      for (const key of ["statusCode", "status", "responseStatus"]) {
        const candidate = Number(value[key]);
        if (!status && Number.isInteger(candidate) && candidate >= 100 && candidate <= 599) status = candidate;
      }
      current = value.cause;
    } else {
      texts.push(String(current));
      break;
    }
  }

  return { text: texts.join(" ").slice(0, 8_000), status, name };
}

function matches(text: string, markers: string[]) {
  return markers.some((marker) => text.includes(marker));
}
