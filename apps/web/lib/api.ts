import { AuditLogEvent, BillingStatus, CommercialDiagnosis, Company, CreditAccount, DashboardMetrics, DigitalAudit, EmailSequenceTemplate, EnrichmentJob, ForecastReport, GoogleIntelligence, InboxConversation, KeywordSuggestion, MonthlyTrend, Operator, OperatorGoal, OperatorMetrics, PipelineReport, Plan, QueueStatus, SavedSearch, SequenceInstance, UsageEvent } from "./types";
import { getApiBaseUrl } from "./apiBase";
import { getErrorMessage } from "./errors";

const API_URL = getApiBaseUrl();
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
const USER_TOKEN_KEY = "nodere_admin_token";

function authHeaders(token?: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function companyPath(id: string, suffix = "") {
  return `/companies/${encodeURIComponent(id)}${suffix}`;
}

export class ApiRequestError extends Error {
  status?: number;
  code?: string;
  payload?: unknown;

  constructor(message: string, status?: number, payload?: unknown) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.payload = payload;
    if (payload && typeof payload === "object" && "code" in payload) {
      this.code = String((payload as { code?: unknown }).code || "");
    }
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

function withAuthToken(token?: string | null): RequestInit | undefined {
  return token ? { headers: authHeaders(token) } : undefined;
}

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
      let payload: unknown;
      try {
        payload = await response.json();
        const data = payload as { message?: string; error?: string; code?: string };
        detail = data?.message || data?.error || "";
      } catch {
        detail = "";
      }
      throw new ApiRequestError(getErrorMessage(new Error(detail || `API retornou HTTP ${response.status}`)), response.status, payload);
    }
    try {
      return (await response.json()) as T;
    } catch {
      throw new ApiRequestError(`Resposta inválida do backend em ${API_URL}${path}.`, response.status);
    }
  } catch (error) {
    if (fallback !== undefined) return fallback;
    if (error instanceof ApiRequestError) throw error;
    throw new ApiRequestError(getErrorMessage(error));
  }
}

export function getDashboard(token?: string | null) {
  return api<DashboardMetrics>("/dashboard", withAuthToken(token), emptyDashboard);
}

export function getCompanies(token?: string | null) {
  return api<Company[]>("/companies", withAuthToken(token));
}

export function searchCompanyOptions(q: string, limit = 10) {
  return api<{ companies: Array<Pick<Company, "id" | "name" | "category" | "city" | "state" | "status" | "score">> }>(
    `/companies/search?q=${encodeURIComponent(q)}&limit=${encodeURIComponent(String(limit))}`,
    undefined,
    { companies: [] }
  );
}

export function getSavedCompanyIds() {
  return api<string[]>("/companies/saved-ids", undefined, []);
}

export function getCompany(id: string, token?: string | null) {
  return api<Company>(companyPath(id), token ? { headers: authHeaders(token) } : undefined);
}

export function createCompany(payload: {
  name: string;
  legalName?: string;
  cnpj?: string;
  category?: string;
  address?: string;
  city?: string;
  state?: string;
  cep?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  youtube?: string;
  principalContact?: string;
  principalContactRole?: string;
  notes?: string;
  status?: string;
  temperature?: string;
  serviceInterest?: string;
}) {
  return api<Company>("/companies", { method: "POST", body: JSON.stringify(payload) });
}

export function createLead(payload: {
  name: string;
  legalName?: string;
  cnpj?: string;
  category?: string;
  address?: string;
  city?: string;
  state?: string;
  cep?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  status?: string;
  temperature?: string;
  serviceInterest?: string;
  notes?: string;
}) {
  return api<Company>("/leads", { method: "POST", body: JSON.stringify(payload) });
}

export function updateLeadStage(id: string, newStage: string, reason?: string) {
  return api<Company>(`/leads/${encodeURIComponent(id)}/stage`, {
    method: "PATCH",
    body: JSON.stringify({ newStage, reason })
  });
}

export function getLeadActivities(id: string) {
  return api<Array<Record<string, unknown>>>(`/leads/${encodeURIComponent(id)}/activities`, undefined, []);
}

export function addLeadActivity(id: string, payload: { type: string; title?: string; body?: string; content?: string }) {
  return api<Record<string, unknown>>(`/leads/${encodeURIComponent(id)}/activities`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getLeadContacts(id: string) {
  return api<Array<Record<string, unknown>>>(`/leads/${encodeURIComponent(id)}/contacts`, undefined, []);
}

export function addLeadContact(id: string, payload: Record<string, unknown>) {
  return api<Record<string, unknown>>(`/leads/${encodeURIComponent(id)}/contacts`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getLeadDeals(id: string) {
  return api<Array<Record<string, unknown>>>(`/leads/${encodeURIComponent(id)}/deals`, undefined, []);
}

export function addLeadDeal(id: string, payload: Record<string, unknown>) {
  return api<Record<string, unknown>>(`/leads/${encodeURIComponent(id)}/deals`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function searchCompanies(payload: { mode?: "places" | "cnpj" | "global"; city?: string; state?: string; country?: string; segment?: string; keyword?: string; companyName?: string; limit?: number; lat?: number; lng?: number; radiusKm?: number; minRating?: number; maxRating?: number; hasWebsite?: boolean | null; hasWhatsApp?: boolean | null; minReviews?: number; sortBy?: "relevance" | "rating" | "review_count" | "nodere_score"; sortDir?: "asc" | "desc" }, signal?: AbortSignal) {
  return api<{
    companies: Company[];
    search: {
      source?: "google" | "mock" | "fallback";
      warning?: string;
      error?: { message?: string; activationUrl?: string; reason?: string; code?: string; status?: number };
    };
  }>("/searches", { method: "POST", body: JSON.stringify(payload), signal });
}

export function searchCompanyByCnpj(cnpj: string) {
  return api<{ company: Company; source: "receitaws" }>(`/search/cnpj?q=${encodeURIComponent(cnpj)}`);
}

export function getWorkspaceSegments() {
  return api<{ segments: string[]; predefined: string[]; custom: string[] }>("/workspace/segments");
}

export function saveWorkspaceSegment(segment: string) {
  return api<{ segments: string[]; predefined: string[]; custom: string[] }>("/workspace/segments", {
    method: "POST",
    body: JSON.stringify({ segment })
  });
}


export function searchApollo(payload: {
  type?: "companies" | "people";
  companyName?: string;
  domain?: string;
  personName?: string;
  title?: string;
  city?: string;
  state?: string;
  country?: string;
  page?: number;
  perPage?: number;
}) {
  return api<{
    source: "apollo";
    type: "companies" | "people";
    count: number;
    results: Array<Record<string, string | number | undefined>>;
  }>("/searches/apollo", { method: "POST", body: JSON.stringify(payload) });
}

export function discoverySearch(payload: { companyName?: string; segment?: string; keyword?: string; city?: string; state?: string; country?: string; limit?: number; lat?: number; lng?: number; radiusKm?: number }) {
  return api<{ source: "google" | "mock" | "google_places"; warning?: string; companies: Company[] }>(
    "/discovery/search",
    { method: "POST", body: JSON.stringify(payload) }
  );
}

export function discoveryScanWebsite(payload: { url: string; companyId?: string }) {
  return api<{ scan: Record<string, unknown> }>("/discovery/scan-website", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function discoveryOpportunities(payload: { company?: Partial<Company>; companyId?: string; websiteScan?: Record<string, unknown> }) {
  return api<{ score: number; opportunityLevel: string; detectedOpportunities: string[]; suggestions: string[] }>(
    "/discovery/opportunities",
    { method: "POST", body: JSON.stringify(payload) }
  );
}

export function discoveryScanSocial(payload: { website?: string; domain?: string; companyName?: string; companyId?: string }) {
  return api<{ social: { instagram?: string; facebook?: string; linkedin?: string; youtube?: string; searches?: Record<string, string | undefined> } }>(
    "/discovery/scan-social",
    { method: "POST", body: JSON.stringify(payload) }
  );
}

export function discoveryAddToCrm(company: Partial<Company>) {
  return api<{ company: Company }>("/discovery/add-to-crm", {
    method: "POST",
    body: JSON.stringify({ company })
  });
}

export function generateAiDiagnosis(payload: { lead_id?: string; company_data?: Partial<Company> }) {
  return api<{ diagnosis: string }>("/ai/diagnosis", { method: "POST", body: JSON.stringify(payload) });
}

export function generateAiWhatsappMessage(payload: { lead_id?: string; company_data?: Partial<Company>; approach_type?: "first_contact" | "follow_up" | "proposal" | "recovery" }) {
  return api<{ message: string }>("/ai/whatsapp-message", { method: "POST", body: JSON.stringify(payload) });
}

export function generateAiCallScript(payload: { lead_id?: string; company_data?: Partial<Company> }) {
  return api<{ script: string }>("/ai/call-script", { method: "POST", body: JSON.stringify(payload) });
}

export function generateAiNextStep(payload: { lead_data: Record<string, unknown>; activities_summary?: string }) {
  return api<{ suggestion: string }>("/ai/next-step", { method: "POST", body: JSON.stringify(payload) });
}
export function geocodeAddress(address: string) {
  return api<{ status: string; results: Array<{ address?: string; lat?: number; lng?: number }> }>(`/geocode?address=${encodeURIComponent(address)}`);
}

export function getProposalTemplates() {
  return api<Array<{ id: string; name: string; service_type: string; content: string; variables?: string[] }>>("/proposals/templates", undefined, []);
}

export function generateProposal(payload: { template_id: string; lead_id: string; enhance?: boolean }) {
  return api<{ content: string }>("/proposals/generate", { method: "POST", body: JSON.stringify(payload) });
}

export function saveProposalVersion(payload: { lead_id: string; content: string; service_type?: string; generated_by?: "user" | "ai" }) {
  return api("/proposals/versions", { method: "POST", body: JSON.stringify(payload) });
}

export type ProposalItemPayload = {
  description: string;
  quantity: number;
  unit_price: number;
  total?: number;
};

export type NodereProposal = {
  id: string;
  workspace_id: string;
  lead_id: string;
  title: string;
  status: "draft" | "sent" | "accepted" | "rejected" | "expired";
  service_type?: string | null;
  content?: string | null;
  items: ProposalItemPayload[];
  subtotal: number;
  discount: number;
  total: number;
  currency: string;
  valid_until?: string | null;
  version: number;
  created_at?: string;
  updated_at?: string;
};

export function getProposals() {
  return api<NodereProposal[]>("/proposals", undefined, []);
}

export function createProposal(payload: {
  lead_id: string;
  title: string;
  service_type?: string;
  content?: string;
  items: ProposalItemPayload[];
  discount?: number;
  status?: NodereProposal["status"];
  valid_until?: string | null;
}) {
  return api<NodereProposal>("/proposals", { method: "POST", body: JSON.stringify(payload) });
}

export async function downloadProposalPdf(id: string, fileName = "proposta-nodere.pdf") {
  const sessionToken = typeof window !== "undefined" ? localStorage.getItem(USER_TOKEN_KEY) : "";
  const response = await fetch(`${API_URL}/proposals/${encodeURIComponent(id)}/pdf`, {
    method: "POST",
    headers: {
      ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {})
    }
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new ApiRequestError(payload.message || `API retornou HTTP ${response.status}`, response.status, payload);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function getCrmCards(params = "") {
  return api<{ data: Company[]; total: number; page: number; limit: number }>(`/crm/cards${params}`, undefined, { data: [], total: 0, page: 1, limit: 25 });
}

export function importCompaniesCsv(csv: string, column_map?: Record<string, string>) {
  return api<{ imported: number; duplicates: number; errors: Array<{ row: number; reason: string }> }>("/companies/import", {
    method: "POST",
    body: JSON.stringify({ csv, column_map })
  });
}

export async function importCompaniesFile(file: File, column_map?: Record<string, string>) {
  const sessionToken = typeof window !== "undefined" ? localStorage.getItem(USER_TOKEN_KEY) : "";
  const form = new FormData();
  form.append("file", file);
  if (column_map) form.append("column_map", JSON.stringify(column_map));
  const response = await fetch(`${API_URL}/companies/import`, {
    method: "POST",
    headers: {
      ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {})
    },
    body: form,
    cache: "no-store"
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiRequestError(payload.message || payload.error || `API retornou HTTP ${response.status}`, response.status);
  return payload as { imported: number; duplicates: number; errors: Array<{ row: number; reason: string }> };
}

export function updateCompanyStatus(id: string, status: string) {
  return api<Company>(companyPath(id, "/status"), { method: "PATCH", body: JSON.stringify({ status }) });
}

export function updateCompany(id: string, updates: Partial<Company>) {
  return api<Company>(companyPath(id), { method: "PATCH", body: JSON.stringify(updates) });
}

export function addCompanyNote(id: string, body: string) {
  return api(companyPath(id, "/notes"), { method: "POST", body: JSON.stringify({ body }) });
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
  return api<EnrichmentJob>(companyPath(companyId, "/analyze"), { method: "POST" });
}

export function enrichCompanyExternal(companyId: string) {
  return api<{ company: Company; enrichment: { messages: string[]; enrichmentSources: string[] } }>(companyPath(companyId, "/enrich-external"), { method: "POST" });
}

export function getCompanyAudit(companyId: string, token?: string | null) {
  return api<DigitalAudit>(companyPath(companyId, "/audit"), token ? { headers: authHeaders(token) } : undefined);
}

export function getCompanyIntelligence(companyId: string, token?: string | null) {
  return api<GoogleIntelligence>(companyPath(companyId, "/intelligence"), token ? { headers: authHeaders(token) } : undefined);
}

export function getCompanyKeywords(companyId: string) {
  return api<KeywordSuggestion[]>(companyPath(companyId, "/keywords"), undefined, []);
}

export function getCredits() {
  return api<CreditAccount>("/credits", undefined, { balance: 0, used: 0, plan: "Sem plano ativo", resetAt: "" });
}

export type CreditStatus = {
  total: number;
  used: number;
  remaining: number;
  plan: string;
  expires_at?: string | null;
  trial_expires_at?: string | null;
  renewal_at?: string | null;
  resetAt?: string | null;
  blocked?: boolean;
  trialExpired?: boolean;
};

export function getCreditStatus() {
  return api<CreditStatus>("/credits/status", undefined, {
    total: 0,
    used: 0,
    remaining: 0,
    plan: "Sem plano ativo",
    expires_at: null,
    trial_expires_at: null,
    renewal_at: null,
    resetAt: "",
    blocked: true,
    trialExpired: false
  });
}

export type OnboardingStatus = {
  workspace_id?: string;
  step_search_completed: boolean;
  step_crm_completed: boolean;
  step_proposal_completed: boolean;
  completed_at?: string | null;
};

export function getOnboardingStatus() {
  return api<OnboardingStatus>("/onboarding/status", undefined, {
    step_search_completed: false,
    step_crm_completed: false,
    step_proposal_completed: false,
    completed_at: null
  });
}

export function markOnboardingStep(step: "search" | "crm" | "proposal") {
  return api<OnboardingStatus>("/onboarding/step", {
    method: "PATCH",
    body: JSON.stringify({ step })
  });
}

export function generateDiagnosis(companyId: string) {
  return api<CommercialDiagnosis>(companyPath(companyId, "/diagnosis"), { method: "POST" });
}

export function getDiagnosis(companyId: string) {
  return api<CommercialDiagnosis>(companyPath(companyId, "/diagnosis"));
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
  return api<SequenceInstance>(companyPath(companyId, "/sequences"), { method: "POST", body: JSON.stringify({ templateId }) });
}

export function cancelSequence(instanceId: string) {
  return api(`/sequences/instances/${instanceId}`, { method: "DELETE" });
}

export function getCompanySequences(companyId: string) {
  return api<SequenceInstance[]>(companyPath(companyId, "/sequences"), undefined, []);
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

export function getBillingPlanLinks() {
  return api<{ starter: string | null; pro: string | null; agency: string | null }>("/billing/plan-links", undefined, {
    starter: null,
    pro: null,
    agency: null
  });
}

export function joinBillingWaitlist(payload: { email: string; plan?: "starter" | "pro" | "agency" }) {
  return api<{ ok: boolean; item?: { id?: string; email?: string; plan?: string; created_at?: string } }>("/billing/waitlist", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getUsageLog(limit = 100) {
  return api<UsageEvent[]>(`/billing/usage?limit=${limit}`, undefined, []);
}

export function createCheckoutSession(planId: string, billingCycle: "monthly" | "yearly" = "monthly") {
  return api<{ url: string }>("/billing/checkout", {
    method: "POST",
    body: JSON.stringify({ plan: planId, planId, billingCycle })
  });
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

export function getPipelineReport(token?: string | null) {
  return api<PipelineReport>("/reports/pipeline", withAuthToken(token));
}

export function getForecastReport(token?: string | null) {
  return api<ForecastReport>("/reports/forecast", withAuthToken(token));
}

export function getMonthlyTrends() {
  return api<MonthlyTrend[]>("/reports/trends", undefined, []);
}

export function getReportSummary(period = "30d", token?: string | null) {
  return api<{
    total_companies: number;
    total_leads_in_crm: number;
    avg_score: number;
    conversion_rate: number;
    credits_used: number;
    new_this_period: number;
    funnel?: Array<{ stage: string; count: number; conversion_from_prev: number }>;
  }>(`/reports/summary?period=${encodeURIComponent(period)}`, withAuthToken(token));
}

export function getReportFunnel(period = "30d") {
  return api<{ stages: Array<{ name: string; count: number; pct_of_total: number; conversion_from_previous: number }> }>(`/reports/funnel?period=${encodeURIComponent(period)}`);
}

export function getReportTimeline(period = "30d", groupBy = "day") {
  return api<{ data: Array<{ date: string; count: number }> }>(`/reports/timeline?period=${encodeURIComponent(period)}&group_by=${encodeURIComponent(groupBy)}`);
}

export function getReportSegments(period = "30d") {
  return api<{ segments: Array<{ segment: string; count: number; avg_score: number }> }>(`/reports/segments?period=${encodeURIComponent(period)}`);
}

export function getReportCities(period = "30d") {
  return api<{ cities: Array<{ city: string; state?: string; count: number }> }>(`/reports/cities?period=${encodeURIComponent(period)}`);
}

export function getReportOrigin(period = "30d") {
  return api<{ origins: Array<{ source: string; count: number }> }>(`/reports/origin?period=${encodeURIComponent(period)}`);
}

export function getReportIntelligence(period = "30d") {
  return api<{
    pct_with_site: number;
    pct_with_google_ads: number;
    pct_with_meta_pixel: number;
    pct_with_ga4: number;
    pct_with_gtm: number;
    pct_with_whatsapp: number;
    avg_pagespeed_mobile: number;
  }>(`/reports/intelligence?period=${encodeURIComponent(period)}`);
}

export function getReportProposals(period = "30d") {
  return api<{
    by_status: Array<{ status: string; count: number; value: number }>;
    pipeline_value: number;
    accepted_value: number;
    warning?: string;
  }>(`/reports/proposals?period=${encodeURIComponent(period)}`, undefined, { by_status: [], pipeline_value: 0, accepted_value: 0 });
}

export function getReportOperators() {
  return api<Array<{
    user_id: string;
    name: string;
    email?: string;
    role?: string;
    leads_created: number;
    followups_done: number;
    leads_closed: number;
    conversion_rate: number;
    last_active?: string;
  }>>("/reports/operators", undefined, []);
}

export async function downloadReportPdf(period = "30d", groupBy = "day") {
  const sessionToken = typeof window !== "undefined" ? localStorage.getItem(USER_TOKEN_KEY) : "";
  const response = await fetch(`${API_URL}/reports/pdf`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {})
    },
    body: JSON.stringify({ period, groupBy }),
    cache: "no-store"
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new ApiRequestError(payload.message || payload.error || `API retornou HTTP ${response.status}`, response.status);
  }
  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/i);
  const fileName = match?.[1] || `relatorio-nodere-${Date.now()}.pdf`;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function getAuditLog(limit = 100) {
  return api<AuditLogEvent[]>(`/audit?limit=${limit}`, undefined, []);
}

export function getIntegrations() {
  return api<Array<{
    key?: string;
    name: string;
    configured: boolean;
    status?: "ok" | "not_configured" | "error" | "timeout";
    required: boolean;
    capability?: string;
    message?: string;
    missingEnv?: string[];
  }>>("/integrations", undefined, []);
}

export function getIntegrationsStatus() {
  return api<{
    readyForRealSearch: boolean;
    configured: number;
    total: number;
    checkedAt: string;
    integrations: Array<{
      key?: string;
      name: string;
      configured: boolean;
      status?: "ok" | "not_configured" | "error" | "timeout";
      required: boolean;
      capability?: string;
      message?: string;
      missingEnv?: string[];
    }>;
  }>("/integrations/status", undefined, {
    readyForRealSearch: false,
    configured: 0,
    total: 0,
    checkedAt: new Date().toISOString(),
    integrations: []
  });
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

export interface CalendarEvent {
  id: string;
  company_id?: string;
  contact_id?: string;
  title: string;
  type: string;
  priority: string;
  start_at: string;
  end_at: string;
  notes?: string;
  assigned_to?: string;
  created_by?: string;
  status?: string;
  channel?: string;
  reminder_at?: string;
  reminder_minutes?: number;
  reminder_enabled?: boolean;
  metadata?: Record<string, unknown>;
}

export function getCalendarEvents(params = "") {
  return api<CalendarEvent[]>(`/calendar${params}`, undefined, []);
}

export function createCalendarEvent(payload: {
  companyId?: string;
  contactId?: string;
  title: string;
  type: string;
  priority: string;
  startAt: string;
  endAt: string;
  notes?: string;
  assignedTo?: string;
  status?: string;
  channel?: string;
  reminderAt?: string | null;
  reminderMinutes?: number | null;
  reminderEnabled?: boolean;
  metadata?: Record<string, unknown>;
}) {
  return api<CalendarEvent>("/calendar", { method: "POST", body: JSON.stringify(payload) });
}

export function updateCalendarEvent(id: string, payload: Partial<{
  companyId: string | null;
  contactId: string | null;
  title: string;
  type: string;
  priority: string;
  startAt: string;
  endAt: string;
  notes: string;
  assignedTo: string | null;
  status: string;
  channel: string | null;
  reminderAt: string | null;
  reminderMinutes: number | null;
  reminderEnabled: boolean;
  metadata: Record<string, unknown>;
}>) {
  return api<CalendarEvent>(`/calendar/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export function deleteCalendarEvent(id: string) {
  return api<{ ok: boolean }>(`/calendar/${id}`, { method: "DELETE" });
}

export interface InboxMessage {
  id: string;
  company_id?: string;
  contact_id?: string;
  type: "whatsapp" | "email" | "ligacao" | "reuniao" | "interno" | "manual";
  direction: "inbound" | "outbound" | "manual";
  status: "unread" | "read" | "flagged" | "resolved";
  subject?: string;
  body?: string;
  phone_from?: string;
  phone_to?: string;
  flag_color?: string;
  sent_by?: string;
  sent_at?: string;
  created_at?: string;
  metadata?: Record<string, unknown>;
  company?: Company;
}

export function getInboxMessages(params = "") {
  return api<{ messages: InboxMessage[]; total: number; page: number; limit: number }>(`/inbox${params}`, undefined, { messages: [], total: 0, page: 1, limit: 50 });
}

export function createInboxMessage(payload: Partial<InboxMessage> & {
  body: string;
  companyId?: string;
  contactId?: string;
  phoneFrom?: string;
  phoneTo?: string;
  flagColor?: string;
  sentBy?: string;
  sentAt?: string;
}) {
  return api<InboxMessage>("/inbox", { method: "POST", body: JSON.stringify(payload) });
}

export function updateInboxMessage(id: string, payload: Partial<Pick<InboxMessage, "status" | "flag_color" | "body" | "subject">>) {
  return api<InboxMessage>(`/inbox/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export function getInboxUnreadCount() {
  return api<{ unread: number }>("/inbox/unread-count", undefined, { unread: 0 });
}

export interface CatalogItem {
  id: string;
  code: string;
  name: string;
  commercial_name?: string;
  category: string;
  subcategory?: string;
  brand?: string;
  image_url?: string;
  images?: string[];
  type: "product" | "service";
  status: "active" | "inactive";
  description_short: string;
  description_full?: string;
  features?: string;
  benefits?: string;
  differentials?: string;
  target_audience?: string;
  use_cases?: string;
  cost: number;
  price: number;
  commission_pct?: number;
  max_discount_pct?: number;
  promotional_price?: number;
  promotion_expires_at?: string;
  supplier?: string;
  delivery_days?: number;
  warranty?: string;
  exchange_policy?: string;
  cancellation_policy?: string;
  payment_conditions?: string;
  installments_available?: number;
  unit_measure?: string;
  weight_kg?: number;
  height_cm?: number;
  width_cm?: number;
  length_cm?: number;
  color?: string;
  material?: string;
  model?: string;
  voltage?: string;
  technical_specs?: string;
  execution_time?: string;
  scope?: string;
  limitations?: string;
  deliverables?: string;
  complexity?: string;
  sla?: string;
  stock_current?: number;
  stock_min?: number;
  stock_max?: number;
  stock_location?: string;
  market_segment?: string;
  campaign_url?: string;
}

export function getCatalogItems(params = "") {
  return api<CatalogItem[]>(`/catalog${params}`, undefined, []);
}

export function createCatalogItem(payload: {
  code?: string;
  name: string;
  commercialName?: string;
  category: string;
  subcategory?: string;
  brand?: string;
  image_url?: string;
  images?: string[];
  type: "product" | "service";
  descriptionShort: string;
  descriptionFull?: string;
  features?: string;
  benefits?: string;
  differentials?: string;
  targetAudience?: string;
  useCases?: string;
  cost: number;
  price: number;
  commissionPct?: number;
  maxDiscountPct?: number;
  promotionalPrice?: number;
  promotionExpiresAt?: string;
  supplier?: string;
  deliveryDays?: number;
  warranty?: string;
  exchangePolicy?: string;
  cancellationPolicy?: string;
  paymentConditions?: string;
  installmentsAvailable?: number;
  unitMeasure?: string;
  weightKg?: number;
  heightCm?: number;
  widthCm?: number;
  lengthCm?: number;
  color?: string;
  material?: string;
  model?: string;
  voltage?: string;
  technicalSpecs?: string;
  executionTime?: string;
  scope?: string;
  limitations?: string;
  deliverables?: string;
  complexity?: string;
  sla?: string;
  stockCurrent?: number;
  stockMin?: number;
  stockMax?: number;
  stockLocation?: string;
  marketSegment?: string;
  campaignUrl?: string;
}) {
  return api<CatalogItem>("/catalog", { method: "POST", body: JSON.stringify(payload) });
}

export interface MessageTemplate {
  id: string;
  name: string;
  channel: "whatsapp" | "email" | "linkedin" | "instagram_dm";
  subject?: string;
  body: string;
  variables?: string[];
}

export interface Campaign {
  id: string;
  name: string;
  platforms: string[];
  start_date?: string;
  end_date?: string;
  status: string;
  budget_brl?: number;
  notes?: string;
}

export function getMarketingTemplates() {
  return api<MessageTemplate[]>("/marketing/templates", undefined, []);
}

export function createMarketingTemplate(payload: { name: string; channel: "whatsapp" | "email" | "linkedin" | "instagram_dm"; subject?: string; body: string; variables?: string[] }) {
  return api<MessageTemplate>("/marketing/templates", { method: "POST", body: JSON.stringify(payload) });
}

export function updateMarketingTemplate(id: string, payload: Partial<{ name: string; channel: "whatsapp" | "email" | "linkedin" | "instagram_dm"; subject?: string; body: string; variables?: string[] }>) {
  return api<MessageTemplate>(`/marketing/templates/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export function deleteMarketingTemplate(id: string) {
  return api<{ ok: boolean }>(`/marketing/templates/${id}`, { method: "DELETE" });
}

export function getCampaigns() {
  return api<Campaign[]>("/marketing/campaigns", undefined, []);
}

export function createCampaign(payload: { name: string; platforms: string[]; startDate?: string; endDate?: string; status?: string; budgetBrl?: number; notes?: string }) {
  return api<Campaign>("/marketing/campaigns", { method: "POST", body: JSON.stringify(payload) });
}

export function getSocialStatus() {
  return api<{
    platforms: Array<{ key: string; name: string; provider?: string; category?: string; color?: string; configured: boolean; requiredEnv: string[]; scope?: string }>;
    mlabs: { configured: boolean; type: string; url: string; message: string };
  }>("/marketing/social/status", undefined, { platforms: [], mlabs: { configured: true, type: "workflow_shortcut", url: "https://app.mlabs.com.br", message: "Atalho operacional." } });
}


