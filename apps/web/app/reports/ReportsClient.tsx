"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { BarChart3, Download, Filter, Target, TrendingUp } from "lucide-react";
import type { ForecastReport, MonthlyTrend, PipelineReport } from "@/lib/types";

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function ForecastCard({ label, value, sub, color = "text-white" }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl border border-line bg-panel/90 p-5 text-center shadow-sm">
      <p className="mb-1 text-xs text-slate-400">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

export function ReportsClient({ pipeline, forecast, trends }: { pipeline: PipelineReport | null; forecast: ForecastReport | null; trends: MonthlyTrend[] }) {
  const [status, setStatus] = useState("Todos");
  const [period, setPeriod] = useState("6m");
  const [scoreMin, setScoreMin] = useState(0);
  const statuses = ["Todos", ...(pipeline?.stages.map((stage) => stage.status) ?? [])];

  const filteredStages = useMemo(() => {
    const stages = pipeline?.stages ?? [];
    return stages.filter((stage) => status === "Todos" || stage.status === status);
  }, [pipeline, status]);

  const filteredTrends = useMemo(() => {
    if (period === "3m") return trends.slice(-3);
    return trends;
  }, [trends, period]);

  const maxTrendRevenue = Math.max(...filteredTrends.map((t) => t.revenueBRL), 1);

  return (
    <div className="space-y-8 p-4 md:p-8">
      <section className="rounded-xl border border-line bg-panel/90 p-5 print:border-0 print:bg-white">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Image src="/nodere-brand-full.png" alt="NODERE" width={220} height={76} className="hidden h-auto w-44 rounded-lg object-contain print:block" />
            <div>
              <h2 className="text-2xl font-semibold text-white print:text-slate-950">Relatórios executivos</h2>
              <p className="mt-1 text-sm text-slate-400 print:text-slate-600">Pipeline, forecast de receita e tendências mensais com filtros aplicados.</p>
            </div>
          </div>
          <button onClick={() => window.print()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-electric px-4 py-3 text-sm font-semibold text-white print:hidden">
            <Download className="h-4 w-4" />
            Gerar PDF
          </button>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-4 print:hidden">
          <label className="space-y-1 text-xs text-slate-400">
            Período
            <select value={period} onChange={(event) => setPeriod(event.target.value)} className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-white">
              <option value="6m">Últimos 6 meses</option>
              <option value="3m">Últimos 3 meses</option>
            </select>
          </label>
          <label className="space-y-1 text-xs text-slate-400">
            Status do CRM
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-white">
              {statuses.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-xs text-slate-400">
            Score mínimo
            <input type="number" min={0} max={100} value={scoreMin} onChange={(event) => setScoreMin(Number(event.target.value))} className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-white" />
          </label>
          <div className="rounded-lg border border-line bg-ink px-3 py-2 text-xs text-slate-400">
            <Filter className="mb-1 h-4 w-4 text-cyan" />
            Filtros de cidade, segmento, operador e temperatura ficam prontos para aplicar quando esses campos existirem no dataset do relatório.
          </div>
        </div>
      </section>

      {forecast && (
        <section className="space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white print:text-slate-950">
            <TrendingUp className="h-4 w-4 text-cyan" />
            Forecast do mês
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <ForecastCard label="Receita esperada" value={formatBRL(forecast.expectedRevenueBRL)} sub="base" color="text-cyan" />
            <ForecastCard label="Cenário conservador" value={formatBRL(forecast.conservativeBRL)} sub="-30%" color="text-amber-300" />
            <ForecastCard label="Cenário otimista" value={formatBRL(forecast.optimisticBRL)} sub="+30%" color="text-emerald-300" />
            <ForecastCard label="Fechado este mês" value={formatBRL(forecast.closedThisMonthBRL)} />
          </div>
        </section>
      )}

      {pipeline && (
        <section className="space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white print:text-slate-950">
            <Target className="h-4 w-4 text-cyan" />
            Pipeline por etapa
            <span className="rounded-full bg-electric/20 px-2 py-0.5 text-[10px] text-blue-300 print:text-slate-700">{filteredStages.reduce((sum, stage) => sum + stage.count, 0)} leads</span>
          </h3>
          <div className="overflow-hidden rounded-xl border border-line bg-panel/90 print:border-slate-200 print:bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-slate-500">
                  <th className="px-4 py-3 font-medium">Etapa</th>
                  <th className="px-4 py-3 text-right font-medium">Leads</th>
                  <th className="px-4 py-3 text-right font-medium">Valor estimado</th>
                  <th className="px-4 py-3 text-right font-medium">Prob.</th>
                  <th className="px-4 py-3 text-right font-medium">Ponderado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredStages.map((stage) => (
                  <tr key={stage.status} className="text-slate-300 print:text-slate-700">
                    <td className="px-4 py-3 font-medium text-white print:text-slate-950">{stage.status}</td>
                    <td className="px-4 py-3 text-right">{stage.count}</td>
                    <td className="px-4 py-3 text-right">{formatBRL(stage.estimatedValueBRL)}</td>
                    <td className="px-4 py-3 text-right">{(stage.conversionProbability * 100).toFixed(0)}%</td>
                    <td className="px-4 py-3 text-right font-medium text-cyan">{formatBRL(Math.round(stage.estimatedValueBRL * stage.conversionProbability))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-600">Score mínimo selecionado: {scoreMin}. Score médio geral: {pipeline.avgScore}</p>
        </section>
      )}

      {filteredTrends.length > 0 && (
        <section className="space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white print:text-slate-950">
            <BarChart3 className="h-4 w-4 text-cyan" />
            Tendência mensal
          </h3>
          <div className="overflow-hidden rounded-xl border border-line bg-panel/90 print:border-slate-200 print:bg-white">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-line">
                {filteredTrends.map((trend) => {
                  const barPct = Math.round((trend.revenueBRL / maxTrendRevenue) * 100);
                  return (
                    <tr key={trend.month} className="text-slate-300 print:text-slate-700">
                      <td className="px-4 py-3 font-mono text-xs">{trend.month}</td>
                      <td className="px-4 py-3 text-right">Buscas {trend.searches}</td>
                      <td className="px-4 py-3 text-right">Contatos {trend.contacts}</td>
                      <td className="px-4 py-3 text-right font-medium text-cyan">{formatBRL(trend.revenueBRL)}</td>
                      <td className="w-32 px-4 py-3">
                        <div className="h-2 rounded-full bg-white/10 print:bg-slate-200">
                          <div className="h-2 rounded-full bg-cyan" style={{ width: `${barPct}%` }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
