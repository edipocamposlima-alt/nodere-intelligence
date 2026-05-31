import { randomUUID } from "node:crypto";
import { SavedSearch } from "../types.js";
import { getSupabase, hasSupabase } from "./supabase.js";

const memHistory: SavedSearch[] = [];

function fromRow(row: Record<string, unknown>): SavedSearch {
  return {
    id: row.id as string,
    city: row.city as string,
    state: row.state as string | undefined,
    segment: row.segment as string,
    keyword: row.keyword as string | undefined,
    resultCount: (row.result_count as number) ?? 0,
    source: (row.source as SavedSearch["source"]) ?? "mock",
    companyIds: (row.company_ids as string[]) ?? [],
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
    lastRanAt: (row.last_ran_at as string) ?? new Date().toISOString()
  };
}

export async function saveSearch(
  params: Pick<SavedSearch, "city" | "state" | "segment" | "keyword">,
  resultCount: number,
  source: SavedSearch["source"],
  companyIds: string[]
): Promise<SavedSearch> {
  const now = new Date().toISOString();
  const saved: SavedSearch = {
    id: randomUUID(),
    ...params,
    resultCount,
    source,
    companyIds,
    createdAt: now,
    lastRanAt: now
  };

  memHistory.unshift(saved);

  if (hasSupabase()) {
    const sb = getSupabase()!;
    sb.from("nodere_searches").insert({
      id: saved.id,
      city: saved.city,
      state: saved.state,
      segment: saved.segment,
      keyword: saved.keyword,
      result_count: saved.resultCount,
      source: saved.source,
      company_ids: saved.companyIds,
      created_at: saved.createdAt,
      last_ran_at: saved.lastRanAt
    });
  }

  return saved;
}

export async function listSearchHistory(): Promise<SavedSearch[]> {
  if (hasSupabase()) {
    const sb = getSupabase()!;
    const { data, error } = await sb
      .from("nodere_searches")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error && data) {
      const rows = (data as Record<string, unknown>[]).map(fromRow);
      // Sync into memory
      for (const r of rows) {
        if (!memHistory.find((h) => h.id === r.id)) memHistory.push(r);
      }
      return rows;
    }
  }
  return memHistory;
}

export async function getSearch(id: string): Promise<SavedSearch | undefined> {
  const mem = memHistory.find((s) => s.id === id);
  if (mem) return mem;

  if (hasSupabase()) {
    const sb = getSupabase()!;
    const { data } = await sb.from("nodere_searches").select("*").eq("id", id).maybeSingle();
    if (data) return fromRow(data as Record<string, unknown>);
  }
  return undefined;
}

export async function touchSearch(id: string, resultCount: number, source: SavedSearch["source"], companyIds: string[]) {
  const now = new Date().toISOString();
  const mem = memHistory.find((s) => s.id === id);
  if (mem) {
    mem.lastRanAt = now;
    mem.resultCount = resultCount;
    mem.source = source;
    mem.companyIds = companyIds;
  }

  if (hasSupabase()) {
    const sb = getSupabase()!;
    sb.from("nodere_searches")
      .update({ last_ran_at: now, result_count: resultCount, source, company_ids: companyIds })
      .eq("id", id)
      ;
  }

  return mem;
}
