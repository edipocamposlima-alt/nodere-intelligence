import { randomUUID } from "node:crypto";
import { SavedSearch } from "../types.js";

const history: SavedSearch[] = [];

export function saveSearch(
  params: Pick<SavedSearch, "city" | "state" | "segment" | "keyword">,
  resultCount: number,
  source: SavedSearch["source"],
  companyIds: string[]
): SavedSearch {
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
  history.unshift(saved);
  return saved;
}

export function listSearchHistory(): SavedSearch[] {
  return history;
}

export function getSearch(id: string): SavedSearch | undefined {
  return history.find((s) => s.id === id);
}

export function touchSearch(id: string, resultCount: number, source: SavedSearch["source"], companyIds: string[]) {
  const search = getSearch(id);
  if (!search) return undefined;
  search.lastRanAt = new Date().toISOString();
  search.resultCount = resultCount;
  search.source = source;
  search.companyIds = companyIds;
  return search;
}
