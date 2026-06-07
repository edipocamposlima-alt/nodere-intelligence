import Link from "next/link";
import type { ReactNode } from "react";
import { Activity, ArrowRight, Medal, TrendingUp, UserRoundCheck } from "lucide-react";
import { getReportOperators } from "@/lib/api";

function pct(value: number) {
  return `${Math.round((value || 0) * 100)}%`;
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "OP";
}

const roleLabels: Record<string, string> = {
  owner: "Owner",
  admin: "Administrador",
  operator: "Operador",
  viewer: "Visualizador"
};

export default async function OperatorsPage() {
  const operators = await getReportOperators().catch(() => []);
  const sorted = [...operators].sort((a, b) => b.leads_created + b.followups_done + b.leads_closed - (a.leads_created + a.followups_done + a.leads_closed));
  const totalLeads = sorted.reduce((sum, item) => sum + item.leads_created, 0);
  const totalActivities = sorted.reduce((sum, item) => sum + item.followups_done, 0);
  const totalClosed = sorted.reduce((sum, item) => sum + item.leads_closed, 0);

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Operadores</h2>
          <p className="mt-1 text-sm text-slate-400">Desempenho real por usuário. Cadastros, senhas e permissões ficam no painel Administrador.</p>
        </div>
        <Link href="/admin" className="inline-flex items-center gap-2 rounded-xl bg-electric px-4 py-3 text-sm font-bold text-white shadow-glow">
          Gerenciar usuários
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<UserRoundCheck className="h-5 w-5" />} label="Operadores ativos" value={sorted.length} />
        <Metric icon={<TrendingUp className="h-5 w-5" />} label="Leads criados" value={totalLeads} />
        <Metric icon={<Activity className="h-5 w-5" />} label="Atividades registradas" value={totalActivities} />
        <Metric icon={<Medal className="h-5 w-5" />} label="Fechamentos" value={totalClosed} />
      </section>

      {sorted.length === 0 ? (
        <section className="rounded-xl border border-line bg-panel/90 p-8 text-center">
          <UserRoundCheck className="mx-auto h-10 w-10 text-cyan" />
          <h3 className="mt-4 text-lg font-bold text-white">Nenhum operador encontrado</h3>
          <p className="mt-2 text-sm text-slate-400">Crie usuários no Administrador para acompanhar produtividade real por conta.</p>
          <Link href="/admin" className="mt-4 inline-flex rounded-lg bg-electric px-4 py-2 text-sm font-bold text-white">Abrir Administrador</Link>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((operator, index) => (
            <article key={operator.user_id} className="rounded-2xl border border-line bg-panel/90 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-electric text-lg font-black text-white shadow-glow">
                    {initials(operator.name)}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{operator.name}</h3>
                    <p className="text-xs text-slate-500">{operator.email || "Sem e-mail"}</p>
                  </div>
                </div>
                <span className="rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 text-xs font-bold text-cyan">#{index + 1}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">{roleLabels[operator.role || "operator"] || operator.role || "Operador"}</span>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">Conversão {pct(operator.conversion_rate)}</span>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <MiniMetric label="Leads" value={operator.leads_created} />
                <MiniMetric label="Atividades" value={operator.followups_done} />
                <MiniMetric label="Fechados" value={operator.leads_closed} />
              </div>
              <p className="mt-4 text-xs text-slate-500">Última atividade: {operator.last_active ? new Date(operator.last_active).toLocaleString("pt-BR") : "Não registrada"}</p>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-panel/90 p-5">
      <div className="flex items-center justify-between text-cyan">{icon}</div>
      <p className="mt-4 text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-black text-white">{value.toLocaleString("pt-BR")}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-ink p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}
