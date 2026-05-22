import { companies } from "../db/mockData.js";
import { Company, CrmStatus, SearchRequest } from "../types.js";
import { analyzeWebsite, searchGooglePlaces } from "./google.js";
import { calculateOpportunityScore } from "./scoring.js";
import { config } from "../config.js";
import { randomUUID } from "node:crypto";

export function listCompanies() {
  return companies.sort((a, b) => b.score - a.score);
}

export function getCompany(id: string) {
  return companies.find((company) => company.id === id);
}

export async function searchCompanies(input: SearchRequest) {
  const generated = config.useMockData ? generateMockSearch(input) : await searchGooglePlaces(input);

  for (const company of generated) {
    const existing = companies.find((item) => item.id === company.id);
    if (!existing) companies.push(company);
  }

  return generated;
}

export async function enrichCompany(id: string) {
  const company = getCompany(id);
  if (!company) return undefined;

  const digital = await analyzeWebsite(company.website);
  Object.assign(company, digital, calculateOpportunityScore({ ...company, ...digital }), {
    updatedAt: new Date().toISOString()
  });
  return company;
}

export function updateStatus(id: string, status: CrmStatus) {
  const company = getCompany(id);
  if (!company) return undefined;
  company.status = status;
  company.updatedAt = new Date().toISOString();
  if (status === "Contatado") company.lastContactAt = new Date().toISOString();
  return company;
}

export function addNote(id: string, body: string) {
  const company = getCompany(id);
  if (!company) return undefined;
  const note = {
    id: randomUUID(),
    companyId: id,
    body,
    createdAt: new Date().toISOString()
  };
  company.notes.unshift(note);
  company.updatedAt = note.createdAt;
  return note;
}

export function getDashboardMetrics() {
  const total = companies.length;
  const hotLeads = companies.filter((company) => company.opportunityLevel === "Alta").length;

  return {
    totalCompanies: total,
    lowRating: companies.filter((company) => (company.rating ?? 5) < 4.2).length,
    withoutWebsite: companies.filter((company) => !company.website).length,
    withoutGoogleAds: companies.filter((company) => !company.hasGoogleAds).length,
    withoutWhatsapp: companies.filter((company) => !company.whatsapp).length,
    withoutDescription: companies.filter((company) => !company.hasDescription).length,
    withoutRecentPhotos: companies.filter((company) => !company.hasRecentPhotos).length,
    averageScore: total ? Math.round(companies.reduce((sum, item) => sum + item.score, 0) / total) : 0,
    hotLeads,
    pipeline: groupByStatus(),
    topOpportunities: listCompanies().slice(0, 5)
  };
}

function groupByStatus() {
  return companies.reduce<Record<string, number>>((acc, company) => {
    acc[company.status] = (acc[company.status] ?? 0) + 1;
    return acc;
  }, {});
}

function generateMockSearch(input: SearchRequest): Company[] {
  const seed = `${input.segment}-${input.city}-${input.state ?? ""}`.toLowerCase().replace(/\s+/g, "-");
  return Array.from({ length: 4 }).map((_, index) => {
    const rating = [3.7, 4.0, 4.3, 4.6][index];
    const reviewCount = [12, 35, 64, 118][index];
    const base: Company = {
      id: `mock-${seed}-${index + 1}`,
      name: `${input.segment} ${["Prime", "Central", "Norte", "Sul"][index]}`,
      category: input.segment,
      city: input.city,
      state: input.state ?? "",
      address: `${input.city}, ${input.state ?? "BR"}`,
      phone: index === 2 ? undefined : `+55${index + 1}19999888${index}`,
      whatsapp: index === 1 ? undefined : `+55${index + 1}19999888${index}`,
      website: index < 2 ? undefined : "https://example.com",
      rating,
      reviewCount,
      mapsUrl: `https://maps.google.com/?q=${encodeURIComponent(`${input.segment} ${input.city}`)}`,
      hasGoogleAds: index === 3,
      hasDescription: index > 1,
      hasRecentPhotos: index > 1,
      hasRecentPosts: index === 3,
      respondsReviews: index === 3,
      hasSsl: index > 1,
      isResponsive: index > 1,
      pageSpeed: [0, 0, 48, 74][index],
      metaPixel: false,
      googleTagManager: index === 3,
      googleAnalytics: index > 1,
      seoBasics: index > 1,
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
