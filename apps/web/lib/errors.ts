export const ERROR_MESSAGES = {
  BACKEND_UNAVAILABLE: "O serviço está temporariamente indisponível. Tente novamente em alguns instantes.",
  NETWORK_ERROR: "Verifique sua conexão com a internet e tente novamente.",
  AUTH_ERROR: "Sessão expirada. Faça login novamente.",
  PERMISSION_ERROR: "Você não tem permissão para acessar esta área.",
  NOT_FOUND: "Recurso não encontrado.",
  SERVER_ERROR: "Ocorreu um erro interno. Nossa equipe foi notificada.",
  CREDITS_EXHAUSTED: "Seus créditos foram esgotados. Faça upgrade do seu plano para continuar.",
  AI_PROVIDER_QUOTA_EXHAUSTED: "A quota de faturamento do provedor de IA está esgotada. Seus créditos internos não foram consumidos.",
  AI_PROVIDER_RATE_LIMITED: "O provedor de IA atingiu um limite temporário. Aguarde alguns instantes e tente novamente.",
  AI_PROVIDER_AUTH_FAILED: "A conexão segura com o provedor de IA precisa ser revisada pela equipe técnica.",
  AI_MODEL_ACCESS_DENIED: "O modelo selecionado não está disponível para este projeto. Selecione outro modelo.",
  LOADING_TIMEOUT: "O carregamento demorou mais do que o esperado. Atualize a página e tente novamente."
} as const;

const TECHNICAL_MARKERS = [
  "NEXT_PUBLIC_",
  "SUPABASE_",
  "OPENAI_",
  "STRIPE_",
  "SMTP_",
  "GOOGLE_",
  "Render",
  "Vercel",
  "CORS",
  "localhost",
  "nodere-api.onrender.com",
  "http://",
  "https://"
];

export function getErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";

  if (/401|unauthorized|login obrigat|sessão expirada/i.test(message)) return ERROR_MESSAGES.AUTH_ERROR;
  if (/403|forbidden|permiss/i.test(message)) return ERROR_MESSAGES.PERMISSION_ERROR;
  if (/404|not found|não encontrado/i.test(message)) return ERROR_MESSAGES.NOT_FOUND;
  if (/AI_PROVIDER_QUOTA_EXHAUSTED|quota de faturamento|insufficient_quota/i.test(message)) return ERROR_MESSAGES.AI_PROVIDER_QUOTA_EXHAUSTED;
  if (/AI_PROVIDER_RATE_LIMITED|rate limit|limite temporário/i.test(message)) return ERROR_MESSAGES.AI_PROVIDER_RATE_LIMITED;
  if (/AI_PROVIDER_AUTH_FAILED|autenticação segura com o provedor/i.test(message)) return ERROR_MESSAGES.AI_PROVIDER_AUTH_FAILED;
  if (/AI_MODEL_ACCESS_DENIED|modelo selecionado não está disponível/i.test(message)) return ERROR_MESSAGES.AI_MODEL_ACCESS_DENIED;
  if (/CREDITS_EXHAUSTED|créditos insuficientes|seus créditos/i.test(message)) return ERROR_MESSAGES.CREDITS_EXHAUSTED;
  if (/timeout|demorou|tempo esgotado/i.test(message)) return ERROR_MESSAGES.LOADING_TIMEOUT;
  if (/fetch|network|failed to fetch/i.test(message)) return ERROR_MESSAGES.NETWORK_ERROR;
  if (TECHNICAL_MARKERS.some((marker) => message.includes(marker))) return ERROR_MESSAGES.BACKEND_UNAVAILABLE;
  return message || ERROR_MESSAGES.SERVER_ERROR;
}
