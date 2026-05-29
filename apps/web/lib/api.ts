import { Company, CreditAccount, DashboardMetrics, DigitalAudit, EnrichmentJob, QueueStatus, SavedSearch } from "./types";
import { mockCompanies, mockDashboard } from "./mock";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

async function api<T>(path: string, options?: RequestInit, fallback?: T): Promise<T> {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers ?? {})
      },
      cache: "no-store"
    });

    if (!response.ok) throw new Error(`API ${response.status}`);
    return (await response.json()) as T;
  } catch {
    if (fallback !== undefined) return fallback;
    throw new Error("API unavailable");
  }
}

export function getDashboard() {
  return api<DashboardMetrics>("/dashboard", undefined, mockDashboard);
}

export function getCompanies() {
  return api<Company[]>("/companies", undefined, mockCompanies);
}

export function getCompany(id: string) {
  return api<Company>(`/companies/${id}`, undefined, mockCompanies.find((company) => company.id === id) ?? mockCompanies[0]);
}

export function searchCompanies(payload: { city: string; state?: string; segment: string; keyword?: string }) {
  return api<{
    companies: Company[];
    search: {
      source?: "google" | "mock" | "fallback";
      warning?: string;
      error?: { message?: string; activationUrl?: string; reason?: string; code?: string; status?: number };
    };
  }>(
    "/searches",
    { method: "POST", body: JSON.stringify(payload) },
    { companies: mockCompanies, search: { source: "fallback", warning: "API local indisponivel. Exibindo dados demonstrativos." } }
  );
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

export function getCompanyAudit(companyId: string) {
  return api<DigitalAudit>(`/companies/${companyId}/audit`);
}

export function getCredits() {
  return api<CreditAccount>("/credits", undefined, { balance: 200, used: 0, plan: "Demo", resetAt: "" });
}

export function getIntegrations() {
  return api<Array<{ key?: string; name: string; configured: boolean; required: boolean; capability?: string }>>("/integrations", undefined, [
    { key: "google_places", name: "Google Places API", configured: false, required: true, capability: "Busca empresas no Google." },
    { key: "google_maps", name: "Google Maps API", configured: false, required: true, capability: "Mapas, links e coordenadas." },
    { key: "google_business_profile", name: "Google Business Profile API", configured: false, required: false, capability: "OAuth preparado para perfis autorizados." },
    { key: "pagespeed", name: "Google PageSpeed Insights API", configured: false, required: false, capability: "Performance mobile para score." },
    { key: "whatsapp", name: "WhatsApp Cloud API", configured: false, required: false, capability: "Envio Cloud ou link wa.me." },
    { key: "openai", name: "OpenAI API", configured: false, required: false, capability: "Diagnosticos comerciais com IA." }
  ]);
}
