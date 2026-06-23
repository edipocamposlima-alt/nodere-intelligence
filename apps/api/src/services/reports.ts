import { Company, ForecastReport, MonthlyTrend, PipelineReport, PipelineStageSummary } from "../types.js";
import { listCompaniesAsync } from "./companyStore.js";
import { getOperators, getOperatorRanking } from "./operators.js";
import { listWorkspaceUsers } from "./userStore.js";
import { getUserMetrics } from "./metricsStore.js";

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
  const funnelStages = ["Novo Lead", "Qualificação", "Em Atendimento", "Proposta", "Fechamento", "Cliente"];
  const stageCounts = companies.reduce<Record<string, number>>((acc, company) => {
    const stage = normalizeFunnelStage(company.status || "Novo Lead");
    acc[stage] = (acc[stage] || 0) + 1;
    return acc;
  }, {});
  const funnel = funnelStages.map((stage, index) => {
    const count = stageCounts[stage] || 0;
    const previousCount = index > 0 ? (stageCounts[funnelStages[index - 1]] || 0) : count;
    return {
      stage,
      count,
      conversion_from_prev: previousCount > 0 ? Math.round((count / previousCount) * 100) : 0
    };
  });
  return {
    total_companies: companies.length,
    total_leads_in_crm: companies.length,
    avg_score: companies.length ? Math.round(companies.reduce((sum, company) => sum + (company.score || 0), 0) / companies.length) : 0,
    conversion_rate: decided ? Math.round((closed / decided) * 10000) / 100 : 0,
    credits_used: 0,
    new_this_period: periodCompanies.length,
    funnel
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
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [users, operators, ranking, companies, userMetrics] = await Promise.all([
    listWorkspaceUsers(workspaceId).catch(() => []),
    getOperators(workspaceId),
    getOperatorRanking(workspaceId),
    listCompaniesAsync(workspaceId),
    getUserMetrics(workspaceId, since)
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
    const legacyMetrics = ranking.find((item) => item.operatorId === operator.id);
    const eventRows = userMetrics.filter((item) => item.user_id === operator.id || item.user_id === operator.email);
    const owned = companies.filter((company) => (company as any).ownerId === operator.id || (company as any).operatorId === operator.id);
    const contacted = owned.filter((company) => company.status && company.status !== "Novo Lead").length;
    const closed = owned.filter((company) => company.status === "Fechado").length;
    const decided = owned.filter((company) => company.status === "Fechado" || company.status === "Perdido").length;
    const searches = eventRows.filter((item) => item.action === "search_performed").length;
    const companiesSaved = eventRows.filter((item) => item.action === "company_saved").length;
    const meetings = eventRows.filter((item) => item.action === "meeting_scheduled").length;
    const proposals = eventRows.filter((item) => item.action === "proposal_generated").length;
    const communications = eventRows.filter((item) => item.action === "communication_logged").length;
    const dealsClosed = eventRows.filter((item) => item.action === "crm_stage_changed" && (item.metadata as any)?.to === "Cliente").length;
    return {
      user_id: operator.id,
      name: operator.name,
      email: operator.email,
      role: operator.role,
      searches,
      companies_saved: companiesSaved,
      meetings,
      proposals,
      deals_closed: dealsClosed,
      leads_created: companiesSaved || legacyMetrics?.leadsEnriched || owned.length,
      followups_done: communications || legacyMetrics?.contactsMade || contacted,
      leads_closed: dealsClosed || legacyMetrics?.dealsClosed || closed,
      conversion_rate: legacyMetrics?.conversionRate ?? (decided > 0 ? Math.round((closed / decided) * 100) / 100 : 0),
      last_active: operator.createdAt
    };
  });
}

export type ReportRole = "owner" | "admin" | "operator" | "viewer" | string;

export interface ReportFilters {
  period?: string;
  groupBy?: string;
  operatorId?: string;
  companyId?: string;
  status?: string;
  source?: string;
  role?: ReportRole;
  userId?: string;
}

export interface ConsolidatedReport {
  filters: Required<Pick<ReportFilters, "period" | "groupBy">> & Omit<ReportFilters, "period" | "groupBy">;
  generated_at: string;
  metrics: {
    leads_created: number;
    leads_converted: number;
    conversion_rate: number;
    open_opportunities: number;
    deals_won: number;
    deals_lost: number;
    activities_done: number;
    total_companies: number;
    avg_score: number;
    pipeline_value: number;
  };
  funnel: Array<{ name: string; count: number; pct_of_total: number; conversion_from_previous: number }>;
  timeline: Array<{ date: string; count: number }>;
  origins: Array<{ source: string; count: number }>;
  statuses: Array<{ status: string; count: number }>;
  segments: Array<{ segment: string; count: number; avg_score: number }>;
  cities: Array<{ city: string; state?: string; count: number }>;
  operators: Array<{ user_id: string; name: string; email?: string; role?: string; leads_created: number; followups_done: number; leads_closed: number; conversion_rate?: number }>;
  options: {
    companies: Array<{ id: string; name: string }>;
    operators: Array<{ id: string; name: string; role?: string }>;
    statuses: string[];
    origins: string[];
  };
  warnings: string[];
}

export function normalizeReportFilters(input: ReportFilters = {}): Required<Pick<ReportFilters, "period" | "groupBy">> & Omit<ReportFilters, "period" | "groupBy"> {
  const period = ["7d", "30d", "90d", "12m"].includes(String(input.period)) ? String(input.period) : "30d";
  const groupBy = ["day", "week", "month"].includes(String(input.groupBy)) ? String(input.groupBy) : "day";
  const role = input.role || "viewer";
  const userId = input.userId || "";
  return {
    ...input,
    period,
    groupBy,
    role,
    userId,
    operatorId: role === "operator" ? userId : input.operatorId || "",
    companyId: input.companyId || "",
    status: input.status || "",
    source: input.source || ""
  };
}

export async function getConsolidatedReport(workspaceId = "default", input: ReportFilters = {}): Promise<ConsolidatedReport> {
  const filters = normalizeReportFilters(input);
  const allCompanies = await listCompaniesAsync(workspaceId);
  const scopedCompanies = filterCompaniesForReport(allCompanies, filters, { includePeriod: false, includeFieldFilters: false });
  const companies = filterCompaniesForReport(allCompanies, filters);
  const won = companies.filter(isWonStatus);
  const lost = companies.filter(isLostStatus);
  const open = companies.filter((company) => !isWonStatus(company) && !isLostStatus(company));
  const decided = won.length + lost.length;
  const metrics = await getReportActivityMetrics(workspaceId, filters, companies);
  const operators = await getOperatorsReport(workspaceId).catch(() => []);
  const filteredOperators = filters.operatorId
    ? operators.filter((operator) => operator.user_id === filters.operatorId)
    : filters.role === "operator" && filters.userId
      ? operators.filter((operator) => operator.user_id === filters.userId)
      : operators;
  const stageEntries = [...groupBy(companies, (company) => company.status || "Novo Lead").entries()]
    .sort(([a], [b]) => stageIndex(a) - stageIndex(b));
  let previousCount = companies.length;

  return {
    filters,
    generated_at: new Date().toISOString(),
    metrics: {
      leads_created: companies.length,
      leads_converted: won.length,
      conversion_rate: decided ? Math.round((won.length / decided) * 10000) / 100 : 0,
      open_opportunities: open.length,
      deals_won: won.length,
      deals_lost: lost.length,
      activities_done: metrics.activitiesDone,
      total_companies: companies.length,
      avg_score: companies.length ? Math.round(companies.reduce((sum, company) => sum + (company.score || 0), 0) / companies.length) : 0,
      pipeline_value: open.reduce((sum, company) => sum + getEstimatedValue(company), 0)
    },
    funnel: stageEntries.map(([name, items]) => {
      const pct = companies.length ? Math.round((items.length / companies.length) * 10000) / 100 : 0;
      const conversion = previousCount ? Math.round((items.length / previousCount) * 10000) / 100 : 0;
      previousCount = items.length;
      return { name, count: items.length, pct_of_total: pct, conversion_from_previous: conversion };
    }),
    timeline: buildTimeline(companies, filters.groupBy),
    origins: [...groupBy(companies, (company) => String((company as any).source || "manual")).entries()]
      .map(([source, items]) => ({ source, count: items.length }))
      .sort((a, b) => b.count - a.count),
    statuses: [...groupBy(companies, (company) => company.status || "Novo Lead").entries()]
      .map(([status, items]) => ({ status, count: items.length }))
      .sort((a, b) => b.count - a.count),
    segments: [...groupBy(companies, (company) => company.category || "Sem segmento").entries()]
      .map(([segment, items]) => ({
        segment,
        count: items.length,
        avg_score: items.length ? Math.round(items.reduce((sum, company) => sum + (company.score || 0), 0) / items.length) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20),
    cities: [...groupBy(companies, (company) => `${company.city || "Sem cidade"}|${company.state || ""}`).entries()]
      .map(([key, items]) => {
        const [city, state] = key.split("|");
        return { city, state, count: items.length };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 20),
    operators: filteredOperators,
    options: {
      companies: scopedCompanies.map((company) => ({ id: company.id, name: company.name })).sort((a, b) => a.name.localeCompare(b.name)).slice(0, 250),
      operators: operators.map((operator) => ({ id: operator.user_id, name: operator.name, role: operator.role })),
      statuses: [...new Set(scopedCompanies.map((company) => company.status || "Novo Lead"))].sort(),
      origins: [...new Set(scopedCompanies.map((company) => String((company as any).source || "manual")))].sort()
    },
    warnings: metrics.warning ? [metrics.warning] : []
  };
}

export function buildReportCsv(report: ConsolidatedReport) {
  const rows: Array<Array<string | number>> = [
    ["seção", "nome", "quantidade", "valor"],
    ["indicador", "leads_criados", report.metrics.leads_created, ""],
    ["indicador", "leads_convertidos", report.metrics.leads_converted, ""],
    ["indicador", "taxa_conversao", report.metrics.conversion_rate, "%"],
    ["indicador", "oportunidades_abertas", report.metrics.open_opportunities, ""],
    ["indicador", "negocios_ganhos", report.metrics.deals_won, ""],
    ["indicador", "negocios_perdidos", report.metrics.deals_lost, ""],
    ["indicador", "atividades_realizadas", report.metrics.activities_done, ""],
    ...report.funnel.map((item) => ["funil", item.name, item.count, `${item.pct_of_total}%`]),
    ...report.timeline.map((item) => ["timeline", item.date, item.count, ""]),
    ...report.origins.map((item) => ["origem", item.source, item.count, ""]),
    ...report.statuses.map((item) => ["status", item.status, item.count, ""]),
    ...report.segments.map((item) => ["segmento", item.segment, item.count, item.avg_score]),
    ...report.cities.map((item) => ["cidade", `${item.city}${item.state ? `/${item.state}` : ""}`, item.count, ""]),
    ...report.operators.map((item) => ["operador", item.name, item.leads_created, item.followups_done])
  ];
  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

export function escapeCsvCell(value: string | number) {
  const text = String(value ?? "");
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function filterCompaniesForReport(companies: Company[], input: ReportFilters, options: { includePeriod?: boolean; includeFieldFilters?: boolean } = {}) {
  const filters = normalizeReportFilters(input);
  const includePeriod = options.includePeriod !== false;
  const includeFieldFilters = options.includeFieldFilters !== false;
  const since = getPeriodStart(filters.period).getTime();
  return companies.filter((company) => {
    if (filters.role === "operator" && filters.userId && !companyBelongsToOperator(company, filters.userId)) return false;
    if (includePeriod && new Date(company.createdAt || 0).getTime() < since) return false;
    if (includeFieldFilters && filters.operatorId && !companyBelongsToOperator(company, filters.operatorId)) return false;
    if (includeFieldFilters && filters.companyId && company.id !== filters.companyId) return false;
    if (includeFieldFilters && filters.status && company.status !== filters.status) return false;
    if (includeFieldFilters && filters.source && String((company as any).source || "manual") !== filters.source) return false;
    return true;
  });
}

async function getReportActivityMetrics(workspaceId: string, filters: ReturnType<typeof normalizeReportFilters>, companies: Company[]) {
  const companyIds = new Set(companies.map((company) => company.id));
  try {
    const rows = await getUserMetrics(workspaceId, getPeriodStart(filters.period).toISOString());
    const scoped = rows.filter((row) => {
      if (filters.role === "operator" && filters.userId && row.user_id !== filters.userId) return false;
      if (filters.operatorId && row.user_id !== filters.operatorId) return false;
      if (row.entity_id && companyIds.size && !companyIds.has(row.entity_id)) return false;
      return row.action !== "search_performed";
    });
    return { activitiesDone: scoped.length };
  } catch {
    return { activitiesDone: 0, warning: "Métricas de atividade indisponíveis; atividades exibidas como zero." };
  }
}

function buildTimeline(companies: Company[], groupByMode = "day") {
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
  return [...groupBy(companies, formatKey).entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, items]) => ({ date, count: items.length }));
}

function companyBelongsToOperator(company: Company, operatorId: string) {
  const source = company as Company & Record<string, unknown>;
  return [source.ownerId, source.operatorId, source.assignedTo, source.assigned_to, source.createdBy, source.created_by, source.userId]
    .filter(Boolean)
    .map(String)
    .includes(operatorId);
}

function isWonStatus(company: Company) {
  const status = normalizeStatusKey(company.status || "");
  return ["fechado", "cliente", "ganho", "won", "closedwon", "closed_won"].includes(status);
}

function isLostStatus(company: Company) {
  const status = normalizeStatusKey(company.status || "");
  return ["perdido", "lost", "closedlost", "closed_lost"].includes(status);
}

function normalizeStatusKey(status: string) {
  return status.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, "").replace(/-/g, "_");
}

function getEstimatedValue(company: Company) {
  const explicit = Number((company as any).crmValue ?? (company as any).crm_value ?? (company as any).dealValue ?? 0);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  const meta = STAGE_META[company.status] ?? { probability: 0.15, avgValue: 3000 };
  return Math.round(meta.avgValue * meta.probability);
}

function getPeriodStart(period: string) {
  const days = period === "7d" ? 7 : period === "90d" ? 90 : period === "12m" ? 365 : 30;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
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

function normalizeFunnelStage(status: string) {
  if (["Fechado", "Cliente"].includes(status)) return "Cliente";
  if (["Fechamento", "Negociação"].includes(status)) return "Fechamento";
  if (["Proposta", "Proposta enviada"].includes(status)) return "Proposta";
  if (["Contatado", "Em Atendimento", "Aguardando retorno"].includes(status)) return "Em Atendimento";
  if (["Qualificado", "Qualificação", "Diagnóstico", "Diagnóstico enviado", "Reunião marcada"].includes(status)) return "Qualificação";
  return "Novo Lead";
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
