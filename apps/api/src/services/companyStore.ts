import { companies as seedData } from "../db/mockData.js";
import { Company, CrmStatus, SearchRequest } from "../types.js";
import { GoogleApiError, searchGooglePlaces } from "./google.js";
import { calculateOpportunityScore } from "./scoring.js";
import { config } from "../config.js";
import { getSupabase, hasSupabase } from "../db/supabase.js";
import { randomUUID } from "node:crypto";

// In-memory store (used when Supabase is not configured)
const memStore: Company[] = [...seedData];

// ─── Supabase helpers ────────────────────────────────────────────────────────

function toRow(c: Company): Record<string, unknown> {
  const { id, name, category, city, state, address, phone, whatsapp, website,
    instagram, facebook, linkedin, youtube, rating, reviewCount, mapsUrl,
    latitude, longitude, status, score, opportunityLevel, enrichmentStatus,
    lastContactAt, detectedOpportunities, suggestions, createdAt, updatedAt,
    notes, ...rest } = c;
  return {
    id, name, category, city, state, address, phone, whatsapp, website,
    instagram, facebook, linkedin, youtube, rating,
    review_count: reviewCount,
    maps_url: mapsUrl,
    latitude, longitude, status, score,
    opportunity_level: opportunityLevel,
    enrichment_status: enrichmentStatus ?? "none",
    last_contact_at: lastContactAt ?? null,
    detected_opportunities: detectedOpportunities,
    suggestions,
    digital_signals: rest,
    created_at: createdAt,
    updated_at: updatedAt
  };
}

function fromRow(row: Record<string, unknown>): Company {
  const signals = (row.digital_signals as Record<string, unknown>) ?? {};
  return {
    id: row.id as string,
    name: row.name as string,
    category: (row.category as string) ?? "",
    city: (row.city as string) ?? "",
    state: (row.state as string) ?? "",
    address: (row.address as string) ?? "",
    phone: row.phone as string | undefined,
    whatsapp: row.whatsapp as string | undefined,
    website: row.website as string | undefined,
    instagram: row.instagram as string | undefined,
    facebook: row.facebook as string | undefined,
    linkedin: row.linkedin as string | undefined,
    youtube: row.youtube as string | undefined,
    rating: row.rating as number | undefined,
    reviewCount: row.review_count as number | undefined,
    mapsUrl: row.maps_url as string | undefined,
    latitude: row.latitude as number | undefined,
    longitude: row.longitude as number | undefined,
    status: (row.status as CrmStatus) ?? "Novo Lead",
    score: (row.score as number) ?? 0,
    opportunityLevel: (row.opportunity_level as Company["opportunityLevel"]) ?? "Baixa",
    enrichmentStatus: (row.enrichment_status as Company["enrichmentStatus"]) ?? "none",
    lastContactAt: row.last_contact_at as string | undefined,
    detectedOpportunities: (row.detected_opportunities as string[]) ?? [],
    suggestions: (row.suggestions as string[]) ?? [],
    notes: [],
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
    updatedAt: (row.updated_at as string) ?? new Date().toISOString(),
    ...signals
  };
}

async function dbList(): Promise<Company[]> {
  const sb = getSupabase()!;
  const { data, error } = await sb
    .from("nodere_companies")
    .select("*, nodere_company_notes(id, company_id, body, created_at)")
    .order("score", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) => {
    const c = fromRow(row);
    c.notes = ((row.nodere_company_notes as Record<string, unknown>[] | undefined) ?? []).map((n) => ({
      id: n.id as string,
      companyId: n.company_id as string,
      body: n.body as string,
      createdAt: n.created_at as string
    }));
    return c;
  });
}

async function dbGet(id: string): Promise<Company | undefined> {
  const sb = getSupabase()!;
  const { data, error } = await sb
    .from("nodere_companies")
    .select("*, nodere_company_notes(id, company_id, body, created_at)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return undefined;
  const c = fromRow(data);
  c.notes = ((data.nodere_company_notes as Record<string, unknown>[]) ?? []).map((n) => ({
    id: n.id as string,
    companyId: n.company_id as string,
    body: n.body as string,
    createdAt: n.created_at as string
  }));
  return c;
}

async function dbUpsert(items: Company[]): Promise<void> {
  if (items.length === 0) return;
  const sb = getSupabase()!;
  const rows = items.map(toRow);
  const { error } = await sb.from("nodere_companies").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}

async function dbUpdateFields(id: string, fields: Record<string, unknown>): Promise<void> {
  const sb = getSupabase()!;
  const { error } = await sb.from("nodere_companies").update(fields).eq("id", id);
  if (error) throw error;
}

async function dbAddNote(companyId: string, body: string) {
  const sb = getSupabase()!;
  const note = { id: randomUUID(), company_id: companyId, body, created_at: new Date().toISOString() };
  const { error } = await sb.from("nodere_company_notes").insert(note);
  if (error) throw error;
  return { id: note.id, companyId, body, createdAt: note.created_at };
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function listCompaniesAsync(): Promise<Company[]> {
  if (hasSupabase()) {
    return dbList().catch(() => [...memStore].sort((a, b) => b.score - a.score));
  }
  return [...memStore].sort((a, b) => b.score - a.score);
}

export function listCompanies(): Company[] {
  return [...memStore].sort((a, b) => b.score - a.score);
}

export async function getCompanyAsync(id: string): Promise<Company | undefined> {
  if (hasSupabase()) {
    return dbGet(id).catch(() => memStore.find((c) => c.id === id));
  }
  return memStore.find((c) => c.id === id);
}

export function getCompany(id: string): Company | undefined {
  return memStore.find((c) => c.id === id);
}

export async function searchCompaniesWithMeta(input: SearchRequest) {
  if (config.useMockData) {
    const generated = generateMockSearch(input);
    syncToMem(generated);
    if (hasSupabase()) dbUpsert(generated).catch(() => {});
    return { source: "mock" as const, companies: generated, warning: "Modo demonstrativo ativo (USE_MOCK_DATA=true)." };
  }

  try {
    const generated = await searchGooglePlaces(input);
    const withStatus = generated.map((c) => ({ ...c, enrichmentStatus: "pending" as const }));
    syncToMem(withStatus);
    if (hasSupabase()) dbUpsert(withStatus).catch(() => {});
    queueEnrichmentForAll(withStatus);
    return { source: "google" as const, companies: withStatus };
  } catch (error) {
    if (error instanceof GoogleApiError) {
      const generated = generateMockSearch(input);
      syncToMem(generated);
      if (hasSupabase()) dbUpsert(generated).catch(() => {});
      return {
        source: "fallback" as const,
        companies: generated,
        warning: "Google Places indisponível. Exibindo dados demonstrativos.",
        error: {
          service: "Google Places",
          status: error.status,
          code: error.code,
          reason: error.reason,
          message: error.message,
          activationUrl: error.activationUrl
        }
      };
    }
    throw error;
  }
}

export async function searchCompanies(input: SearchRequest) {
  return (await searchCompaniesWithMeta(input)).companies;
}

export async function updateStatus(id: string, status: CrmStatus): Promise<Company | undefined> {
  const now = new Date().toISOString();
  const fields: Record<string, unknown> = { status, updated_at: now };
  if (status === "Contatado") fields.last_contact_at = now;

  if (hasSupabase()) {
    await dbUpdateFields(id, fields).catch(() => {});
  }
  const local = memStore.find((c) => c.id === id);
  if (local) {
    local.status = status;
    local.updatedAt = now;
    if (status === "Contatado") local.lastContactAt = now;
    return local;
  }
  if (hasSupabase()) return dbGet(id);
  return undefined;
}

export async function addNote(id: string, body: string) {
  const company = memStore.find((c) => c.id === id) ?? (hasSupabase() ? await dbGet(id) : undefined);
  if (!company) return undefined;

  if (hasSupabase()) {
    return dbAddNote(id, body).catch(() => {
      const note = { id: randomUUID(), companyId: id, body, createdAt: new Date().toISOString() };
      company.notes.unshift(note);
      return note;
    });
  }

  const note = { id: randomUUID(), companyId: id, body, createdAt: new Date().toISOString() };
  company.notes.unshift(note);
  company.updatedAt = note.createdAt;
  return note;
}

export async function updateCompany(id: string, updates: Partial<Company>): Promise<Company | undefined> {
  const now = new Date().toISOString();
  if (hasSupabase()) {
    await dbUpdateFields(id, { ...toRow({ ...updates, id, name: "", category: "", city: "", state: "", address: "", status: "Novo Lead", score: 0, opportunityLevel: "Baixa", detectedOpportunities: [], suggestions: [], notes: [], createdAt: now, updatedAt: now }), updated_at: now }).catch(() => {});
  }
  const local = memStore.find((c) => c.id === id);
  if (local) {
    Object.assign(local, updates, { updatedAt: now });
    return local;
  }
  return undefined;
}

export function getDashboardMetrics() {
  const all = memStore;
  const total = all.length;
  return {
    totalCompanies: total,
    lowRating: all.filter((c) => (c.rating ?? 5) < 4.2).length,
    withoutWebsite: all.filter((c) => !c.website).length,
    withoutGoogleAds: all.filter((c) => !c.hasGoogleAds).length,
    withoutWhatsapp: all.filter((c) => !c.whatsapp).length,
    withoutDescription: all.filter((c) => !c.hasDescription).length,
    withoutRecentPhotos: all.filter((c) => !c.hasRecentPhotos).length,
    averageScore: total ? Math.round(all.reduce((s, c) => s + c.score, 0) / total) : 0,
    hotLeads: all.filter((c) => c.opportunityLevel === "Alta").length,
    pipeline: all.reduce<Record<string, number>>((acc, c) => { acc[c.status] = (acc[c.status] ?? 0) + 1; return acc; }, {}),
    topOpportunities: [...all].sort((a, b) => b.score - a.score).slice(0, 5)
  };
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function syncToMem(items: Company[]) {
  for (const c of items) {
    const idx = memStore.findIndex((m) => m.id === c.id);
    if (idx === -1) memStore.push(c);
    else memStore[idx] = { ...memStore[idx], ...c };
  }
}

function queueEnrichmentForAll(items: Company[]) {
  import("./enrichmentQueue.js").then(({ queueEnrichment }) => {
    for (const c of items) {
      if (c.website) queueEnrichment(c.id, c.name);
    }
  });
}

function generateMockSearch(input: SearchRequest): Company[] {
  const seed = `${input.segment}-${input.city}-${input.state ?? ""}`.toLowerCase().replace(/\s+/g, "-");
  return Array.from({ length: 4 }).map((_, i) => {
    const rating = [3.7, 4.0, 4.3, 4.6][i];
    const reviewCount = [12, 35, 64, 118][i];
    const base: Company = {
      id: `mock-${seed}-${i + 1}`,
      name: `${input.segment} ${["Prime", "Central", "Norte", "Sul"][i]}`,
      category: input.segment,
      city: input.city,
      state: input.state ?? "",
      address: `${input.city}, ${input.state ?? "BR"}`,
      phone: i === 2 ? undefined : `+55${i + 1}19999888${i}`,
      whatsapp: i === 1 ? undefined : `+55${i + 1}19999888${i}`,
      website: i < 2 ? undefined : "https://example.com",
      rating,
      reviewCount,
      mapsUrl: `https://maps.google.com/?q=${encodeURIComponent(`${input.segment} ${input.city}`)}`,
      hasGoogleAds: i === 3,
      hasDescription: i > 1,
      hasRecentPhotos: i > 1,
      hasRecentPosts: i === 3,
      respondsReviews: i === 3,
      hasSsl: i > 1,
      isResponsive: i > 1,
      pageSpeed: [0, 0, 48, 74][i],
      metaPixel: false,
      googleTagManager: i === 3,
      googleAnalytics: i > 1,
      seoBasics: i > 1,
      status: "Novo Lead",
      notes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      score: 0,
      opportunityLevel: "Baixa",
      detectedOpportunities: [],
      suggestions: []
    };
    return { ...base, ...calculateOpportunityScore(base) };
  });
}
