import { AuditLogEvent, BillingStatus, CommercialDiagnosis, Company, CreditAccount, DashboardMetrics, DigitalAudit, EmailSequenceTemplate, EnrichmentJob, ForecastReport, GoogleIntelligence, InboxConversation, KeywordSuggestion, MonthlyTrend, Operator, OperatorGoal, OperatorMetrics, PipelineReport, Plan, QueueStatus, SavedSearch, SequenceInstance, UsageEvent } from "./types";
import { getApiBaseUrl } from "./apiBase";

const API_URL = getApiBaseUrl();
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
const USER_TOKEN_KEY = "nodere_admin_token";

export class ApiRequestError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

export const emptyDashboard: DashboardMetrics = {
  totalCompanies: 0,
  lowRating: 0,
  withoutWebsite: 0,
  withoutGoogleAds: 0,
  withoutWhatsapp: 0,
  withoutDescription: 0,
  withoutRecentPhotos: 0,
  averageScore: 0,
  hotLeads: 0,
  pipeline: {},
  topOpportunities: []
};

async function api<T>(path: string, options?: RequestInit, fallback?: T): Promise<T> {
  try {
    const sessionToken = typeof window !== "undefined" ? localStorage.getItem(USER_TOKEN_KEY) : "";
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
        ...(options?.headers ?? {})
      },
      cache: "no-store"
    });

    if (!response.ok) {
      let detail = "";
      try {
        const payload = await response.json();
        detail = payload?.message || payload?.error || "";
      } catch {
        detail = "";
      }
      throw new ApiRequestError(detail || `API retornou HTTP ${response.status}`, response.status);
    }
    return (await response.json()) as T;
  } catch (error) {
    if (fallback !== undefined) return fallback;
    if (error instanceof ApiRequestError) throw error;
    throw new ApiRequestError(
      `Nao foi possivel conectar ao backend em ${API_URL}${path}. Verifique NEXT_PUBLIC_API_URL/Vercel e CORS no Render.`
    );
  }
}

export function getDashboard() {
  return api<DashboardMetrics>("/dashboard", undefined, emptyDashboard);
}

export function getCompanies() {
  return api<Company[]>("/companies");
}

export function getCompany(id: string) {
  return api<Company>(`/companies/${id}`);
}

export function searchCompanies(payload: { city?: string; state?: string; segment?: string; keyword?: string; companyName?: string; limit?: number }) {
  return api<{
    companies: Company[];
    search: {
      source?: "google" | "mock" | "fallback";
      warning?: string;
      error?: { message?: string; activationUrl?: string; reason?: string; code?: string; status?: number };
    };
  }>("/searches", { method: "POST", body: JSON.stringify(payload) });
}

export function updateCompanyStatus(id: string, status: string) {
  return api<Company>(`/companies/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
}

export function addCompanyNote(id: string, body: string) {
  return api(`/companies/${id}/notes`, { method: "POST", body: JSON.stringify({ body }) });
}

export function getSearchHistory() {
  return api<SavedSearch[]>("/searches", undefined, []);
}

export function rerunSearch(id: string) {
  return api<{ search: SavedSearch; companies: Company[] }>(`/searches/${id}/rerun`, { method: "POST" });
}

export function getEnrichmentQueue() {
  return api<QueueStatus>("/enrichment", undefined, { total: 0, pending: 0, running: 0, done: 0, error: 0, jobs: [] });
}

export function triggerEnrichment(companyId: string) {
  return api<EnrichmentJob>(`/companies/${companyId}/analyze`, { method: "POST" });
}

export function enrichCompanyExternal(companyId: string) {
  return api<{ company: Company; enrichment: { messages: string[]; enrichmentSources: string[] } }>(`/companies/${companyId}/enrich-external`, { method: "POST" });
}

export function getCompanyAudit(companyId: string) {
  return api<DigitalAudit>(`/companies/${companyId}/audit`);
}

export function getCompanyIntelligence(companyId: string) {
  return api<GoogleIntelligence>(`/companies/${companyId}/intelligence`);
}

export function getCompanyKeywords(companyId: string) {
  return api<KeywordSuggestion[]>(`/companies/${companyId}/keywords`, undefined, []);
}

export function getCredits() {
  return api<CreditAccount>("/credits", undefined, { balance: 0, used: 0, plan: "Sem plano ativo", resetAt: "" });
}

export function generateDiagnosis(companyId: string) {
  return api<CommercialDiagnosis>(`/companies/${companyId}/diagnosis`, { method: "POST" });
}

export function getDiagnosis(companyId: string) {
  return api<CommercialDiagnosis>(`/companies/${companyId}/diagnosis`);
}

export function getInbox() {
  return api<InboxConversation[]>("/inbox", undefined, []);
}

export function getConversation(phone: string) {
  return api<InboxConversation>(`/inbox/${phone}`);
}

export function replyToConversation(phone: string, message: string, companyId?: string) {
  return api(`/inbox/${phone}/reply`, { method: "POST", body: JSON.stringify({ message, companyId }) });
}

export function resolveConversation(phone: string) {
  return api(`/inbox/${phone}/resolve`, { method: "PATCH" });
}

export function getSequenceTemplates() {
  return api<EmailSequenceTemplate[]>("/sequences", undefined, []);
}

export function getSequenceInstances() {
  return api<SequenceInstance[]>("/sequences/instances", undefined, []);
}

export function activateSequence(companyId: string, templateId: string) {
  return api<SequenceInstance>(`/companies/${companyId}/sequences`, { method: "POST", body: JSON.stringify({ templateId }) });
}

export function cancelSequence(instanceId: string) {
  return api(`/sequences/instances/${instanceId}`, { method: "DELETE" });
}

export function getCompanySequences(companyId: string) {
  return api<SequenceInstance[]>(`/companies/${companyId}/sequences`, undefined, []);
}

// Phase 6 — Revenue Operations

export function getBillingStatus() {
  return api<BillingStatus>("/billing", undefined, {
    plan: { id: "demo", name: "Sem plano ativo", monthlyCredits: 0, priceMonthly: 0, features: [] },
    balance: 0, used: 0, resetAt: "", gated: true
  });
}

export function getBillingPlans() {
  return api<Plan[]>("/billing/plans", undefined, []);
}

export function getUsageLog(limit = 100) {
  return api<UsageEvent[]>(`/billing/usage?limit=${limit}`, undefined, []);
}

export function createCheckoutSession(planId: string) {
  return api<{ url: string }>("/billing/checkout", { method: "POST", body: JSON.stringify({ planId }) });
}

export function createPortalSession(customerId: string) {
  return api<{ url: string }>("/billing/portal", { method: "POST", body: JSON.stringify({ customerId }) });
}

export function getOperators() {
  return api<Operator[]>("/operators", undefined, []);
}

export function createOperator(payload: { name: string; email?: string; role?: "admin" | "operator" }) {
  return api<Operator>("/operators", { method: "POST", body: JSON.stringify(payload) });
}

export function getOperatorRanking() {
  return api<OperatorMetrics[]>("/operators/ranking", undefined, []);
}

export function getOperatorGoals(operatorId: string) {
  return api<OperatorGoal | null>(`/operators/${operatorId}/goals`, undefined, null);
}

export function setOperatorGoals(operatorId: string, goals: Omit<OperatorGoal, "operatorId" | "month">) {
  return api<OperatorGoal>(`/operators/${operatorId}/goals`, { method: "PUT", body: JSON.stringify(goals) });
}

export function getPipelineReport() {
  return api<PipelineReport>("/reports/pipeline");
}

export function getForecastReport() {
  return api<ForecastReport>("/reports/forecast");
}

export function getMonthlyTrends() {
  return api<MonthlyTrend[]>("/reports/trends", undefined, []);
}

export function getAuditLog(limit = 100) {
  return api<AuditLogEvent[]>(`/audit?limit=${limit}`, undefined, []);
}

export function getIntegrations() {
  return api<Array<{ key?: string; name: string; configured: boolean; required: boolean; capability?: string }>>("/integrations", undefined, []);
}

export function getPublicSettings() {
  return api<{
    preferences?: Record<string, unknown>;
    pipeline?: { stages?: string[]; stageColors?: Record<string, string> };
    enabledIntegrations?: Record<string, boolean>;
    status?: string;
  }>("/settings");
}

export function savePublicSettings(settings: Record<string, unknown>) {
  return api<{ ok: boolean; settings: Record<string, unknown>; message?: string }>("/settings", {
    method: "PATCH",
    body: JSON.stringify(settings)
  });
}

export function savePipelineSettings(pipeline: { stages: string[]; stageColors: Record<string, string> }) {
  return api<{ ok: boolean; pipeline: { stages?: string[]; stageColors?: Record<string, string> }; message?: string }>("/settings/pipeline", {
    method: "PATCH",
    body: JSON.stringify(pipeline)
  });
}
