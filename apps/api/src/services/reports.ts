import { listCompanies } from "./companyStore.js";
import { PipelineReport, PipelineStageSummary, ForecastReport, MonthlyTrend } from "../types.js";

const STAGE_META: Record<string, { probability: number; avgValue: number }> = {
  "Novo Lead": { probability: 0.05, avgValue: 1000 },
  "Contatado": { probability: 0.12, avgValue: 2500 },
  "Em negociação": { probability: 0.30, avgValue: 5000 },
  "Reunião marcada": { probability: 0.45, avgValue: 7000 },
  "Proposta enviada": { probability: 0.60, avgValue: 10000 },
  "Fechado": { probability: 1.0, avgValue: 12000 },
  "Perdido": { probability: 0, avgValue: 0 }
};

const STAGE_ORDER = Object.keys(STAGE_META);

export function getPipelineReport(): PipelineReport {
  const companies = listCompanies();
  const grouped = new Map<string, number>();

  for (const c of companies) {
    grouped.set(c.status, (grouped.get(c.status) ?? 0) + 1);
  }

  const stages: PipelineStageSummary[] = [];
  let totalValue = 0;

  for (const [status, count] of grouped) {
    const meta = STAGE_META[status] ?? { probability: 0, avgValue: 0 };
    const stageValue = count * meta.avgValue;
    totalValue += stageValue;
    stages.push({ status, count, estimatedValueBRL: stageValue, conversionProbability: meta.probability });
  }

  stages.sort((a, b) => STAGE_ORDER.indexOf(a.status) - STAGE_ORDER.indexOf(b.status));

  const avgScore = companies.length
    ? Math.round(companies.reduce((s, c) => s + c.score, 0) / companies.length)
    : 0;

  return { stages, totalLeads: companies.length, totalPipelineValueBRL: totalValue, avgScore, generatedAt: new Date().toISOString() };
}

export function getForecastReport(): ForecastReport {
  const companies = listCompanies();
  const closed = companies.filter((c) => c.status === "Fechado");
  const open = companies.filter((c) => c.status !== "Fechado" && c.status !== "Perdido");

  const closedRevenue = closed.length * 12000;
  const openPipeline = open.reduce((sum, c) => {
    const meta = STAGE_META[c.status] ?? { probability: 0, avgValue: 0 };
    return sum + meta.avgValue * meta.probability;
  }, 0);

  const avgDeal = closed.length > 0 ? closedRevenue / closed.length : 12000;
  const rate = companies.length > 0 ? closed.length / companies.length : 0.08;
  const expected = closedRevenue + openPipeline;

  return {
    expectedRevenueBRL: Math.round(expected),
    conservativeBRL: Math.round(expected * 0.7),
    optimisticBRL: Math.round(expected * 1.3),
    closedThisMonthBRL: closedRevenue,
    openOpportunitiesBRL: Math.round(openPipeline),
    avgDealValueBRL: Math.round(avgDeal),
    conversionRate: Math.round(rate * 100) / 100,
    generatedAt: new Date().toISOString()
  };
}

export function getMonthlyTrends(): MonthlyTrend[] {
  const companies = listCompanies();
  const now = new Date();
  const closed = companies.filter((c) => c.status === "Fechado").length;
  const contacted = companies.filter((c) => c.status !== "Novo Lead").length;

  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now);
    d.setMonth(d.getMonth() - (5 - i));
    const factor = (i + 1) / 6;
    return {
      month: d.toISOString().slice(0, 7),
      searches: Math.round(companies.length * 0.3 * factor),
      enrichments: Math.round(companies.length * 0.5 * factor),
      contacts: Math.round(contacted * factor),
      dealsClosed: Math.round(closed * factor),
      revenueBRL: Math.round(closed * 12000 * factor)
    };
  });
}
