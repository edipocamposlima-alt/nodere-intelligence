import { BarChart3, TrendingUp, DollarSign, Target } from "lucide-react";
import { getPipelineReport, getForecastReport, getMonthlyTrends } from "@/lib/api";

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function ForecastCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-line bg-panel/90 p-5 text-center">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

export default async function ReportsPage() {
  const [pipeline, forecast, trends] = await Promise.all([
    getPipelineReport().catch(() => null),
    getForecastReport().catch(() => null),
    getMonthlyTrends().catch(() => [])
  ]);

  const maxTrendRevenue = Math.max(...trends.map((t) => t.revenueBRL), 1);

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div>
        <h2 className="text-2xl font-semibold text-white">Relatórios</h2>
        <p className="mt-1 text-sm text-slate-400">Pipeline, forecast de receita e tendências mensais</p>
      </div>

      {/* Forecast */}
      {forecast && (
        <section className="space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <TrendingUp className="h-4 w-4 text-cyan" />
            Forecast do mês
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <ForecastCard label="Receita esperada" value={formatBRL(forecast.expectedRevenueBRL)} sub="base" />
            <ForecastCard label="Cenário conservador" value={formatBRL(forecast.conservativeBRL)} sub="-30%" />
            <ForecastCard label="Cenário otimista" value={formatBRL(forecast.optimisticBRL)} sub="+30%" />
            <ForecastCard label="Fechado este mês" value={formatBRL(forecast.closedThisMonthBRL)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-line bg-panel/90 px-5 py-4">
              <p className="text-xs text-slate-400">Pipeline em aberto</p>
              <p className="text-lg font-bold text-cyan">{formatBRL(forecast.openOpportunitiesBRL)}</p>
            </div>
            <div className="rounded-xl border border-line bg-panel/90 px-5 py-4">
              <p className="text-xs text-slate-400">Ticket médio</p>
              <p className="text-lg font-bold text-white">{formatBRL(forecast.avgDealValueBRL)}</p>
            </div>
            <div className="rounded-xl border border-line bg-panel/90 px-5 py-4">
              <p className="text-xs text-slate-400">Taxa de conversão</p>
              <p className="text-lg font-bold text-white">{(forecast.conversionRate * 100).toFixed(1)}%</p>
            </div>
          </div>
        </section>
      )}

      {/* Pipeline stages */}
      {pipeline && (
        <section className="space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Target className="h-4 w-4 text-cyan" />
            Pipeline por estágio
            <span className="rounded-full bg-electric/20 px-2 py-0.5 text-[10px] text-blue-300">{pipeline.totalLeads} leads</span>
          </h3>
          <div className="rounded-xl border border-line bg-panel/90 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-slate-500">
                  <th className="px-4 py-3 font-medium">Estágio</th>
                  <th className="px-4 py-3 font-medium text-right">Leads</th>
                  <th className="px-4 py-3 font-medium text-right">Valor estimado</th>
                  <th className="px-4 py-3 font-medium text-right">Prob. conversão</th>
                  <th className="px-4 py-3 font-medium text-right">Valor ponderado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {pipeline.stages.map((stage) => (
                  <tr key={stage.status} className="text-slate-300 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium text-white">{stage.status}</td>
                    <td className="px-4 py-3 text-right">{stage.count}</td>
                    <td className="px-4 py-3 text-right">{formatBRL(stage.estimatedValueBRL)}</td>
                    <td className="px-4 py-3 text-right">{(stage.conversionProbability * 100).toFixed(0)}%</td>
                    <td className="px-4 py-3 text-right font-medium text-cyan">
                      {formatBRL(Math.round(stage.estimatedValueBRL * stage.conversionProbability))}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-line">
                <tr className="text-sm font-semibold text-white">
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3 text-right">{pipeline.totalLeads}</td>
                  <td className="px-4 py-3 text-right">{formatBRL(pipeline.totalPipelineValueBRL)}</td>
                  <td className="px-4 py-3 text-right">—</td>
                  <td className="px-4 py-3 text-right text-cyan">
                    {formatBRL(
                      pipeline.stages.reduce((s, st) => s + Math.round(st.estimatedValueBRL * st.conversionProbability), 0)
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="text-xs text-slate-600">Score médio: {pipeline.avgScore}</p>
        </section>
      )}

      {/* Monthly trends */}
      {trends.length > 0 && (
        <section className="space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <BarChart3 className="h-4 w-4 text-cyan" />
            Tendências mensais (últimos 6 meses)
          </h3>
          <div className="rounded-xl border border-line bg-panel/90 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-slate-500">
                  <th className="px-4 py-3 font-medium">Mês</th>
                  <th className="px-4 py-3 font-medium text-right">Buscas</th>
                  <th className="px-4 py-3 font-medium text-right">Enriquec.</th>
                  <th className="px-4 py-3 font-medium text-right">Contatos</th>
                  <th className="px-4 py-3 font-medium text-right">Fechados</th>
                  <th className="px-4 py-3 font-medium text-right">Receita</th>
                  <th className="px-4 py-3 font-medium">Barra</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {trends.map((t) => {
                  const barPct = Math.round((t.revenueBRL / maxTrendRevenue) * 100);
                  return (
                    <tr key={t.month} className="text-slate-300 hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">{t.month}</td>
                      <td className="px-4 py-3 text-right">{t.searches}</td>
                      <td className="px-4 py-3 text-right">{t.enrichments}</td>
                      <td className="px-4 py-3 text-right">{t.contacts}</td>
                      <td className="px-4 py-3 text-right text-emerald-400">{t.dealsClosed}</td>
                      <td className="px-4 py-3 text-right font-medium text-cyan">{formatBRL(t.revenueBRL)}</td>
                      <td className="px-4 py-3 w-32">
                        <div className="h-1.5 rounded-full bg-white/10">
                          <div className="h-1.5 rounded-full bg-cyan transition-all" style={{ width: `${barPct}%` }} />
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

      {/* Audit section summary */}
      <section className="rounded-xl border border-line bg-panel/90 p-5">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-cyan" />
          <p className="text-sm font-semibold text-white">Audit Log</p>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          O audit log completo está disponível em <code className="rounded bg-white/[0.06] px-1 py-0.5 text-[11px]">GET /api/audit</code>.
          Registra eventos de billing, permissões, usuários e sistema.
        </p>
      </section>
    </div>
  );
}
