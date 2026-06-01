import { Company, CrmStatus, SearchRequest } from "../types.js";
import { GoogleApiError, searchGooglePlaces } from "./google.js";
import { calculateOpportunityScore } from "./scoring.js";
import { config } from "../config.js";
import { getSupabase, hasSupabase } from "../db/supabase.js";
import { randomUUID } from "node:crypto";

// In-memory store (used when Supabase is not configured). It starts empty in
// production so the UI never presents demonstrative leads as real records.
const memStore: Company[] = [];
const taskStore = new Map<string, OperationTask[]>();
const documentStore = new Map<string, OperationDocument[]>();

const TASK_PREFIX = "__NODERE_TASK__";
const DOCUMENT_PREFIX = "__NODERE_DOCUMENT__";

export interface OperationTask {
  id: string;
  companyId: string;
  title: string;
  description?: string;
  dueAt?: string;
  priority?: string;
  channel?: string;
  status: "open" | "done" | "cancelled";
  createdAt: string;
  updatedAt?: string;
}

export interface OperationDocument {
  id: string;
  companyId: string;
  type: string;
  title: string;
  content: string;
  fileName?: string;
  createdAt: string;
  updatedAt?: string;
}

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

function toUpdateRow(updates: Partial<Company>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  const signals: Record<string, unknown> = {};
  const direct: Array<[keyof Company, string]> = [
    ["name", "name"],
    ["category", "category"],
    ["city", "city"],
    ["state", "state"],
    ["address", "address"],
    ["phone", "phone"],
    ["whatsapp", "whatsapp"],
    ["website", "website"],
    ["instagram", "instagram"],
    ["facebook", "facebook"],
    ["linkedin", "linkedin"],
    ["youtube", "youtube"],
    ["rating", "rating"],
    ["reviewCount", "review_count"],
    ["mapsUrl", "maps_url"],
    ["latitude", "latitude"],
    ["longitude", "longitude"],
    ["status", "status"],
    ["score", "score"],
    ["opportunityLevel", "opportunity_level"],
    ["enrichmentStatus", "enrichment_status"],
    ["lastContactAt", "last_contact_at"],
    ["detectedOpportunities", "detected_opportunities"],
    ["suggestions", "suggestions"]
  ];
  for (const [key, column] of direct) {
    if (updates[key] !== undefined) row[column] = updates[key];
  }
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined && !direct.some(([directKey]) => directKey === key) && key !== "notes") {
      signals[key] = value;
    }
  }
  if (Object.keys(signals).length) row.digital_signals = signals;
  row.updated_at = new Date().toISOString();
  return row;
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
    c.notes = mapPublicNotes((row.nodere_company_notes as Record<string, unknown>[] | undefined) ?? []);
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
  c.notes = mapPublicNotes((data.nodere_company_notes as Record<string, unknown>[]) ?? []);
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

async function dbListNotes(companyId: string) {
  const sb = getSupabase()!;
  const { data, error } = await sb
    .from("nodere_company_notes")
    .select("id, company_id, body, created_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return mapPublicNotes((data ?? []) as Record<string, unknown>[]);
}

async function dbDeleteNote(companyId: string, noteId: string) {
  const sb = getSupabase()!;
  const { error } = await sb
    .from("nodere_company_notes")
    .delete()
    .eq("company_id", companyId)
    .eq("id", noteId);
  if (error) throw error;
}

async function dbListSystemItems<T>(companyId: string, prefix: string): Promise<T[]> {
  const sb = getSupabase()!;
  const { data, error } = await sb
    .from("nodere_company_notes")
    .select("id, company_id, body, created_at")
    .eq("company_id", companyId)
    .like("body", `${prefix}%`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map((row) => parseSystemItem<T>(row, prefix)).filter(Boolean) as T[];
}

async function dbAddSystemItem(companyId: string, prefix: string, value: Record<string, unknown>) {
  const sb = getSupabase()!;
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const item = { ...value, id, companyId, createdAt };
  const { error } = await sb.from("nodere_company_notes").insert({
    id,
    company_id: companyId,
    body: `${prefix}${JSON.stringify(item)}`,
    created_at: createdAt
  });
  if (error) throw error;
  return item;
}

async function dbReplaceSystemItem(companyId: string, noteId: string, prefix: string, value: Record<string, unknown>) {
  const sb = getSupabase()!;
  const updatedAt = new Date().toISOString();
  const item = { ...value, id: noteId, companyId, updatedAt };
  const { error } = await sb
    .from("nodere_company_notes")
    .update({ body: `${prefix}${JSON.stringify(item)}` })
    .eq("company_id", companyId)
    .eq("id", noteId);
  if (error) throw error;
  return item;
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
    if (error instanceof GoogleApiError) throw error;
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

export async function listNotes(id: string) {
  if (hasSupabase()) {
    return dbListNotes(id).catch(() => {
      const company = memStore.find((c) => c.id === id);
      return company?.notes ?? [];
    });
  }
  const company = memStore.find((c) => c.id === id);
  return company?.notes ?? [];
}

export async function removeNote(companyId: string, noteId: string) {
  if (hasSupabase()) await dbDeleteNote(companyId, noteId).catch(() => {});
  const company = memStore.find((c) => c.id === companyId);
  if (company) company.notes = company.notes.filter((note) => note.id !== noteId);
  return { ok: true };
}

export async function listTasks(companyId: string): Promise<OperationTask[]> {
  if (hasSupabase()) {
    return dbListSystemItems<OperationTask>(companyId, TASK_PREFIX).catch(() => taskStore.get(companyId) ?? []);
  }
  return taskStore.get(companyId) ?? [];
}

export async function createTask(companyId: string, input: Partial<OperationTask>): Promise<OperationTask> {
  const task: Omit<OperationTask, "id" | "companyId" | "createdAt"> = {
    title: input.title || "Follow-up",
    description: input.description,
    dueAt: input.dueAt,
    priority: input.priority || "Média",
    channel: input.channel || "WhatsApp",
    status: "open"
  };

  if (hasSupabase()) {
    return dbAddSystemItem(companyId, TASK_PREFIX, task as unknown as Record<string, unknown>)
      .then((item) => item as unknown as OperationTask)
      .catch(() => createMemoryTask(companyId, task));
  }
  return createMemoryTask(companyId, task);
}

export async function updateTask(companyId: string, taskId: string, input: Partial<OperationTask>): Promise<OperationTask | undefined> {
  const existing = (await listTasks(companyId)).find((task) => task.id === taskId);
  if (!existing) return undefined;
  const updated: OperationTask = { ...existing, ...input, updatedAt: new Date().toISOString() };
  if (hasSupabase()) {
    await dbReplaceSystemItem(companyId, taskId, TASK_PREFIX, updated as unknown as Record<string, unknown>).catch(() => {});
  }
  taskStore.set(companyId, (taskStore.get(companyId) ?? []).map((task) => task.id === taskId ? updated : task));
  return updated;
}

export async function listDocuments(companyId: string): Promise<OperationDocument[]> {
  if (hasSupabase()) {
    return dbListSystemItems<OperationDocument>(companyId, DOCUMENT_PREFIX).catch(() => documentStore.get(companyId) ?? []);
  }
  return documentStore.get(companyId) ?? [];
}

export async function createDocument(companyId: string, input: Partial<OperationDocument>): Promise<OperationDocument> {
  const document: Omit<OperationDocument, "id" | "companyId" | "createdAt"> = {
    type: input.type || "documento",
    title: input.title || "Documento NODERE",
    content: input.content || "",
    fileName: input.fileName
  };

  if (hasSupabase()) {
    return dbAddSystemItem(companyId, DOCUMENT_PREFIX, document as unknown as Record<string, unknown>)
      .then((item) => item as unknown as OperationDocument)
      .catch(() => createMemoryDocument(companyId, document));
  }
  return createMemoryDocument(companyId, document);
}

export async function updateDocument(companyId: string, documentId: string, input: Partial<OperationDocument>): Promise<OperationDocument | undefined> {
  const existing = (await listDocuments(companyId)).find((document) => document.id === documentId);
  if (!existing) return undefined;
  const updated: OperationDocument = { ...existing, ...input, updatedAt: new Date().toISOString() };
  if (hasSupabase()) {
    await dbReplaceSystemItem(companyId, documentId, DOCUMENT_PREFIX, updated as unknown as Record<string, unknown>).catch(() => {});
  }
  documentStore.set(companyId, (documentStore.get(companyId) ?? []).map((document) => document.id === documentId ? updated : document));
  return updated;
}

export async function removeDocument(companyId: string, documentId: string) {
  if (hasSupabase()) await dbDeleteNote(companyId, documentId).catch(() => {});
  documentStore.set(companyId, (documentStore.get(companyId) ?? []).filter((document) => document.id !== documentId));
  return { ok: true };
}

export async function updateCompany(id: string, updates: Partial<Company>): Promise<Company | undefined> {
  const now = new Date().toISOString();
  if (hasSupabase()) {
    await dbUpdateFields(id, toUpdateRow({ ...updates, updatedAt: now })).catch(() => {});
  }
  const local = memStore.find((c) => c.id === id);
  if (local) {
    Object.assign(local, updates, { updatedAt: now });
    return local;
  }
  if (hasSupabase()) return dbGet(id);
  return undefined;
}

export function getDashboardMetrics() {
  const all = memStore;
  return buildDashboardMetrics(all);
}

export async function getDashboardMetricsAsync() {
  return buildDashboardMetrics(await listCompaniesAsync());
}

function buildDashboardMetrics(all: Company[]) {
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

function mapPublicNotes(rows: Record<string, unknown>[]) {
  return rows
    .filter((n) => {
      const body = String(n.body ?? "");
      return !body.startsWith(TASK_PREFIX) && !body.startsWith(DOCUMENT_PREFIX);
    })
    .map((n) => ({
      id: n.id as string,
      companyId: n.company_id as string,
      body: n.body as string,
      createdAt: n.created_at as string
    }));
}

function parseSystemItem<T>(row: Record<string, unknown>, prefix: string): T | null {
  const body = String(row.body ?? "");
  if (!body.startsWith(prefix)) return null;
  try {
    const parsed = JSON.parse(body.slice(prefix.length)) as Record<string, unknown>;
    return {
      ...parsed,
      id: row.id as string,
      companyId: row.company_id as string,
      createdAt: (parsed.createdAt as string) || (row.created_at as string)
    } as T;
  } catch {
    return null;
  }
}

function createMemoryTask(companyId: string, input: Omit<OperationTask, "id" | "companyId" | "createdAt">): OperationTask {
  const task: OperationTask = {
    ...input,
    id: randomUUID(),
    companyId,
    createdAt: new Date().toISOString()
  };
  taskStore.set(companyId, [task, ...(taskStore.get(companyId) ?? [])]);
  return task;
}

function createMemoryDocument(companyId: string, input: Omit<OperationDocument, "id" | "companyId" | "createdAt">): OperationDocument {
  const document: OperationDocument = {
    ...input,
    id: randomUUID(),
    companyId,
    createdAt: new Date().toISOString()
  };
  documentStore.set(companyId, [document, ...(documentStore.get(companyId) ?? [])]);
  return document;
}

function queueEnrichmentForAll(items: Company[]) {
  import("./enrichmentQueue.js").then(({ queueEnrichment }) => {
    for (const c of items) {
      if (c.website) queueEnrichment(c.id, c.name);
    }
  });
}

function generateMockSearch(input: SearchRequest): Company[] {
  const segment = input.segment || input.companyName || input.keyword || "Empresa";
  const city = input.city || "Brasil";
  const seed = `${segment}-${city}-${input.state ?? ""}`.toLowerCase().replace(/\s+/g, "-");
  return Array.from({ length: 4 }).map((_, i) => {
    const rating = [3.7, 4.0, 4.3, 4.6][i];
    const reviewCount = [12, 35, 64, 118][i];
    const base: Company = {
      id: `mock-${seed}-${i + 1}`,
      name: `${segment} ${["Prime", "Central", "Norte", "Sul"][i]}`,
      category: segment,
      city,
      state: input.state ?? "",
      address: `${city}, ${input.state ?? "BR"}`,
      phone: i === 2 ? undefined : `+55${i + 1}19999888${i}`,
      whatsapp: i === 1 ? undefined : `+55${i + 1}19999888${i}`,
      website: i < 2 ? undefined : "https://example.com",
      rating,
      reviewCount,
      mapsUrl: `https://maps.google.com/?q=${encodeURIComponent(`${segment} ${city}`)}`,
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
