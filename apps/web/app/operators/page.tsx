import { Medal, Target, TrendingUp } from "lucide-react";
import { getOperatorRanking, getOperators, getOperatorGoals } from "@/lib/api";
import type { OperatorGoal } from "@/lib/types";
import { GoalsForm } from "./GoalsForm";
import { OperatorCreateForm } from "./OperatorCreateForm";

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function GoalBar({ value, target, label }: { value: number; target: number; label: string }) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span>{label}</span>
        <span>{value}/{target}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10">
        <div
          className={`h-1.5 rounded-full transition-all ${pct >= 100 ? "bg-emerald-400" : pct >= 60 ? "bg-cyan" : "bg-amber-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const MEDAL_COLOR = ["text-yellow-400", "text-slate-300", "text-amber-600"];

export default async function OperatorsPage() {
  const [ranking] = await Promise.all([
    getOperatorRanking().catch(() => []),
    getOperators().catch(() => [])
  ]);

  const sorted = [...ranking].sort((a, b) => b.totalRevenueClosedBRL - a.totalRevenueClosedBRL);

  const goalsMap: Record<string, OperatorGoal | null> = {};
  await Promise.all(
    sorted.map(async (op) => {
      goalsMap[op.operatorId] = await getOperatorGoals(op.operatorId).catch(() => null);
    })
  );

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div>
        <h2 className="text-2xl font-semibold text-white">Operadores</h2>
        <p className="mt-1 text-sm text-slate-400">Cadastro, ranking de produtividade e metas mensais</p>
      </div>

      <OperatorCreateForm />

      {/* Ranking podium */}
      <section className="space-y-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Medal className="h-4 w-4 text-cyan" />
          Ranking do mês
        </h3>
        <div className="overflow-x-auto rounded-xl border border-line bg-panel/90">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-slate-500">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Operador</th>
                <th className="px-4 py-3 font-medium text-right">Buscas</th>
                <th className="px-4 py-3 font-medium text-right">Contatos</th>
                <th className="px-4 py-3 font-medium text-right">Reuniões</th>
                <th className="px-4 py-3 font-medium text-right">Propostas</th>
                <th className="px-4 py-3 font-medium text-right">Fechados</th>
                <th className="px-4 py-3 font-medium text-right">Conversão</th>
                <th className="px-4 py-3 font-medium text-right">Pipeline</th>
                <th className="px-4 py-3 font-medium text-right">Receita</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {sorted.map((op, i) => (
                <tr key={op.operatorId} className="text-slate-300 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <span className={`font-bold ${MEDAL_COLOR[i] ?? "text-slate-500"}`}>#{i + 1}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-white">{op.operatorName}</td>
                  <td className="px-4 py-3 text-right">{op.searchesDone}</td>
                  <td className="px-4 py-3 text-right">{op.contactsMade}</td>
                  <td className="px-4 py-3 text-right">{op.meetingsScheduled}</td>
                  <td className="px-4 py-3 text-right">{op.proposalsSent}</td>
                  <td className="px-4 py-3 text-right font-medium text-emerald-400">{op.dealsClosed}</td>
                  <td className="px-4 py-3 text-right">{(op.conversionRate * 100).toFixed(0)}%</td>
                  <td className="px-4 py-3 text-right text-xs">{formatBRL(op.totalPipelineValue)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-cyan">{formatBRL(op.totalRevenueClosedBRL)}</td>
                  <td className="px-4 py-3 text-right">
                    <GoalsForm op={op} goal={goalsMap[op.operatorId] ?? null} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Goals progress */}
      <section className="space-y-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Target className="h-4 w-4 text-cyan" />
          Progresso de metas
        </h3>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((op) => {
            const goal = goalsMap[op.operatorId];
            return (
              <div key={op.operatorId} className="rounded-xl border border-line bg-panel/90 p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-semibold text-white">{op.operatorName}</p>
                  <TrendingUp className="h-4 w-4 text-slate-500" />
                </div>
                {goal ? (
                  <div className="space-y-3">
                    <GoalBar value={op.searchesDone} target={goal.targetSearches} label="Buscas" />
                    <GoalBar value={op.contactsMade} target={goal.targetContacts} label="Contatos" />
                    <GoalBar value={op.dealsClosed} target={goal.targetDeals} label="Negócios fechados" />
                    <GoalBar value={Math.round(op.totalRevenueClosedBRL / 1000)} target={Math.round(goal.targetRevenueBRL / 1000)} label="Receita (k)" />
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Nenhuma meta definida. Clique em &quot;Editar metas&quot; na tabela.</p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
