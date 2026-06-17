export const ERROR_MESSAGES = {
  BACKEND_UNAVAILABLE: "O serviço está temporariamente indisponível. Tente novamente em alguns instantes.",
  NETWORK_ERROR: "Verifique sua conexão com a internet e tente novamente.",
  AUTH_ERROR: "Sessão expirada. Faça login novamente.",
  PERMISSION_ERROR: "Você não tem permissão para acessar esta área.",
  NOT_FOUND: "Recurso não encontrado.",
  SERVER_ERROR: "Ocorreu um erro interno. Nossa equipe foi notificada.",
  CREDITS_EXHAUSTED: "Seus créditos foram esgotados. Faça upgrade do seu plano para continuar.",
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
  if (message) console.error("[NODERI Internal Error]:", message);

  if (/401|unauthorized|login obrigat|sessão expirada/i.test(message)) return ERROR_MESSAGES.AUTH_ERROR;
  if (/403|forbidden|permiss/i.test(message)) return ERROR_MESSAGES.PERMISSION_ERROR;
  if (/404|not found|não encontrado/i.test(message)) return ERROR_MESSAGES.NOT_FOUND;
  if (/credit|crédito|credits/i.test(message)) return ERROR_MESSAGES.CREDITS_EXHAUSTED;
  if (/timeout|demorou|tempo esgotado/i.test(message)) return ERROR_MESSAGES.LOADING_TIMEOUT;
  if (/fetch|network|failed to fetch/i.test(message)) return ERROR_MESSAGES.NETWORK_ERROR;
  if (TECHNICAL_MARKERS.some((marker) => message.includes(marker))) return ERROR_MESSAGES.BACKEND_UNAVAILABLE;
  return message || ERROR_MESSAGES.SERVER_ERROR;
}
