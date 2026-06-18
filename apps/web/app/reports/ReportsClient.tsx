"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3, Download, Gauge, MapPin, PieChart as PieIcon, TrendingUp } from "lucide-react";
import {
  getReportCities,
  getReportFunnel,
  getReportIntelligence,
  getReportOrigin,
  getReportOperators,
  getReportProposals,
  getReportSegments,
  getReportSummary,
  getReportTimeline,
  downloadReportPdf
} from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { ErrorState } from "@/components/ui/ErrorState";
import type { ForecastReport, MonthlyTrend, PipelineReport } from "@/lib/types";
import { Logo } from "@/components/brand/Logo";

type Summary = Awaited<ReturnType<typeof getReportSummary>>;
type Funnel = Awaited<ReturnType<typeof getReportFunnel>>;
type Timeline = Awaited<ReturnType<typeof getReportTimeline>>;
type Segments = Awaited<ReturnType<typeof getReportSegments>>;
type Cities = Awaited<ReturnType<typeof getReportCities>>;
type Origins = Awaited<ReturnType<typeof getReportOrigin>>;
type Intelligence = Awaited<ReturnType<typeof getReportIntelligence>>;
type Operators = Awaited<ReturnType<typeof getReportOperators>>;
type Proposals = Awaited<ReturnType<typeof getReportProposals>>;

const COLORS = ["#03624C", "#00DF82", "#F59E0B", "#7C3AED", "#F97316", "#DC2626", "#2563EB", "#64748B"];

function metric(value: number, suffix = "") {
  return `${Number(value || 0).toLocaleString("pt-BR")}${suffix}`;
}

function Card({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-line bg-panel/90 p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">{label}</p>
      <p className="mt-3 text-3xl font-black text-[var(--text-primary)]">{value}</p>
      {sub && <p className="mt-1 text-xs text-[var(--text-secondary)]">{sub}</p>}
    </div>
  );
}

function withTimeout<T>(promise: Promise<T>, timeoutMs = 20000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error("Relatórios demoraram mais que o esperado. Tente novamente em instantes.")), timeoutMs);
    promise
      .then(resolve)
      .catch(reject)
      .finally(() => window.clearTimeout(timeout));
  });
}

export function ReportsClient(_legacy: { pipeline: PipelineReport | null; forecast: ForecastReport | null; trends: MonthlyTrend[] }) {
  const [period, setPeriod] = useState("30d");
  const [groupBy, setGroupBy] = useState("day");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [funnel, setFunnel] = useState<Funnel>({ stages: [] });
  const [timeline, setTimeline] = useState<Timeline>({ data: [] });
  const [segments, setSegments] = useState<Segments>({ segments: [] });
  const [cities, setCities] = useState<Cities>({ cities: [] });
  const [origins, setOrigins] = useState<Origins>({ origins: [] });
  const [intelligence, setIntelligence] = useState<Intelligence | null>(null);
  const [operators, setOperators] = useState<Operators>([]);
  const [proposals, setProposals] = useState<Proposals>({ by_status: [], pipeline_value: 0, accepted_value: 0 });
  const [funnelMin, setFunnelMin] = useState(0);
  const [segmentLimit, setSegmentLimit] = useState(8);
  const [cityLimit, setCityLimit] = useState(10);
  const [originLimit, setOriginLimit] = useState(8);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    withTimeout(Promise.allSettled([
      getReportSummary(period),
      getReportFunnel(period),
      getReportTimeline(period, groupBy),
      getReportSegments(period),
      getReportCities(period),
      getReportOrigin(period),
      getReportIntelligence(period),
      getReportOperators(),
      getReportProposals(period)
    ]))
      .then((results) => {
        if (!alive) return;
        const [nextSummary, nextFunnel, nextTimeline, nextSegments, nextCities, nextOrigins, nextIntelligence, nextOperators, nextProposals] = results;
        if (nextSummary.status === "fulfilled") setSummary(nextSummary.value as Summary);
        if (nextFunnel.status === "fulfilled") setFunnel(nextFunnel.value as Funnel);
        if (nextTimeline.status === "fulfilled") setTimeline(nextTimeline.value as Timeline);
        if (nextSegments.status === "fulfilled") setSegments(nextSegments.value as Segments);
        if (nextCities.status === "fulfilled") setCities(nextCities.value as Cities);
        if (nextOrigins.status === "fulfilled") setOrigins(nextOrigins.value as Origins);
        if (nextIntelligence.status === "fulfilled") setIntelligence(nextIntelligence.value as Intelligence);
        if (nextOperators.status === "fulfilled") setOperators(nextOperators.value as Operators);
        if (nextProposals.status === "fulfilled") setProposals(nextProposals.value as Proposals);
        const failed = results.filter((result) => result.status === "rejected");
        if (failed.length) setError("Alguns indicadores demoraram ou falharam, mas os dados disponíveis foram carregados.");
      })
      .catch((err) => {
        if (alive) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, [period, groupBy]);

  const hasData = (summary?.total_companies || 0) > 0;
  const filteredFunnel = funnel.stages.filter((stage) => stage.count >= funnelMin);
  const filteredSegments = segments.segments.slice(0, segmentLimit);
  const filteredCities = cities.cities.slice(0, cityLimit);
  const filteredOrigins = origins.origins.slice(0, originLimit);

  async function exportReportsPdf() {
    setError("");
    try {
      await downloadReportPdf(period, groupBy);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  function exportCsv() {
    const rows = [
      ["tipo", "nome", "quantidade", "valor"],
      ...filteredFunnel.map((item) => ["funil", item.name, item.count, ""]),
      ...filteredSegments.map((item) => ["segmento", item.segment, item.count, item.avg_score]),
      ...filteredOrigins.map((item) => ["origem", item.source, item.count, ""]),
      ...proposals.by_status.map((item) => ["proposta", item.status, item.count, item.value])
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-nodere-${period}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }


  return (
    <div className="space-y-6 p-4 md:p-8">
      <section className="rounded-xl border border-line bg-panel/90 p-5 print:border-0 print:bg-white">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Logo variant="full" height={42} className="hidden print:flex" />
            <div>
              <h2 className="text-2xl font-semibold text-[var(--text-primary)] print:text-slate-950">Relatórios executivos</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)] print:text-slate-600">Métricas reais do CRM, origem, funil e inteligência digital.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            {["7d", "30d", "90d", "12m"].map((item) => (
              <button key={item} onClick={() => setPeriod(item)} className={`rounded-lg px-3 py-2 text-xs font-bold ${period === item ? "bg-electric text-white" : "border border-line bg-white/5 text-[var(--text-primary)]"}`}>
                {item}
              </button>
            ))}
            <select value={groupBy} onChange={(event) => setGroupBy(event.target.value)} className="rounded-lg border border-line bg-ink px-3 py-2 text-xs font-bold text-[var(--text-primary)]">
              <option value="day">Diário</option>
              <option value="week">Semanal</option>
              <option value="month">Mensal</option>
            </select>
            <button onClick={() => void exportReportsPdf()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-electric px-4 py-2 text-xs font-bold text-white">
              <Download className="h-4 w-4" />
              Exportar PDF
            </button>
            <button onClick={exportCsv} className="inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-white/5 px-4 py-2 text-xs font-bold text-[var(--text-primary)]">
              <Download className="h-4 w-4" />
              Exportar CSV
            </button>
          </div>
        </div>
      </section>

      {loading && <p className="rounded-xl border border-line bg-panel p-4 text-sm text-[var(--text-secondary)]">Carregando relatórios...</p>}
      {error && <ErrorState message={error} onRetry={() => window.location.reload()} />}
      {!loading && !error && !hasData && (
        <section className="rounded-xl border border-line bg-panel/90 p-8 text-center">
          <BarChart3 className="mx-auto h-10 w-10 text-cyan" />
          <h3 className="mt-4 text-lg font-bold text-[var(--text-primary)]">Nenhum dado para relatório ainda</h3>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Faça uma busca e salve leads no CRM para gerar métricas reais.</p>
        </section>
      )}

      {summary && hasData && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Card label="Empresas" value={metric(summary.total_companies)} sub="base total" />
            <Card label="Leads no CRM" value={metric(summary.total_leads_in_crm)} sub={`${summary.new_this_period} no período`} />
            <Card label="Score médio" value={metric(summary.avg_score)} sub="/100" />
            <Card label="Conversão" value={metric(summary.conversion_rate, "%")} sub="fechado vs perdido" />
            <Card label="Créditos usados" value={metric(summary.credits_used)} sub="período selecionado" />
            <Card label="Propostas" value={metric(proposals.by_status.reduce((sum, item) => sum + item.count, 0))} sub={`Pipeline ${Number(proposals.pipeline_value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`} />
          </section>

          <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-xl border border-line bg-panel/90 p-5">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]"><TrendingUp className="h-4 w-4 text-cyan" /> Evolução comercial</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeline.data}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                    <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} />
                    <YAxis stroke="#94A3B8" fontSize={12} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "#0B1220", border: "1px solid #1E293B", color: "#fff" }} />
                    <Line type="monotone" dataKey="count" stroke="#03624C" strokeWidth={3} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-xl border border-line bg-panel/90 p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]"><Gauge className="h-4 w-4 text-cyan" /> Funil</h3>
                <select value={funnelMin} onChange={(event) => setFunnelMin(Number(event.target.value))} className="rounded-lg border border-line bg-ink px-3 py-2 text-xs font-bold text-[var(--text-primary)]">
                  <option value={0}>Todas as etapas</option>
                  <option value={1}>Com leads</option>
                  <option value={5}>5+ leads</option>
                </select>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredFunnel} layout="vertical" margin={{ left: 12, right: 16 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                    <XAxis type="number" stroke="#94A3B8" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" stroke="#94A3B8" width={110} fontSize={11} />
                    <Tooltip contentStyle={{ background: "#0B1220", border: "1px solid #1E293B", color: "#fff" }} />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} fill="var(--chart-leads)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-2">
            <div className="rounded-xl border border-line bg-panel/90 p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-sm font-bold text-white"><PieIcon className="h-4 w-4 text-cyan" /> Segmentos</h3>
                <select value={segmentLimit} onChange={(event) => setSegmentLimit(Number(event.target.value))} className="rounded-lg border border-line bg-ink px-3 py-2 text-xs font-bold text-white">
                  <option value={5}>Top 5</option>
                  <option value={8}>Top 8</option>
                  <option value={15}>Top 15</option>
                </select>
              </div>
              <div className="grid gap-4 md:grid-cols-[260px_1fr]">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={filteredSegments} dataKey="count" nameKey="segment" outerRadius={90}>
                        {filteredSegments.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#0B1220", border: "1px solid #1E293B", color: "#fff" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {filteredSegments.map((item, index) => (
                    <div key={item.segment} className="flex items-center justify-between rounded-lg border border-line bg-ink px-3 py-2 text-sm">
                      <span className="truncate text-slate-300"><span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: COLORS[index % COLORS.length] }} />{item.segment}</span>
                      <span className="font-bold text-white">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-line bg-panel/90 p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-sm font-bold text-white"><PieIcon className="h-4 w-4 text-cyan" /> Origem dos leads</h3>
                <select value={originLimit} onChange={(event) => setOriginLimit(Number(event.target.value))} className="rounded-lg border border-line bg-ink px-3 py-2 text-xs font-bold text-white">
                  <option value={5}>Top 5</option>
                  <option value={8}>Top 8</option>
                  <option value={20}>Todas</option>
                </select>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={filteredOrigins} dataKey="count" nameKey="source" outerRadius={90} label>
                      {filteredOrigins.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#0B1220", border: "1px solid #1E293B", color: "#fff" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-line bg-panel/90 p-5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
              <BarChart3 className="h-4 w-4 text-cyan" /> Desempenho por operador
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-[var(--text-secondary)]">
                    <th className="px-3 py-3">Operador</th>
                    <th className="px-3 py-3">Perfil</th>
                    <th className="px-3 py-3 text-right">Leads</th>
                    <th className="px-3 py-3 text-right">Atividades</th>
                    <th className="px-3 py-3 text-right">Fechados</th>
                  </tr>
                </thead>
                <tbody>
                  {operators.map((operator) => (
                    <tr key={operator.user_id} className="border-b border-line/60 text-[var(--text-primary)]">
                      <td className="px-3 py-3 font-semibold">{operator.name}</td>
                      <td className="px-3 py-3 text-[var(--text-secondary)]">{operator.role}</td>
                      <td className="px-3 py-3 text-right">{operator.leads_created}</td>
                      <td className="px-3 py-3 text-right">{operator.followups_done}</td>
                      <td className="px-3 py-3 text-right">{operator.leads_closed}</td>
                    </tr>
                  ))}
                  {!operators.length && (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-[var(--text-secondary)]">Nenhum operador com métricas no período.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-xl border border-line bg-panel/90 p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-sm font-bold text-white"><MapPin className="h-4 w-4 text-cyan" /> Top cidades</h3>
                <select value={cityLimit} onChange={(event) => setCityLimit(Number(event.target.value))} className="rounded-lg border border-line bg-ink px-3 py-2 text-xs font-bold text-white">
                  <option value={5}>Top 5</option>
                  <option value={10}>Top 10</option>
                  <option value={15}>Top 15</option>
                </select>
              </div>
              <div className="space-y-2">
                {filteredCities.map((item) => (
                  <div key={`${item.city}-${item.state}`} className="flex justify-between rounded-lg border border-line bg-ink px-3 py-2 text-sm">
                    <span className="text-slate-300">{item.city}{item.state ? `/${item.state}` : ""}</span>
                    <span className="font-bold text-white">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
            {intelligence && (
              <div className="rounded-xl border border-line bg-panel/90 p-5">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-white"><BarChart3 className="h-4 w-4 text-cyan" /> Inteligência digital</h3>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <Card label="Com site" value={metric(intelligence.pct_with_site, "%")} />
                  <Card label="Google Ads" value={metric(intelligence.pct_with_google_ads, "%")} />
                  <Card label="Meta Pixel" value={metric(intelligence.pct_with_meta_pixel, "%")} />
                  <Card label="GA4" value={metric(intelligence.pct_with_ga4, "%")} />
                  <Card label="GTM" value={metric(intelligence.pct_with_gtm, "%")} />
                  <Card label="WhatsApp" value={metric(intelligence.pct_with_whatsapp, "%")} />
                  <Card label="PageSpeed médio" value={metric(intelligence.avg_pagespeed_mobile)} />
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}


