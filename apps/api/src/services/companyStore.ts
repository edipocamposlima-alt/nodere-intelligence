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
let workspaceColumnAvailable = true;
const unavailableCompanyColumns = new Set<string>();

function isWorkspaceColumnMissing(error: unknown) {
  const text = error instanceof Error ? error.message : JSON.stringify(error);
  return text.includes("workspace_id") && (text.includes("does not exist") || text.includes("42703"));
}

function markWorkspaceColumnMissing(error: unknown) {
  if (isWorkspaceColumnMissing(error)) {
    workspaceColumnAvailable = false;
    return true;
  }
  return false;
}

function getMissingColumn(error: unknown) {
  const source = error as { code?: unknown; message?: unknown };
  const text = typeof source?.message === "string" ? source.message : JSON.stringify(error);
  if (source?.code !== "PGRST204" && !text.includes("Could not find the")) return "";
  const match = text.match(/'([^']+)' column/);
  return match?.[1] || "";
}

function markMissingCompanyColumn(error: unknown) {
  const column = getMissingColumn(error);
  if (!column) return false;
  unavailableCompanyColumns.add(column);
  console.warn("NODERE Supabase schema column unavailable; retrying without column", { table: "nodere_companies", column });
  return true;
}

function canUseVolatileFallback() {
  return !hasSupabase() || process.env.NODE_ENV !== "production";
}

function persistenceError(action: string, error: unknown) {
  const detail = error instanceof Error ? error.message : JSON.stringify(error);
  console.error("NODERE Supabase persistence error", {
    action,
    detail,
    raw: serializeSupabaseError(error)
  });
  const err = new Error(
    `Persistencia indisponivel: nao foi possivel ${action} no Supabase. ` +
    "Para evitar perda de leads em atualizacoes/deploys, o NODERE bloqueou o fallback temporario em memoria."
  ) as Error & { status?: number; code?: string; reason?: string };
  err.status = 503;
  err.code = "PERSISTENCE_UNAVAILABLE";
  err.reason = detail;
  return err;
}

function serializeSupabaseError(error: unknown) {
  if (!error || typeof error !== "object") return error;
  const source = error as Record<string, unknown>;
  return {
    name: source.name,
    message: source.message,
    code: source.code,
    details: source.details,
    hint: source.hint,
    status: source.status
  };
}

async function withPersistentRead<T>(action: string, dbAction: () => Promise<T>, fallback: () => T): Promise<T> {
  try {
    return await dbAction();
  } catch (error) {
    if (canUseVolatileFallback()) return fallback();
    throw persistenceError(action, error);
  }
}

async function withPersistentWrite<T>(action: string, dbAction: () => Promise<T>, fallback: () => T | Promise<T>): Promise<T> {
  try {
    return await dbAction();
  } catch (error) {
    if (canUseVolatileFallback()) return fallback();
    throw persistenceError(action, error);
  }
}

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

export interface CrmStageUpdateInput {
  status: CrmStatus;
  reason?: string;
  probability?: number;
  temperature?: string;
  nextAction?: string;
  lostReason?: string;
  dealValue?: number;
  expectedCloseDate?: string;
  lastContactAt?: string;
  ownerId?: string;
}

// ─── Supabase helpers ────────────────────────────────────────────────────────

function toRow(c: Company, workspaceId = "default", includeWorkspace = workspaceColumnAvailable): Record<string, unknown> {
  const rawCompany = c as unknown as Record<string, unknown>;
  const { id, name, category, city, state, address, phone, whatsapp, website, logoUrl,
    instagram, facebook, linkedin, youtube, rating, reviewCount, mapsUrl, cnpj, legalName,
    latitude, longitude, status, score, opportunityLevel, enrichmentStatus,
    lastContactAt, source, detectedOpportunities, suggestions, createdAt, updatedAt,
    temperature, probability, dealValue, expectedCloseDate, lostReason, nextAction, ownerId,
    notes, ...rest } = c;
  const row: Record<string, unknown> = {
    id, name, category, city, state, address, phone, whatsapp, website,
    logo_url: logoUrl,
    instagram, facebook, linkedin, youtube, rating,
    review_count: reviewCount,
    maps_url: mapsUrl,
    cnpj,
    legal_name: legalName,
    latitude, longitude, status, score,
    opportunity_level: opportunityLevel,
    enrichment_status: enrichmentStatus ?? "none",
    last_contact_at: lastContactAt ?? null,
    temperature: temperature ?? null,
    probability: probability ?? null,
    deal_value: dealValue ?? null,
    expected_close_date: expectedCloseDate ?? null,
    lost_reason: lostReason ?? null,
    next_action: nextAction ?? null,
    owner_id: ownerId ?? null,
    source,
    place_id: rawCompany.placeId || rawCompany.place_id || rawCompany.googlePlaceId || rawCompany.google_place_id || (source === "google_places" ? id : null),
    google_place_id: rawCompany.googlePlaceId || rawCompany.google_place_id || rawCompany.placeId || rawCompany.place_id || (source === "google_places" ? id : null),
    detected_opportunities: detectedOpportunities,
    suggestions,
    digital_signals: rest,
    created_at: createdAt,
    updated_at: updatedAt
  };
  if (includeWorkspace) row.workspace_id = workspaceId;
  stripUnavailableCompanyColumns(row);
  return row;
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
    ["logoUrl", "logo_url"],
    ["instagram", "instagram"],
    ["facebook", "facebook"],
    ["linkedin", "linkedin"],
    ["youtube", "youtube"],
    ["rating", "rating"],
    ["reviewCount", "review_count"],
    ["mapsUrl", "maps_url"],
    ["cnpj", "cnpj"],
    ["legalName", "legal_name"],
    ["latitude", "latitude"],
    ["longitude", "longitude"],
    ["status", "status"],
    ["temperature", "temperature"],
    ["probability", "probability"],
    ["dealValue", "deal_value"],
    ["expectedCloseDate", "expected_close_date"],
    ["lostReason", "lost_reason"],
    ["nextAction", "next_action"],
    ["ownerId", "owner_id"],
    ["score", "score"],
    ["opportunityLevel", "opportunity_level"],
    ["enrichmentStatus", "enrichment_status"],
    ["lastContactAt", "last_contact_at"],
    ["source", "source"],
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
  stripUnavailableCompanyColumns(row);
  return row;
}

function stripUnavailableCompanyColumns(row: Record<string, unknown>) {
  for (const column of unavailableCompanyColumns) {
    delete row[column];
  }
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
    logoUrl: row.logo_url as string | undefined,
    instagram: row.instagram as string | undefined,
    facebook: row.facebook as string | undefined,
    linkedin: row.linkedin as string | undefined,
    youtube: row.youtube as string | undefined,
    rating: row.rating as number | undefined,
    reviewCount: row.review_count as number | undefined,
    mapsUrl: row.maps_url as string | undefined,
    cnpj: row.cnpj as string | undefined,
    legalName: (row.legal_name as string | undefined) ?? (row.razao_social as string | undefined),
    latitude: row.latitude as number | undefined,
    longitude: row.longitude as number | undefined,
    status: (row.status as CrmStatus) ?? "Novo Lead",
    score: (row.score as number) ?? 0,
    opportunityLevel: (row.opportunity_level as Company["opportunityLevel"]) ?? "Baixa",
    enrichmentStatus: (row.enrichment_status as Company["enrichmentStatus"]) ?? "none",
    lastContactAt: row.last_contact_at as string | undefined,
    temperature: row.temperature as string | undefined,
    probability: row.probability as number | undefined,
    dealValue: row.deal_value as number | undefined,
    expectedCloseDate: row.expected_close_date as string | undefined,
    lostReason: row.lost_reason as string | undefined,
    nextAction: row.next_action as string | undefined,
    ownerId: row.owner_id as string | undefined,
    source: row.source as Company["source"] | undefined,
    placeId: (row.place_id as string | undefined) ?? (signals?.placeId as string | undefined) ?? (signals?.googlePlaceId as string | undefined),
    googlePlaceId: (row.google_place_id as string | undefined) ?? (signals?.googlePlaceId as string | undefined) ?? (signals?.placeId as string | undefined),
    detectedOpportunities: (row.detected_opportunities as string[]) ?? [],
    suggestions: (row.suggestions as string[]) ?? [],
    notes: [],
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
    updatedAt: (row.updated_at as string) ?? new Date().toISOString(),
    ...signals
  };
}

async function dbList(workspaceId = "default"): Promise<Company[]> {
  const sb = getSupabase()!;
  let query = sb
    .from("nodere_companies")
    .select("*, nodere_company_notes(id, company_id, body, created_at)");
  if (workspaceColumnAvailable) query = query.eq("workspace_id", workspaceId);
  let { data, error } = await query.order("score", { ascending: false });
  if (error && markWorkspaceColumnMissing(error)) {
    const retry = await sb
      .from("nodere_companies")
      .select("*, nodere_company_notes(id, company_id, body, created_at)")
      .order("score", { ascending: false });
    data = retry.data;
    error = retry.error;
  }
  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) => {
    const c = fromRow(row);
    c.notes = mapPublicNotes((row.nodere_company_notes as Record<string, unknown>[] | undefined) ?? []);
    return c;
  });
}

async function dbGet(id: string, workspaceId = "default"): Promise<Company | undefined> {
  const sb = getSupabase()!;
  const externalId = String(id || "").trim();
  let query = sb
    .from("nodere_companies")
    .select("*, nodere_company_notes(id, company_id, body, created_at)")
    .eq("id", externalId);
  if (workspaceColumnAvailable) query = query.eq("workspace_id", workspaceId);
  let { data, error } = await query.maybeSingle();
  if (error && markWorkspaceColumnMissing(error)) {
    const retry = await sb
      .from("nodere_companies")
      .select("*, nodere_company_notes(id, company_id, body, created_at)")
      .eq("id", externalId)
      .maybeSingle();
    data = retry.data;
    error = retry.error;
  }
  if (error) throw error;
  if (!data) {
    if (/^(ChIJ|search-|apollo-company-|econodata-)/i.test(externalId)) {
      const externalMatch = await dbGetByExternalId(externalId, workspaceId).catch(() => undefined);
      if (externalMatch) return externalMatch;
      const existing = await dbList(workspaceId);
      const match = findDuplicateInList({ id: externalId, source: "google_places" as Company["source"] }, existing)?.company;
      if (match) return match;
    }
    return undefined;
  }
  const c = fromRow(data);
  c.notes = mapPublicNotes((data.nodere_company_notes as Record<string, unknown>[]) ?? []);
  return c;
}

async function dbGetByExternalId(externalId: string, workspaceId = "default"): Promise<Company | undefined> {
  const sb = getSupabase()!;
  for (const column of ["place_id", "google_place_id"] as const) {
    let query = sb
      .from("nodere_companies")
      .select("*, nodere_company_notes(id, company_id, body, created_at)")
      .eq(column, externalId);
    if (workspaceColumnAvailable) query = query.eq("workspace_id", workspaceId);
    let { data, error } = await query.maybeSingle();
    if (error && markWorkspaceColumnMissing(error)) {
      const retry = await sb
        .from("nodere_companies")
        .select("*, nodere_company_notes(id, company_id, body, created_at)")
        .eq(column, externalId)
        .maybeSingle();
      data = retry.data;
      error = retry.error;
    }
    if (error) {
      if (markMissingCompanyColumn(error)) return undefined;
      throw error;
    }
    if (data) {
      const c = fromRow(data);
      c.notes = mapPublicNotes((data.nodere_company_notes as Record<string, unknown>[]) ?? []);
      return c;
    }
  }
  return undefined;
}

async function dbUpsert(items: Company[], workspaceId = "default"): Promise<void> {
  if (items.length === 0) return;
  const sb = getSupabase()!;
  let includeWorkspace = workspaceColumnAvailable;
  for (let attempt = 0; attempt < 16; attempt++) {
    const rows = items.map((item) => toRow(item, workspaceId, includeWorkspace));
    let { error } = await sb.from("nodere_companies").upsert(rows, { onConflict: "id" });
    if (!error) return;
    if (markWorkspaceColumnMissing(error)) {
      includeWorkspace = false;
      continue;
    }
    if (markMissingCompanyColumn(error)) continue;
    console.error("[COMPANIES] Supabase insert error:", JSON.stringify(error, null, 2));
    console.error("[COMPANIES] Workspace ID:", workspaceId);
    console.error("[COMPANIES] Data attempted:", JSON.stringify(rows, null, 2));
    throw new Error("Erro ao salvar empresa: " + ((error as any)?.message || String(error)));
  }
  throw new Error("Não foi possível salvar empresas. A estrutura do banco precisa ser revisada antes de continuar.");
}

async function dbUpdateFields(id: string, fields: Record<string, unknown>, workspaceId = "default"): Promise<void> {
  const sb = getSupabase()!;
  let includeWorkspace = workspaceColumnAvailable;
  for (let attempt = 0; attempt < 16; attempt++) {
    const nextFields = { ...fields };
    stripUnavailableCompanyColumns(nextFields);
    let query = sb.from("nodere_companies").update(nextFields).eq("id", id);
    if (includeWorkspace) query = query.eq("workspace_id", workspaceId);
    let { error } = await query;
    if (!error) return;
    if (markWorkspaceColumnMissing(error)) {
      includeWorkspace = false;
      continue;
    }
    if (markMissingCompanyColumn(error)) continue;
    console.error("[COMPANIES] Supabase update error:", JSON.stringify(error, null, 2));
    console.error("[COMPANIES] Workspace ID:", workspaceId);
    console.error("[COMPANIES] Company ID:", id);
    console.error("[COMPANIES] Data attempted:", JSON.stringify(nextFields, null, 2));
    throw new Error("Erro ao atualizar empresa: " + ((error as any)?.message || String(error)));
  }
  throw new Error("Não foi possível atualizar a empresa. A estrutura do banco precisa ser revisada antes de continuar.");
}

async function dbDeleteCompany(id: string, workspaceId = "default"): Promise<void> {
  const sb = getSupabase()!;
  let query = sb.from("nodere_companies").delete().eq("id", id);
  if (workspaceColumnAvailable) query = query.eq("workspace_id", workspaceId);
  let { error } = await query;
  if (error && markWorkspaceColumnMissing(error)) {
    const retry = await sb.from("nodere_companies").delete().eq("id", id);
    error = retry.error;
  }
  if (error) throw error;
}

async function dbAddNote(companyId: string, body: string, workspaceId = "default") {
  const sb = getSupabase()!;
  const note = { id: randomUUID(), workspace_id: workspaceId, company_id: companyId, body, created_at: new Date().toISOString() };
  const { workspace_id, ...legacyNote } = note;
  let { error } = await sb.from("nodere_company_notes").insert(workspaceColumnAvailable ? note : legacyNote);
  if (error && markWorkspaceColumnMissing(error)) {
    const retry = await sb.from("nodere_company_notes").insert(legacyNote);
    error = retry.error;
  }
  if (error) throw error;
  return { id: note.id, companyId, body, createdAt: note.created_at };
}

async function dbListNotes(companyId: string, workspaceId = "default") {
  const sb = getSupabase()!;
  let query = sb
    .from("nodere_company_notes")
    .select("id, company_id, body, created_at")
    .eq("company_id", companyId);
  if (workspaceColumnAvailable) query = query.eq("workspace_id", workspaceId);
  let { data, error } = await query.order("created_at", { ascending: false });
  if (error && markWorkspaceColumnMissing(error)) {
    const retry = await sb
      .from("nodere_company_notes")
      .select("id, company_id, body, created_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });
    data = retry.data;
    error = retry.error;
  }
  if (error) throw error;
  return mapPublicNotes((data ?? []) as Record<string, unknown>[]);
}

async function dbDeleteNote(companyId: string, noteId: string, workspaceId = "default") {
  const sb = getSupabase()!;
  let query = sb
    .from("nodere_company_notes")
    .delete()
    .eq("company_id", companyId)
    .eq("id", noteId);
  if (workspaceColumnAvailable) query = query.eq("workspace_id", workspaceId);
  let { error } = await query;
  if (error && markWorkspaceColumnMissing(error)) {
    const retry = await sb
      .from("nodere_company_notes")
      .delete()
      .eq("company_id", companyId)
      .eq("id", noteId);
    error = retry.error;
  }
  if (error) throw error;
}

async function dbUpdateNote(companyId: string, noteId: string, body: string, workspaceId = "default") {
  const sb = getSupabase()!;
  const fields = { body };
  let query = sb
    .from("nodere_company_notes")
    .update(fields)
    .eq("company_id", companyId)
    .eq("id", noteId);
  if (workspaceColumnAvailable) query = query.eq("workspace_id", workspaceId);
  let { data, error } = await query.select("id, company_id, body, created_at").single();
  if (error && markWorkspaceColumnMissing(error)) {
    const retry = await sb
      .from("nodere_company_notes")
      .update(fields)
      .eq("company_id", companyId)
      .eq("id", noteId)
      .select("id, company_id, body, created_at")
      .single();
    data = retry.data;
    error = retry.error;
  }
  if (error) throw error;
  return mapPublicNotes([data as Record<string, unknown>])[0];
}

async function dbListSystemItems<T>(companyId: string, prefix: string, workspaceId = "default"): Promise<T[]> {
  const sb = getSupabase()!;
  let query = sb
    .from("nodere_company_notes")
    .select("id, company_id, body, created_at")
    .eq("company_id", companyId)
    .like("body", `${prefix}%`);
  if (workspaceColumnAvailable) query = query.eq("workspace_id", workspaceId);
  let { data, error } = await query.order("created_at", { ascending: false });
  if (error && markWorkspaceColumnMissing(error)) {
    const retry = await sb
      .from("nodere_company_notes")
      .select("id, company_id, body, created_at")
      .eq("company_id", companyId)
      .like("body", `${prefix}%`)
      .order("created_at", { ascending: false });
    data = retry.data;
    error = retry.error;
  }
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map((row) => parseSystemItem<T>(row, prefix)).filter(Boolean) as T[];
}

async function dbAddSystemItem(companyId: string, prefix: string, value: Record<string, unknown>, workspaceId = "default") {
  const sb = getSupabase()!;
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const item = { ...value, id, companyId, createdAt };
  const note = {
    id,
    workspace_id: workspaceId,
    company_id: companyId,
    body: `${prefix}${JSON.stringify(item)}`,
    created_at: createdAt
  };
  const { workspace_id, ...legacyNote } = note;
  let { error } = await sb.from("nodere_company_notes").insert(workspaceColumnAvailable ? note : legacyNote);
  if (error && markWorkspaceColumnMissing(error)) {
    const retry = await sb.from("nodere_company_notes").insert(legacyNote);
    error = retry.error;
  }
  if (error) throw error;
  return item;
}

async function dbReplaceSystemItem(companyId: string, noteId: string, prefix: string, value: Record<string, unknown>, workspaceId = "default") {
  const sb = getSupabase()!;
  const updatedAt = new Date().toISOString();
  const item = { ...value, id: noteId, companyId, updatedAt };
  let query = sb
    .from("nodere_company_notes")
    .update({ body: `${prefix}${JSON.stringify(item)}` })
    .eq("company_id", companyId)
    .eq("id", noteId);
  if (workspaceColumnAvailable) query = query.eq("workspace_id", workspaceId);
  let { error } = await query;
  if (error && markWorkspaceColumnMissing(error)) {
    const retry = await sb
      .from("nodere_company_notes")
      .update({ body: `${prefix}${JSON.stringify(item)}` })
      .eq("company_id", companyId)
      .eq("id", noteId);
    error = retry.error;
  }
  if (error) throw error;
  return item;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function listCompaniesAsync(workspaceId = "default"): Promise<Company[]> {
  if (hasSupabase()) {
    return withPersistentRead(
      "listar leads",
      async () => (await dbList(workspaceId)).filter(isCrmLead),
      () => memStore.filter((c) => ((c as any).workspaceId ?? "default") === workspaceId && isCrmLead(c)).sort((a, b) => b.score - a.score)
    );
  }
  return memStore.filter((c) => ((c as any).workspaceId ?? "default") === workspaceId && isCrmLead(c)).sort((a, b) => b.score - a.score);
}

export function listCompanies(): Company[] {
  return [...memStore].sort((a, b) => b.score - a.score);
}

export async function getCompanyAsync(id: string, workspaceId = "default"): Promise<Company | undefined> {
  if (hasSupabase()) {
    return withPersistentRead("carregar lead", async () => {
      const company = await dbGet(id, workspaceId);
      return company && isCrmLead(company) ? company : undefined;
    }, () => memStore.find((c) => c.id === id && (((c as any).workspaceId ?? "default") === workspaceId) && isCrmLead(c)));
  }
  return memStore.find((c) => c.id === id && (((c as any).workspaceId ?? "default") === workspaceId) && isCrmLead(c));
}

export function getCompany(id: string): Company | undefined {
  return memStore.find((c) => c.id === id);
}

export async function searchCompaniesWithMeta(input: SearchRequest, workspaceId = "default") {
  if (config.useMockData) {
    const generated = generateMockSearch(input).map((company) => ({ ...company, source: "demo" as const }));
    return { source: "mock" as const, companies: generated, warning: "Modo demonstrativo ativo (USE_MOCK_DATA=true)." };
  }

  try {
    const generated = await searchGooglePlaces(input);
    const withStatus = generated.map((c) => ({ ...c, enrichmentStatus: "pending" as const, source: "google_places" as const }));
    return { source: "google" as const, companies: withStatus };
  } catch (error) {
    if (error instanceof GoogleApiError) throw error;
    throw error;
  }
}

export async function searchCompanies(input: SearchRequest, workspaceId = "default") {
  return (await searchCompaniesWithMeta(input, workspaceId)).companies;
}

export async function saveCompanies(items: Company[], workspaceId = "default") {
  const existing = await listCompaniesAsync(workspaceId);
  const saved: Company[] = [];
  for (const item of items) {
    const duplicate = findDuplicateInList(item, [...existing, ...saved]);
    if (duplicate) {
      saved.push(duplicate.company);
      continue;
    }
    const scoped = markAsCrmLead({ ...item, enrichmentStatus: item.enrichmentStatus ?? "pending" as const });
    syncToMem([scoped], workspaceId);
    if (hasSupabase()) await withPersistentWrite("salvar leads no CRM", () => dbUpsert([scoped], workspaceId), () => undefined);
    queueEnrichmentForAll([scoped]);
    saved.push(scoped);
  }
  return saved;
}

export async function saveSearchResultAsCrmLead(item: Company, workspaceId = "default") {
  const duplicate = await findExistingCrmLead(item, workspaceId);
  if (duplicate) return { company: duplicate.company, created: false, duplicate: true, reason: duplicate.reason };
  const [saved] = await saveCompanies([markAsCrmLead(item)], workspaceId);
  return { company: saved, created: true, duplicate: false, reason: null };
}

export async function findExistingCrmLead(item: Partial<Company>, workspaceId = "default") {
  const existing = await listCompaniesAsync(workspaceId);
  return findDuplicateInList(item, existing);
}

export async function filterUnsavedSearchResults(items: Company[], workspaceId = "default") {
  const existing = await listCompaniesAsync(workspaceId);
  const companies: Company[] = [];
  const duplicates: Array<{ company: Company; existing: Company; reason: string }> = [];
  for (const item of items) {
    const duplicate = findDuplicateInList(item, existing);
    if (duplicate) duplicates.push({ company: item, existing: duplicate.company, reason: duplicate.reason });
    else companies.push(item);
  }
  return { companies, duplicates };
}

export async function updateCrmStage(id: string, input: CrmStageUpdateInput, workspaceId = "default"): Promise<Company | undefined> {
  const now = new Date().toISOString();
  const fields: Record<string, unknown> = {
    status: input.status,
    updated_at: now,
    temperature: input.temperature ?? inferTemperature(input.status),
    probability: clampProbability(input.probability ?? inferProbability(input.status))
  };
  if (input.nextAction !== undefined) fields.next_action = input.nextAction;
  if (input.lostReason !== undefined || input.status === "Perdido") fields.lost_reason = input.lostReason || "";
  if (input.dealValue !== undefined) fields.deal_value = Math.max(0, Number(input.dealValue) || 0);
  if (input.expectedCloseDate !== undefined) fields.expected_close_date = input.expectedCloseDate || null;
  if (input.ownerId !== undefined) fields.owner_id = input.ownerId || null;
  if (input.lastContactAt !== undefined) fields.last_contact_at = input.lastContactAt || null;
  if (["Contatado", "Reunião marcada", "Proposta enviada", "Negociação", "Fechado"].includes(input.status) && !fields.last_contact_at) fields.last_contact_at = now;

  if (hasSupabase()) {
    await withPersistentWrite("atualizar etapa do lead", () => dbUpdateFields(id, fields, workspaceId), () => undefined);
  }
  const local = memStore.find((c) => c.id === id && (((c as any).workspaceId ?? "default") === workspaceId));
  if (local) {
    local.status = input.status;
    local.updatedAt = now;
    local.temperature = String(fields.temperature || "");
    local.probability = Number(fields.probability || 0);
    if (fields.last_contact_at) local.lastContactAt = String(fields.last_contact_at);
    if (fields.next_action !== undefined) local.nextAction = String(fields.next_action || "");
    if (fields.lost_reason !== undefined) local.lostReason = String(fields.lost_reason || "");
    if (fields.deal_value !== undefined) local.dealValue = Number(fields.deal_value || 0);
    if (fields.expected_close_date !== undefined) local.expectedCloseDate = String(fields.expected_close_date || "");
    if (fields.owner_id !== undefined) local.ownerId = String(fields.owner_id || "");
    return local;
  }
  if (hasSupabase()) return dbGet(id, workspaceId);
  return undefined;
}

export async function updateStatus(id: string, status: CrmStatus, workspaceId = "default"): Promise<Company | undefined> {
  return updateCrmStage(id, { status }, workspaceId);
}

export function inferProbability(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("perdid")) return 0;
  if (normalized.includes("fechad") || normalized.includes("ganh")) return 100;
  if (normalized.includes("negocia")) return 72;
  if (normalized.includes("proposta")) return 60;
  if (normalized.includes("reuni")) return 45;
  if (normalized.includes("diagn")) return 30;
  if (normalized.includes("contat")) return 20;
  if (normalized.includes("qualific")) return 12;
  return 5;
}

export function inferTemperature(status: string) {
  const probability = inferProbability(status);
  if (probability >= 60) return "Quente";
  if (probability >= 20) return "Morno";
  return "Frio";
}

function clampProbability(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export async function addNote(id: string, body: string, workspaceId = "default") {
  const company = memStore.find((c) => c.id === id && (((c as any).workspaceId ?? "default") === workspaceId)) ?? (hasSupabase() ? await dbGet(id, workspaceId) : undefined);
  if (!company) return undefined;

  if (hasSupabase()) {
    return withPersistentWrite("salvar observacao do lead", () => dbAddNote(id, body, workspaceId), () => {
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

export async function listNotes(id: string, workspaceId = "default") {
  if (hasSupabase()) {
    return withPersistentRead("listar observacoes do lead", () => dbListNotes(id, workspaceId), () => {
      const company = memStore.find((c) => c.id === id && (((c as any).workspaceId ?? "default") === workspaceId));
      return company?.notes ?? [];
    });
  }
  const company = memStore.find((c) => c.id === id && (((c as any).workspaceId ?? "default") === workspaceId));
  return company?.notes ?? [];
}

export async function removeNote(companyId: string, noteId: string, workspaceId = "default") {
  if (hasSupabase()) await withPersistentWrite("remover observacao do lead", () => dbDeleteNote(companyId, noteId, workspaceId), () => undefined);
  const company = memStore.find((c) => c.id === companyId && (((c as any).workspaceId ?? "default") === workspaceId));
  if (company) company.notes = company.notes.filter((note) => note.id !== noteId);
  return { ok: true };
}

export async function updateNote(companyId: string, noteId: string, body: string, workspaceId = "default") {
  const now = new Date().toISOString();
  if (hasSupabase()) {
    return withPersistentWrite("atualizar observacao do lead", () => dbUpdateNote(companyId, noteId, body, workspaceId), () => {
      const company = memStore.find((c) => c.id === companyId && (((c as any).workspaceId ?? "default") === workspaceId));
      const note = company?.notes.find((item) => item.id === noteId);
      if (!note) return undefined;
      note.body = body;
      note.updatedAt = now;
      return note;
    });
  }
  const company = memStore.find((c) => c.id === companyId && (((c as any).workspaceId ?? "default") === workspaceId));
  const note = company?.notes.find((item) => item.id === noteId);
  if (!note) return undefined;
  note.body = body;
  note.updatedAt = now;
  return note;
}

export async function listTasks(companyId: string, workspaceId = "default"): Promise<OperationTask[]> {
  if (hasSupabase()) {
    return withPersistentRead("listar tarefas do lead", () => dbListSystemItems<OperationTask>(companyId, TASK_PREFIX, workspaceId), () => taskStore.get(`${workspaceId}:${companyId}`) ?? []);
  }
  return taskStore.get(`${workspaceId}:${companyId}`) ?? [];
}

export async function createTask(companyId: string, input: Partial<OperationTask>, workspaceId = "default"): Promise<OperationTask> {
  const task: Omit<OperationTask, "id" | "companyId" | "createdAt"> = {
    title: input.title || "Follow-up",
    description: input.description,
    dueAt: input.dueAt,
    priority: input.priority || "Média",
    channel: input.channel || "WhatsApp",
    status: "open"
  };

  if (hasSupabase()) {
    return withPersistentWrite(
      "criar tarefa do lead",
      () => dbAddSystemItem(companyId, TASK_PREFIX, task as unknown as Record<string, unknown>, workspaceId).then((item) => item as unknown as OperationTask),
      () => createMemoryTask(companyId, task, workspaceId)
    );
  }
  return createMemoryTask(companyId, task, workspaceId);
}

export async function updateTask(companyId: string, taskId: string, input: Partial<OperationTask>, workspaceId = "default"): Promise<OperationTask | undefined> {
  const existing = (await listTasks(companyId, workspaceId)).find((task) => task.id === taskId);
  if (!existing) return undefined;
  const updated: OperationTask = { ...existing, ...input, updatedAt: new Date().toISOString() };
  if (hasSupabase()) {
    await withPersistentWrite("atualizar tarefa do lead", () => dbReplaceSystemItem(companyId, taskId, TASK_PREFIX, updated as unknown as Record<string, unknown>, workspaceId).then(() => undefined), () => undefined);
  }
  taskStore.set(`${workspaceId}:${companyId}`, (taskStore.get(`${workspaceId}:${companyId}`) ?? []).map((task) => task.id === taskId ? updated : task));
  return updated;
}

export async function listDocuments(companyId: string, workspaceId = "default"): Promise<OperationDocument[]> {
  if (hasSupabase()) {
    return withPersistentRead("listar arquivos do lead", () => dbListSystemItems<OperationDocument>(companyId, DOCUMENT_PREFIX, workspaceId), () => documentStore.get(`${workspaceId}:${companyId}`) ?? []);
  }
  return documentStore.get(`${workspaceId}:${companyId}`) ?? [];
}

export async function createDocument(companyId: string, input: Partial<OperationDocument>, workspaceId = "default"): Promise<OperationDocument> {
  const document: Omit<OperationDocument, "id" | "companyId" | "createdAt"> = {
    type: input.type || "documento",
    title: input.title || "Documento NODERE",
    content: input.content || "",
    fileName: input.fileName
  };

  if (hasSupabase()) {
    return withPersistentWrite(
      "criar arquivo do lead",
      () => dbAddSystemItem(companyId, DOCUMENT_PREFIX, document as unknown as Record<string, unknown>, workspaceId).then((item) => item as unknown as OperationDocument),
      () => createMemoryDocument(companyId, document, workspaceId)
    );
  }
  return createMemoryDocument(companyId, document, workspaceId);
}

export async function updateDocument(companyId: string, documentId: string, input: Partial<OperationDocument>, workspaceId = "default"): Promise<OperationDocument | undefined> {
  const existing = (await listDocuments(companyId, workspaceId)).find((document) => document.id === documentId);
  if (!existing) return undefined;
  const updated: OperationDocument = { ...existing, ...input, updatedAt: new Date().toISOString() };
  if (hasSupabase()) {
    await withPersistentWrite("atualizar arquivo do lead", () => dbReplaceSystemItem(companyId, documentId, DOCUMENT_PREFIX, updated as unknown as Record<string, unknown>, workspaceId).then(() => undefined), () => undefined);
  }
  documentStore.set(`${workspaceId}:${companyId}`, (documentStore.get(`${workspaceId}:${companyId}`) ?? []).map((document) => document.id === documentId ? updated : document));
  return updated;
}

export async function removeDocument(companyId: string, documentId: string, workspaceId = "default") {
  if (hasSupabase()) await withPersistentWrite("remover arquivo do lead", () => dbDeleteNote(companyId, documentId, workspaceId), () => undefined);
  documentStore.set(`${workspaceId}:${companyId}`, (documentStore.get(`${workspaceId}:${companyId}`) ?? []).filter((document) => document.id !== documentId));
  return { ok: true };
}

export async function updateCompany(id: string, updates: Partial<Company>, workspaceId = "default"): Promise<Company | undefined> {
  const now = new Date().toISOString();
  if (hasSupabase()) {
    await withPersistentWrite("atualizar dados do lead", () => dbUpdateFields(id, toUpdateRow({ ...updates, updatedAt: now }), workspaceId), () => undefined);
  }
  const local = memStore.find((c) => c.id === id && (((c as any).workspaceId ?? "default") === workspaceId));
  if (local) {
    Object.assign(local, updates, { updatedAt: now });
    return local;
  }
  if (hasSupabase()) return dbGet(id, workspaceId);
  return undefined;
}

export async function deleteCompany(id: string, workspaceId = "default") {
  const existing = await getCompanyAsync(id, workspaceId);
  if (!existing) return false;
  if (hasSupabase()) await withPersistentWrite("excluir lead", () => dbDeleteCompany(id, workspaceId), () => undefined);
  const index = memStore.findIndex((company) => company.id === id && (((company as any).workspaceId ?? "default") === workspaceId));
  if (index >= 0) memStore.splice(index, 1);
  taskStore.delete(`${workspaceId}:${id}`);
  documentStore.delete(`${workspaceId}:${id}`);
  return true;
}

export function getDashboardMetrics() {
  const all = memStore;
  return buildDashboardMetrics(all);
}

export async function getDashboardMetricsAsync(workspaceId = "default") {
  return buildDashboardMetrics(await listCompaniesAsync(workspaceId));
}

function buildDashboardMetrics(all: Company[]) {
  const total = all.length;
  return {
    totalCompanies: total,
    lowRating: all.filter((c) => (c.rating ?? 5) < 4.2).length,
    withoutWebsite: all.filter((c) => !c.website).length,
    withoutGoogleAds: all.filter((c) => c.hasGoogleAds === false).length,
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

function syncToMem(items: Company[], workspaceId = "default") {
  for (const c of items) {
    const scoped = { ...c, workspaceId } as Company & { workspaceId: string };
    const idx = memStore.findIndex((m) => m.id === c.id && (((m as any).workspaceId ?? "default") === workspaceId));
    if (idx === -1) memStore.push(scoped);
    else memStore[idx] = { ...memStore[idx], ...scoped };
  }
}

function markAsCrmLead(company: Company): Company {
  return {
    ...company,
    status: company.status || "Novo Lead",
    source: company.source || "manual",
    updatedAt: company.updatedAt || new Date().toISOString(),
    createdAt: company.createdAt || new Date().toISOString(),
    crmSaved: true,
    isCrmLead: true
  } as Company;
}

function isCrmLead(company: Company) {
  const raw = company as unknown as Record<string, unknown>;
  if (raw.crmSaved === true || raw.isCrmLead === true || raw.crm_saved === true || raw.is_crm_lead === true) return true;
  if (company.source && !["google_places", "demo", "test"].includes(String(company.source))) return true;
  if ((company.notes ?? []).length > 0) return true;
  if (company.lastContactAt || company.nextAction || company.dealValue || company.ownerId) return true;
  if (company.status && company.status !== "Novo Lead") return true;
  return false;
}

function findDuplicateInList(candidate: Partial<Company>, existing: Company[]) {
  const keys = getDedupeKeys(candidate);
  for (const key of keys) {
    const match = existing.find((company) => getDedupeKeys(company).some((existingKey) => existingKey.type === key.type && existingKey.value === key.value));
    if (match) return { company: match, reason: key.type };
  }
  return null;
}

function getDedupeKeys(company: Partial<Company>) {
  const raw = company as unknown as Record<string, unknown>;
  const signals = (raw.digitalSignals || raw.digital_signals || {}) as Record<string, unknown>;
  const keys: Array<{ type: string; value: string }> = [];
  const add = (type: string, value: unknown) => {
    const clean = String(value ?? "").trim().toLowerCase();
    if (clean) keys.push({ type, value: clean });
  };

  add("place_id", raw.placeId || raw.googlePlaceId || raw.google_place_id || signals.placeId || signals.googlePlaceId || signals.google_place_id || (company.source === "google_places" ? company.id : ""));
  const cnpj = cleanDigits(String(company.cnpj || raw.cnpj || ""));
  if (cnpj) add("cnpj", cnpj);
  const phone = normalizePhoneKey(company.phone || company.whatsapp || raw.phone || raw.whatsapp);
  if (phone) add("phone", phone);
  const nameCityState = normalizeSearchText([company.name, company.city, company.state].filter(Boolean).join("|"));
  if (company.name && (company.city || company.state) && nameCityState) add("name_city_state", nameCityState);
  const domain = normalizeDomainKey(company.website || raw.website);
  if (domain) add("domain", domain);

  return keys;
}

function normalizePhoneKey(value: unknown) {
  const digits = cleanDigits(String(value || ""));
  if (!digits) return "";
  return digits.startsWith("55") ? digits.slice(2) : digits;
}

function normalizeDomainKey(value: unknown) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";
  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return raw.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  }
}

function cleanDigits(value: string) {
  return value.replace(/\D/g, "");
}

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
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

function createMemoryTask(companyId: string, input: Omit<OperationTask, "id" | "companyId" | "createdAt">, workspaceId = "default"): OperationTask {
  const task: OperationTask = {
    ...input,
    id: randomUUID(),
    companyId,
    createdAt: new Date().toISOString()
  };
  taskStore.set(`${workspaceId}:${companyId}`, [task, ...(taskStore.get(`${workspaceId}:${companyId}`) ?? [])]);
  return task;
}

function createMemoryDocument(companyId: string, input: Omit<OperationDocument, "id" | "companyId" | "createdAt">, workspaceId = "default"): OperationDocument {
  const document: OperationDocument = {
    ...input,
    id: randomUUID(),
    companyId,
    createdAt: new Date().toISOString()
  };
  documentStore.set(`${workspaceId}:${companyId}`, [document, ...(documentStore.get(`${workspaceId}:${companyId}`) ?? [])]);
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
      businessSummary: `${segment} em ${city}/${input.state || "BR"} com dados demonstrativos para validacao de interface. Sinais comerciais: ${i < 2 ? "site nao localizado" : "site localizado"}, telefone ${i === 2 ? "nao localizado" : "localizado"}, avaliacao ${rating} com ${reviewCount} avaliacoes.`,
      hasGoogleAds: i === 3 ? true : null,
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








