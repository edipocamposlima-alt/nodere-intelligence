"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { BarChart, Bar, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3, Download, Gauge, MapPin, PieChart as PieIcon, TrendingUp } from "lucide-react";
import {
  getReportCities,
  getReportFunnel,
  getReportIntelligence,
  getReportOrigin,
  getReportSegments,
  getReportSummary,
  getReportTimeline
} from "@/lib/api";
import type { ForecastReport, MonthlyTrend, PipelineReport } from "@/lib/types";
import { downloadNoderePdf } from "@/lib/pdf";

type Summary = Awaited<ReturnType<typeof getReportSummary>>;
type Funnel = Awaited<ReturnType<typeof getReportFunnel>>;
type Timeline = Awaited<ReturnType<typeof getReportTimeline>>;
type Segments = Awaited<ReturnType<typeof getReportSegments>>;
type Cities = Awaited<ReturnType<typeof getReportCities>>;
type Origins = Awaited<ReturnType<typeof getReportOrigin>>;
type Intelligence = Awaited<ReturnType<typeof getReportIntelligence>>;

const COLORS = ["#22D3EE", "#16C784", "#FACC15", "#A855F7", "#F97316", "#EF4444", "#60A5FA", "#EC4899"];

function metric(value: number, suffix = "") {
  return `${Number(value || 0).toLocaleString("pt-BR")}${suffix}`;
}

function Card({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-line bg-panel/90 p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
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

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    Promise.all([
      getReportSummary(period),
      getReportFunnel(period),
      getReportTimeline(period, groupBy),
      getReportSegments(period),
      getReportCities(period),
      getReportOrigin(period),
      getReportIntelligence(period)
    ])
      .then(([nextSummary, nextFunnel, nextTimeline, nextSegments, nextCities, nextOrigins, nextIntelligence]) => {
        if (!alive) return;
        setSummary(nextSummary);
        setFunnel(nextFunnel);
        setTimeline(nextTimeline);
        setSegments(nextSegments);
        setCities(nextCities);
        setOrigins(nextOrigins);
        setIntelligence(nextIntelligence);
      })
      .catch((err) => {
        if (alive) setError(err instanceof Error ? err.message : "Não foi possível carregar relatórios.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, [period, groupBy]);

  const hasData = (summary?.total_companies || 0) > 0;

  async function exportReportsPdf() {
    const body = [
      `Período: ${period}`,
      `Agrupamento: ${groupBy}`,
      "",
      "Resumo executivo",
      `Empresas: ${summary?.total_companies ?? 0}`,
      `Leads no CRM: ${summary?.total_leads_in_crm ?? 0}`,
      `Score médio: ${summary?.avg_score ?? 0}/100`,
      `Conversão: ${summary?.conversion_rate ?? 0}%`,
      `Créditos usados: ${summary?.credits_used ?? 0}`,
      "",
      "Funil",
      ...funnel.stages.map((stage) => `- ${stage.name}: ${stage.count}`),
      "",
      "Segmentos",
      ...segments.segments.map((item) => `- ${item.segment}: ${item.count}`),
      "",
      "Cidades",
      ...cities.cities.map((item) => `- ${item.city}${item.state ? `/${item.state}` : ""}: ${item.count}`),
      "",
      "Origem",
      ...origins.origins.map((item) => `- ${item.source}: ${item.count}`),
      "",
      intelligence ? "Inteligência digital" : "",
      intelligence ? `Com site: ${intelligence.pct_with_site}%` : "",
      intelligence ? `Google Ads: ${intelligence.pct_with_google_ads}%` : "",
      intelligence ? `WhatsApp: ${intelligence.pct_with_whatsapp}%` : ""
    ].filter(Boolean).join("\n");
    await downloadNoderePdf({
      title: "Relatórios executivos NODERE",
      subtitle: "CRM, funil, origem e inteligência digital",
      body,
      fileName: `relatorio-executivo-nodere-${Date.now()}.pdf`
    });
  }


  return (
    <div className="space-y-6 p-4 md:p-8">
      <section className="rounded-xl border border-line bg-panel/90 p-5 print:border-0 print:bg-white">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Image src="/nodere-logo.png" alt="NODERE" width={220} height={76} className="hidden h-auto w-44 rounded-lg object-contain print:block" />
            <div>
              <h2 className="text-2xl font-semibold text-white print:text-slate-950">Relatórios executivos</h2>
              <p className="mt-1 text-sm text-slate-400 print:text-slate-600">Métricas reais do CRM, origem, funil e inteligência digital.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            {["7d", "30d", "90d", "12m"].map((item) => (
              <button key={item} onClick={() => setPeriod(item)} className={`rounded-lg px-3 py-2 text-xs font-bold ${period === item ? "bg-electric text-white" : "border border-line bg-white/5 text-slate-300"}`}>
                {item}
              </button>
            ))}
            <select value={groupBy} onChange={(event) => setGroupBy(event.target.value)} className="rounded-lg border border-line bg-ink px-3 py-2 text-xs font-bold text-white">
              <option value="day">Diário</option>
              <option value="week">Semanal</option>
              <option value="month">Mensal</option>
            </select>
            <button onClick={() => void exportReportsPdf()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-electric px-4 py-2 text-xs font-bold text-white">
              <Download className="h-4 w-4" />
              Exportar PDF
            </button>
          </div>
        </div>
      </section>

      {loading && <p className="rounded-xl border border-line bg-panel p-4 text-sm text-slate-300">Carregando relatórios...</p>}
      {error && <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">{error}</p>}
      {!loading && !error && !hasData && (
        <section className="rounded-xl border border-line bg-panel/90 p-8 text-center">
          <BarChart3 className="mx-auto h-10 w-10 text-cyan" />
          <h3 className="mt-4 text-lg font-bold text-white">Nenhum dado para relatório ainda</h3>
          <p className="mt-2 text-sm text-slate-400">Faça uma busca e salve leads no CRM para gerar métricas reais.</p>
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
          </section>

          <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-xl border border-line bg-panel/90 p-5">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-white"><TrendingUp className="h-4 w-4 text-cyan" /> Evolução comercial</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeline.data}>
                    <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                    <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} />
                    <YAxis stroke="#94A3B8" fontSize={12} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "#0B1220", border: "1px solid #1E293B", color: "#fff" }} />
                    <Line type="monotone" dataKey="count" stroke="#22D3EE" strokeWidth={3} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-xl border border-line bg-panel/90 p-5">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-white"><Gauge className="h-4 w-4 text-cyan" /> Funil</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnel.stages} layout="vertical" margin={{ left: 12, right: 16 }}>
                    <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                    <XAxis type="number" stroke="#94A3B8" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" stroke="#94A3B8" width={110} fontSize={11} />
                    <Tooltip contentStyle={{ background: "#0B1220", border: "1px solid #1E293B", color: "#fff" }} />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} fill="#1E6FDB" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-2">
            <div className="rounded-xl border border-line bg-panel/90 p-5">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-white"><PieIcon className="h-4 w-4 text-cyan" /> Segmentos</h3>
              <div className="grid gap-4 md:grid-cols-[260px_1fr]">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={segments.segments} dataKey="count" nameKey="segment" outerRadius={90}>
                        {segments.segments.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#0B1220", border: "1px solid #1E293B", color: "#fff" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {segments.segments.slice(0, 8).map((item, index) => (
                    <div key={item.segment} className="flex items-center justify-between rounded-lg border border-line bg-ink px-3 py-2 text-sm">
                      <span className="truncate text-slate-300"><span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: COLORS[index % COLORS.length] }} />{item.segment}</span>
                      <span className="font-bold text-white">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-line bg-panel/90 p-5">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-white"><PieIcon className="h-4 w-4 text-cyan" /> Origem dos leads</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={origins.origins} dataKey="count" nameKey="source" outerRadius={90} label>
                      {origins.origins.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#0B1220", border: "1px solid #1E293B", color: "#fff" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-xl border border-line bg-panel/90 p-5">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-white"><MapPin className="h-4 w-4 text-cyan" /> Top cidades</h3>
              <div className="space-y-2">
                {cities.cities.map((item) => (
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


