import { Company, ForecastReport, MonthlyTrend, PipelineReport, PipelineStageSummary } from "../types.js";
import { listCompaniesAsync } from "./companyStore.js";
import { getOperators, getOperatorRanking } from "./operators.js";

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
  let previous = pipeline.totalLeads || 0;
  return {
    stages: pipeline.stages.map((stage) => {
      const conversionRate = previous > 0 ? stage.count / previous : 0;
      previous = stage.count;
      return {
        name: stage.status,
        count: stage.count,
        conversion_rate: Math.round(conversionRate * 100) / 100
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

export async function getOperatorsReport(workspaceId = "default") {
  const [operators, ranking] = await Promise.all([getOperators(workspaceId), getOperatorRanking(workspaceId)]);
  return operators.map((operator) => {
    const metrics = ranking.find((item) => item.operatorId === operator.id);
    return {
      user_id: operator.id,
      name: operator.name,
      email: operator.email,
      role: operator.role,
      leads_created: metrics?.leadsEnriched ?? 0,
      followups_done: metrics?.contactsMade ?? 0,
      leads_closed: metrics?.dealsClosed ?? 0,
      conversion_rate: metrics?.conversionRate ?? 0,
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
