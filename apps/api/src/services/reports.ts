import { Company, ForecastReport, MonthlyTrend, PipelineReport, PipelineStageSummary } from "../types.js";
import { listCompaniesAsync } from "./companyStore.js";
import { getOperators, getOperatorRanking } from "./operators.js";
import { listWorkspaceUsers } from "./userStore.js";

const STAGE_META: Record<string, { probability: number; avgValue: number }> = {
  "Novo Lead": { probability: 0.05, avgValue: 1000 },
  Qualificado: { probability: 0.10, avgValue: 1800 },
  Contatado: { probability: 0.12, avgValue: 2500 },
  Diagnóstico: { probability: 0.25, avgValue: 4000 },
  "Diagnóstico enviado": { probability: 0.30, avgValue: 5000 },
  "Reunião marcada": { probability: 0.45, avgValue: 7000 },
  "Proposta enviada": { probability: 0.60, avgValue: 10000 },
  Negociação: { probability: 0.72, avgValue: 12000 },
  Fechado: { probability: 1.0, avgValue: 12000 },
  Perdido: { probability: 0, avgValue: 0 }
};

const STAGE_ORDER = Object.keys(STAGE_META);

export async function getPipelineReport(workspaceId = "default"): Promise<PipelineReport> {
  const companies = await listCompaniesAsync(workspaceId);
  const grouped = groupBy(companies, (company) => company.status || "Novo Lead");

  const stages: PipelineStageSummary[] = [...grouped.entries()].map(([status, items]) => {
    const meta = STAGE_META[status] ?? { probability: 0.15, avgValue: 3000 };
    return {
      status,
      count: items.length,
      estimatedValueBRL: items.length * meta.avgValue,
      conversionProbability: meta.probability
    };
  });

  stages.sort((a, b) => stageIndex(a.status) - stageIndex(b.status));
  const totalPipelineValueBRL = stages.reduce((sum, stage) => sum + stage.estimatedValueBRL, 0);
  const avgScore = companies.length
    ? Math.round(companies.reduce((sum, company) => sum + (company.score || 0), 0) / companies.length)
    : 0;

  return {
    stages,
    totalLeads: companies.length,
    totalPipelineValueBRL,
    avgScore,
    generatedAt: new Date().toISOString()
  };
}

export async function getForecastReport(workspaceId = "default"): Promise<ForecastReport> {
  const companies = await listCompaniesAsync(workspaceId);
  const closed = companies.filter((company) => company.status === "Fechado");
  const lost = companies.filter((company) => company.status === "Perdido");
  const open = companies.filter((company) => company.status !== "Fechado" && company.status !== "Perdido");

  const closedRevenue = closed.length * STAGE_META.Fechado.avgValue;
  const openPipeline = open.reduce((sum, company) => {
    const meta = STAGE_META[company.status] ?? { probability: 0.15, avgValue: 3000 };
    return sum + meta.avgValue * meta.probability;
  }, 0);
  const avgDeal = closed.length > 0 ? closedRevenue / closed.length : STAGE_META.Fechado.avgValue;
  const decided = closed.length + lost.length;
  const conversionRate = decided > 0 ? closed.length / decided : 0;
  const expected = closedRevenue + openPipeline;

  return {
    expectedRevenueBRL: Math.round(expected),
    conservativeBRL: Math.round(expected * 0.7),
    optimisticBRL: Math.round(expected * 1.3),
    closedThisMonthBRL: closedRevenue,
    openOpportunitiesBRL: Math.round(openPipeline),
    avgDealValueBRL: Math.round(avgDeal),
    conversionRate: Math.round(conversionRate * 100) / 100,
    generatedAt: new Date().toISOString()
  };
}

export async function getMonthlyTrends(workspaceId = "default", months = 6): Promise<MonthlyTrend[]> {
  const companies = await listCompaniesAsync(workspaceId);
  const now = new Date();
  return Array.from({ length: months }, (_, index) => {
    const d = new Date(now);
    d.setMonth(d.getMonth() - (months - 1 - index));
    const month = d.toISOString().slice(0, 7);
    const monthCompanies = companies.filter((company) => (company.createdAt || "").startsWith(month));
    return {
      month,
      searches: monthCompanies.length,
      enrichments: monthCompanies.filter((company) => company.enrichmentStatus === "done").length,
      contacts: monthCompanies.filter((company) => company.status !== "Novo Lead").length,
      dealsClosed: monthCompanies.filter((company) => company.status === "Fechado").length,
      revenueBRL: monthCompanies.filter((company) => company.status === "Fechado").length * STAGE_META.Fechado.avgValue
    };
  });
}

export async function getFunnelReport(workspaceId = "default") {
  const pipeline = await getPipelineReport(workspaceId);
  const total = pipeline.totalLeads || 0;
  let previousCount = total;
  let previous = pipeline.totalLeads || 0;
  return {
    stages: pipeline.stages.map((stage) => {
      const conversionRate = previous > 0 ? stage.count / previous : 0;
      previous = stage.count;
      const conversionFromPrevious = previousCount > 0 ? stage.count / previousCount : 0;
      previousCount = stage.count;
      return {
        name: stage.status,
        count: stage.count,
        conversion_rate: Math.round(conversionRate * 100) / 100,
        pct_of_total: total ? Math.round((stage.count / total) * 10000) / 100 : 0,
        conversion_from_previous: Math.round(conversionFromPrevious * 10000) / 100
      };
    })
  };
}

export async function getLeadsReport(workspaceId = "default", period = "30d") {
  const companies = filterByPeriod(await listCompaniesAsync(workspaceId), period);
  const byDate = [...groupBy(companies, (company) => (company.createdAt || new Date().toISOString()).slice(0, 10)).entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, items]) => ({ date, count: items.length }));
  return {
    by_date: byDate,
    top_segments: topCounts(companies, (company) => company.category || "Sem segmento", "segment"),
    top_cities: topCounts(companies, (company) => company.city || "Sem cidade", "city")
  };
}

export async function getPerformanceReport(workspaceId = "default") {
  const companies = await listCompaniesAsync(workspaceId);
  const total = Math.max(companies.length, 1);
  return {
    avg_score: companies.length ? Math.round(companies.reduce((sum, company) => sum + (company.score || 0), 0) / companies.length) : 0,
    pct_with_site: Math.round((companies.filter((company) => Boolean(company.website)).length / total) * 100),
    pct_with_google_ads: Math.round((companies.filter((company) => Boolean(company.hasGoogleAds)).length / total) * 100),
    pct_without_whatsapp: Math.round((companies.filter((company) => !company.whatsapp).length / total) * 100)
  };
}

export async function getSummaryReport(workspaceId = "default", period = "30d") {
  const companies = await listCompaniesAsync(workspaceId);
  const periodCompanies = filterByPeriod(companies, period);
  const decided = companies.filter((company) => company.status === "Fechado" || company.status === "Perdido").length;
  const closed = companies.filter((company) => company.status === "Fechado").length;
  return {
    total_companies: companies.length,
    total_leads_in_crm: companies.length,
    avg_score: companies.length ? Math.round(companies.reduce((sum, company) => sum + (company.score || 0), 0) / companies.length) : 0,
    conversion_rate: decided ? Math.round((closed / decided) * 10000) / 100 : 0,
    credits_used: 0,
    new_this_period: periodCompanies.length
  };
}

export async function getTimelineReport(workspaceId = "default", period = "30d", groupByMode = "day") {
  const companies = filterByPeriod(await listCompaniesAsync(workspaceId), period);
  const formatKey = (company: Company) => {
    const date = new Date(company.createdAt || new Date().toISOString());
    if (groupByMode === "month") return date.toISOString().slice(0, 7);
    if (groupByMode === "week") {
      const start = new Date(date);
      start.setDate(date.getDate() - date.getDay());
      return start.toISOString().slice(0, 10);
    }
    return date.toISOString().slice(0, 10);
  };
  return {
    data: [...groupBy(companies, formatKey).entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, items]) => ({ date, count: items.length }))
  };
}

export async function getSegmentsReport(workspaceId = "default", period = "30d") {
  const companies = filterByPeriod(await listCompaniesAsync(workspaceId), period);
  return {
    segments: [...groupBy(companies, (company) => company.category || "Sem segmento").entries()]
      .map(([segment, items]) => ({
        segment,
        count: items.length,
        avg_score: items.length ? Math.round(items.reduce((sum, company) => sum + (company.score || 0), 0) / items.length) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15)
  };
}

export async function getCitiesReport(workspaceId = "default", period = "30d") {
  const companies = filterByPeriod(await listCompaniesAsync(workspaceId), period);
  return {
    cities: [...groupBy(companies, (company) => `${company.city || "Sem cidade"}|${company.state || ""}`).entries()]
      .map(([key, items]) => {
        const [city, state] = key.split("|");
        return { city, state, count: items.length };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 15)
  };
}

export async function getOriginReport(workspaceId = "default", period = "30d") {
  const companies = filterByPeriod(await listCompaniesAsync(workspaceId), period);
  return {
    origins: [...groupBy(companies, (company) => String((company as any).source || "search")).entries()]
      .map(([source, items]) => ({ source, count: items.length }))
      .sort((a, b) => b.count - a.count)
  };
}

export async function getIntelligenceReport(workspaceId = "default", period = "30d") {
  const companies = filterByPeriod(await listCompaniesAsync(workspaceId), period);
  const total = Math.max(companies.length, 1);
  return {
    pct_with_site: Math.round((companies.filter((company) => Boolean(company.website)).length / total) * 100),
    pct_with_google_ads: Math.round((companies.filter((company) => Boolean(company.hasGoogleAds)).length / total) * 100),
    pct_with_meta_pixel: Math.round((companies.filter((company) => Boolean(company.metaPixel)).length / total) * 100),
    pct_with_ga4: Math.round((companies.filter((company) => Boolean(company.hasGA4)).length / total) * 100),
    pct_with_gtm: Math.round((companies.filter((company) => Boolean(company.googleTagManager || company.gtmContainerId)).length / total) * 100),
    pct_with_whatsapp: Math.round((companies.filter((company) => Boolean(company.whatsapp)).length / total) * 100),
    avg_pagespeed_mobile: companies.length ? Math.round(companies.reduce((sum, company) => sum + (company.pageSpeed || 0), 0) / companies.length) : 0
  };
}

export async function getOperatorsReport(workspaceId = "default") {
  const [users, operators, ranking, companies] = await Promise.all([
    listWorkspaceUsers(workspaceId).catch(() => []),
    getOperators(workspaceId),
    getOperatorRanking(workspaceId),
    listCompaniesAsync(workspaceId)
  ]);
  const people = users.length
    ? users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.lastActiveAt || user.updatedAt || user.createdAt
    }))
    : operators;

  return people.map((operator) => {
    const metrics = ranking.find((item) => item.operatorId === operator.id);
    const owned = companies.filter((company) => (company as any).ownerId === operator.id || (company as any).operatorId === operator.id);
    const contacted = owned.filter((company) => company.status && company.status !== "Novo Lead").length;
    const closed = owned.filter((company) => company.status === "Fechado").length;
    const decided = owned.filter((company) => company.status === "Fechado" || company.status === "Perdido").length;
    return {
      user_id: operator.id,
      name: operator.name,
      email: operator.email,
      role: operator.role,
      leads_created: metrics?.leadsEnriched ?? owned.length,
      followups_done: metrics?.contactsMade ?? contacted,
      leads_closed: metrics?.dealsClosed ?? closed,
      conversion_rate: metrics?.conversionRate ?? (decided > 0 ? Math.round((closed / decided) * 100) / 100 : 0),
      last_active: operator.createdAt
    };
  });
}

function groupBy<T>(items: T[], getKey: (item: T) => string) {
  const grouped = new Map<string, T[]>();
  for (const item of items) {
    const key = getKey(item);
    grouped.set(key, [...(grouped.get(key) ?? []), item]);
  }
  return grouped;
}

function stageIndex(stage: string) {
  const index = STAGE_ORDER.indexOf(stage);
  return index === -1 ? STAGE_ORDER.length : index;
}

function topCounts(companies: Company[], getKey: (company: Company) => string, field: "segment" | "city") {
  return [...groupBy(companies, getKey).entries()]
    .map(([key, items]) => ({ [field]: key, count: items.length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function filterByPeriod(companies: Company[], period: string) {
  const days = period === "7d" ? 7 : period === "90d" ? 90 : period === "12m" ? 365 : 30;
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  return companies.filter((company) => new Date(company.createdAt || 0).getTime() >= since);
}
