import { CreditCard, CheckCircle, Zap } from "lucide-react";
import { getBillingStatus, getBillingPlans, getUsageLog } from "@/lib/api";
import { CheckoutButton } from "./CheckoutButton";

const PLAN_ORDER = ["demo", "starter", "pro", "agency"];

function formatBRL(cents: number) {
  if (cents === 0) return "Grátis";
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}/mês`;
}

export default async function BillingPage() {
  const [billing, plans, usage] = await Promise.all([
    getBillingStatus().catch(() => null),
    getBillingPlans().catch(() => []),
    getUsageLog(20).catch(() => [])
  ]);

  const balancePct = billing ? Math.min(100, (billing.balance / billing.plan.monthlyCredits) * 100) : 0;

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div>
        <h2 className="text-2xl font-semibold text-white">Faturamento</h2>
        <p className="mt-1 text-sm text-slate-400">Plano atual, créditos e upgrades</p>
      </div>

      {/* Current plan status */}
      {billing && (
        <section className="rounded-xl border border-line bg-panel/90 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <CreditCard className="h-6 w-6 text-cyan" />
              <div>
                <p className="text-lg font-semibold text-white">Plano {billing.plan.name}</p>
                <p className="text-sm text-slate-400">
                  {billing.subscriptionStatus ? `Status: ${billing.subscriptionStatus}` : "Modo demonstrativo"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{billing.balance.toLocaleString("pt-BR")}</p>
              <p className="text-xs text-slate-400">créditos disponíveis</p>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>{billing.used} usados este mês</span>
              <span>{billing.plan.monthlyCredits} total</span>
            </div>
            <div className="h-2 rounded-full bg-white/10">
              <div className="h-2 rounded-full bg-cyan transition-all" style={{ width: `${balancePct}%` }} />
            </div>
            {billing.resetAt && (
              <p className="mt-1 text-[11px] text-slate-600">
                Reinicia em {new Date(billing.resetAt).toLocaleDateString("pt-BR")}
              </p>
            )}
          </div>

          {billing.gated && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              Créditos esgotados. Faça upgrade para continuar usando.
            </div>
          )}
        </section>
      )}

      {/* Plan comparison */}
      <section className="space-y-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Zap className="h-4 w-4 text-cyan" />
          Planos disponíveis
        </h3>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[...plans].sort((a, b) => PLAN_ORDER.indexOf(a.id) - PLAN_ORDER.indexOf(b.id)).map((plan) => {
            const isCurrent = billing?.plan.id === plan.id;
            return (
              <div
                key={plan.id}
                className={`rounded-xl border p-5 ${isCurrent ? "border-cyan bg-cyan/10" : "border-line bg-panel/90"}`}
              >
                {isCurrent && (
                  <span className="mb-3 inline-block rounded-full bg-cyan/20 px-2 py-0.5 text-[10px] font-semibold text-cyan">
                    PLANO ATUAL
                  </span>
                )}
                <p className="text-lg font-bold text-white">{plan.name}</p>
                <p className="mt-1 text-sm font-medium text-cyan">{formatBRL(plan.priceMonthly)}</p>
                <p className="mt-0.5 text-xs text-slate-400">{plan.id === "agency" ? "Créditos ilimitados" : `${plan.monthlyCredits.toLocaleString("pt-BR")} créditos/mês`}</p>

                <ul className="mt-4 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-slate-300">
                      <CheckCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-cyan" />
                      {f}
                    </li>
                  ))}
                </ul>

                {!isCurrent && plan.id !== "demo" && (
                  plan.paymentLinkUrl || plan.stripePriceId
                    ? <CheckoutButton planId={plan.id} label={`Assinar ${plan.name}`} paymentLinkUrl={plan.paymentLinkUrl} />
                    : <button disabled className="mt-4 w-full rounded-lg border border-line bg-white/5 px-4 py-2 text-sm font-semibold text-slate-400">Em breve</button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent usage */}
      {usage.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-white">Últimas transações de crédito</h3>
          <div className="rounded-xl border border-line bg-panel/90 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-slate-500">
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Descrição</th>
                  <th className="px-4 py-3 font-medium text-right">Créditos</th>
                  <th className="px-4 py-3 font-medium text-right">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {usage.map((e) => (
                  <tr key={e.id} className="text-slate-300 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-xs capitalize text-slate-400">{e.type.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3 truncate max-w-[200px]">{e.description}</td>
                    <td className="px-4 py-3 text-right font-mono text-red-400">-{e.amount}</td>
                    <td className="px-4 py-3 text-right text-xs text-slate-500">
                      {new Date(e.at).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
