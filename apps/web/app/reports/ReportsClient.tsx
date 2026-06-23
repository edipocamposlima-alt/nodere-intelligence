"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3, Download, Filter, Gauge, MapPin, PieChart as PieIcon, RefreshCw, TrendingUp } from "lucide-react";
import {
  downloadReportCsv,
  downloadReportPdf,
  getReportDashboard,
  type ReportDashboard,
  type ReportFilters
} from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { ErrorState } from "@/components/ui/ErrorState";
import { Logo } from "@/components/brand/Logo";
import type { ForecastReport, MonthlyTrend, PipelineReport } from "@/lib/types";

const COLORS = ["#03624C", "#00DF82", "#F59E0B", "#2563EB", "#7C3AED", "#F97316", "#DC2626", "#64748B"];
const PERIODS = [
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
  { value: "12m", label: "12m" }
];

function metric(value: number, suffix = "") {
  return `${Number(value || 0).toLocaleString("pt-BR")}${suffix}`;
}

function brl(value: number) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function withTimeout<T>(promise: Promise<T>, timeoutMs = 20000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error("Relatorios demoraram mais que o esperado. Tente novamente em instantes.")), timeoutMs);
    promise
      .then(resolve)
      .catch(reject)
      .finally(() => window.clearTimeout(timeout));
  });
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

function SelectFilter({
  label,
  value,
  onChange,
  children
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex min-w-[160px] flex-1 flex-col gap-1 text-xs font-semibold text-[var(--text-secondary)]">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-xl border border-line bg-input px-3 text-sm font-semibold text-[var(--text-primary)] outline-none transition focus:border-primary"
      >
        {children}
      </select>
    </label>
  );
}

function EmptyChart({ label }: { label: string }) {
  return <div className="flex h-64 items-center justify-center text-sm font-semibold text-[var(--text-secondary)]">{label}</div>;
}

export function ReportsClient(_legacy: { pipeline: PipelineReport | null; forecast: ForecastReport | null; trends: MonthlyTrend[] }) {
  const [filters, setFilters] = useState<ReportFilters>({ period: "30d", groupBy: "day" });
  const [report, setReport] = useState<ReportDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<"csv" | "pdf" | "">("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setReport(await withTimeout(getReportDashboard(filters)));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.period, filters.groupBy, filters.operatorId, filters.companyId, filters.status, filters.source]);

  const metrics = report?.metrics;
  const selectedFilters = useMemo(() => Object.values(filters).filter(Boolean).length, [filters]);

  const updateFilter = (key: keyof ReportFilters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value || undefined }));
  };

  const exportFile = async (format: "csv" | "pdf") => {
    setExporting(format);
    setError("");
    try {
      if (format === "csv") {
        await downloadReportCsv(filters);
      } else {
        await downloadReportPdf(filters);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setExporting("");
    }
  };

  if (error && !report && !loading) {
    return <ErrorState message={error} onRetry={() => void load()} />;
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-line bg-panel/95 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Logo variant="full" height={42} />
            <div>
              <h1 className="text-2xl font-black text-[var(--text-primary)]">Relatorios executivos</h1>
              <p className="text-sm text-[var(--text-secondary)]">Metricas reais do CRM, origem, funil e inteligencia comercial.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {PERIODS.map((period) => (
              <button
                key={period.value}
                type="button"
                onClick={() => updateFilter("period", period.value)}
                className={`h-9 rounded-full px-4 text-sm font-black transition ${
                  filters.period === period.value ? "bg-primary text-white shadow-sm" : "border border-line bg-input text-[var(--text-primary)]"
                }`}
              >
                {period.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => exportFile("pdf")}
              disabled={Boolean(exporting)}
              className="inline-flex h-9 items-center gap-2 rounded-full bg-primary px-4 text-sm font-black text-white disabled:opacity-60"
            >
              <Download size={15} /> {exporting === "pdf" ? "Gerando..." : "Exportar PDF"}
            </button>
            <button
              type="button"
              onClick={() => exportFile("csv")}
              disabled={Boolean(exporting)}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-line bg-input px-4 text-sm font-black text-[var(--text-primary)] disabled:opacity-60"
            >
              <Download size={15} /> {exporting === "csv" ? "Gerando..." : "Exportar CSV"}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-panel/90 p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-black text-[var(--text-primary)]">
            <Filter size={17} className="text-primary" />
            Filtros do relatorio
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{selectedFilters} ativo(s)</span>
          </div>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-input px-3 py-2 text-xs font-black text-[var(--text-primary)]"
          >
            <RefreshCw size={14} /> Atualizar
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <SelectFilter label="Agrupamento" value={filters.groupBy || "day"} onChange={(value) => updateFilter("groupBy", value)}>
            <option value="day">Diario</option>
            <option value="week">Semanal</option>
            <option value="month">Mensal</option>
          </SelectFilter>
          <SelectFilter label="Operador" value={filters.operatorId || ""} onChange={(value) => updateFilter("operatorId", value)}>
            <option value="">Todos</option>
            {(report?.options.operators || []).map((operator) => (
              <option key={operator.id} value={operator.id}>{operator.name}</option>
            ))}
          </SelectFilter>
          <SelectFilter label="Empresa" value={filters.companyId || ""} onChange={(value) => updateFilter("companyId", value)}>
            <option value="">Todas</option>
            {(report?.options.companies || []).map((company) => (
              <option key={company.id} value={company.id}>{company.name}</option>
            ))}
          </SelectFilter>
          <SelectFilter label="Status" value={filters.status || ""} onChange={(value) => updateFilter("status", value)}>
            <option value="">Todos</option>
            {(report?.options.statuses || []).map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </SelectFilter>
          <SelectFilter label="Origem" value={filters.source || ""} onChange={(value) => updateFilter("source", value)}>
            <option value="">Todas</option>
            {(report?.options.origins || []).map((source) => (
              <option key={source} value={source}>{source}</option>
            ))}
          </SelectFilter>
          <label className="flex min-w-[160px] flex-1 flex-col gap-1 text-xs font-semibold text-[var(--text-secondary)]">
            Periodo
            <select
              value={filters.period || "30d"}
              onChange={(event) => updateFilter("period", event.target.value)}
              className="h-10 rounded-xl border border-line bg-input px-3 text-sm font-semibold text-[var(--text-primary)] outline-none transition focus:border-primary"
            >
              {PERIODS.map((period) => <option key={period.value} value={period.value}>{period.label}</option>)}
            </select>
          </label>
        </div>
      </section>

      {error && <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">{error}</div>}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card label="Leads criados" value={loading ? "..." : metric(metrics?.leads_created || 0)} sub="Empresas criadas no periodo" />
        <Card label="Leads convertidos" value={loading ? "..." : metric(metrics?.leads_converted || 0)} sub="Negocios ganhos ou fechados" />
        <Card label="Taxa de conversao" value={loading ? "..." : metric(metrics?.conversion_rate || 0, "%")} sub="Convertidos sobre leads criados" />
        <Card label="Oportunidades abertas" value={loading ? "..." : metric(metrics?.open_opportunities || 0)} sub={brl(metrics?.pipeline_value || 0)} />
        <Card label="Negocios ganhos" value={loading ? "..." : metric(metrics?.deals_won || 0)} sub="Status ganho/fechado" />
        <Card label="Negocios perdidos" value={loading ? "..." : metric(metrics?.deals_lost || 0)} sub="Status perdido/cancelado" />
        <Card label="Atividades realizadas" value={loading ? "..." : metric(metrics?.activities_done || 0)} sub="Follow-ups, propostas e comunicacoes" />
        <Card label="Score medio" value={loading ? "..." : metric(metrics?.avg_score || 0)} sub={`${metric(metrics?.total_companies || 0)} empresas no recorte`} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-line bg-panel/90 p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-primary" />
            <h2 className="font-black text-[var(--text-primary)]">Leads criados por periodo</h2>
          </div>
          {report?.timeline?.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={report.timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                  <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={11} />
                  <YAxis allowDecimals={false} stroke="var(--text-secondary)" fontSize={11} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#03624C" strokeWidth={3} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : <EmptyChart label={loading ? "Carregando..." : "Sem dados para os filtros atuais"} />}
        </div>

        <div className="rounded-2xl border border-line bg-panel/90 p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <PieIcon size={18} className="text-primary" />
            <h2 className="font-black text-[var(--text-primary)]">Origem dos leads</h2>
          </div>
          {report?.origins?.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={report.origins} dataKey="count" nameKey="source" innerRadius={55} outerRadius={95} paddingAngle={2}>
                    {report.origins.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <EmptyChart label={loading ? "Carregando..." : "Sem origem no recorte"} />}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-line bg-panel/90 p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Gauge size={18} className="text-primary" />
            <h2 className="font-black text-[var(--text-primary)]">Funil e status</h2>
          </div>
          {report?.funnel?.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.funnel}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={10} interval={0} angle={-15} textAnchor="end" height={70} />
                  <YAxis allowDecimals={false} stroke="var(--text-secondary)" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {report.funnel.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <EmptyChart label={loading ? "Carregando..." : "Sem funil no recorte"} />}
        </div>

        <div className="rounded-2xl border border-line bg-panel/90 p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-primary" />
            <h2 className="font-black text-[var(--text-primary)]">Performance por operador</h2>
          </div>
          <div className="space-y-3">
            {(report?.operators || []).slice(0, 8).map((operator) => (
              <div key={operator.user_id} className="rounded-xl border border-line bg-input/70 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-[var(--text-primary)]">{operator.name}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{operator.role || "operador"}</p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">{metric(operator.conversion_rate || 0, "%")}</span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-[var(--text-secondary)]">
                  <span>Leads: <b className="text-[var(--text-primary)]">{operator.leads_created}</b></span>
                  <span>Atividades: <b className="text-[var(--text-primary)]">{operator.followups_done}</b></span>
                  <span>Ganhos: <b className="text-[var(--text-primary)]">{operator.leads_closed}</b></span>
                </div>
              </div>
            ))}
            {!loading && !report?.operators?.length && <EmptyChart label="Sem operadores no recorte" />}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-line bg-panel/90 p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <MapPin size={18} className="text-primary" />
            <h2 className="font-black text-[var(--text-primary)]">Cidades e segmentos</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              {(report?.cities || []).slice(0, 8).map((city) => (
                <div key={`${city.city}-${city.state || ""}`} className="flex items-center justify-between rounded-xl border border-line bg-input/70 px-3 py-2 text-sm">
                  <span className="font-semibold text-[var(--text-primary)]">{city.city}{city.state ? ` / ${city.state}` : ""}</span>
                  <b>{city.count}</b>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {(report?.segments || []).slice(0, 8).map((segment) => (
                <div key={segment.segment} className="flex items-center justify-between rounded-xl border border-line bg-input/70 px-3 py-2 text-sm">
                  <span className="font-semibold text-[var(--text-primary)]">{segment.segment}</span>
                  <b>{segment.count}</b>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-panel/90 p-5 shadow-sm">
          <h2 className="mb-4 font-black text-[var(--text-primary)]">Avisos do relatorio</h2>
          <div className="space-y-2">
            {(report?.warnings || []).map((warning) => (
              <div key={warning} className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">{warning}</div>
            ))}
            {!report?.warnings?.length && <div className="rounded-xl border border-line bg-input/70 px-3 py-2 text-sm font-semibold text-[var(--text-secondary)]">Nenhum aviso tecnico para os filtros atuais.</div>}
          </div>
        </div>
      </section>
    </div>
  );
}
