import { Company, DashboardMetrics } from "./types";
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
  return api<{ companies: Company[]; search: unknown }>(
    "/searches",
    { method: "POST", body: JSON.stringify(payload) },
    { companies: mockCompanies, search: payload }
  );
}

export function updateCompanyStatus(id: string, status: string) {
  return api<Company>(`/companies/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
}

export function addCompanyNote(id: string, body: string) {
  return api(`/companies/${id}/notes`, { method: "POST", body: JSON.stringify({ body }) });
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
