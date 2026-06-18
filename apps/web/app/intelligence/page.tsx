import { AlertTriangle, CheckCircle2, TrendingUp, Zap } from "lucide-react";
import { getCompanies } from "@/lib/api";
import { getServerSessionToken } from "@/lib/serverSession";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function IntelligencePage() {
  const sessionToken = await getServerSessionToken();
  const { companies, error } = await getCompanies(sessionToken)
    .then((companies) => ({ companies, error: "" }))
    .catch((error) => ({
      companies: [],
      error: error instanceof Error ? error.message : "Não foi possível carregar leads persistidos."
    }));

  const withWebsite = companies.filter((c) => c.website);
  const withGA4 = companies.filter((c) => c.hasGA4);
  const withPixel = companies.filter((c) => c.metaPixel);
  const withConversions = companies.filter((c) => c.hasConversionEvents);
  const withGTM = companies.filter((c) => c.googleTagManager || c.gtmContainerId);
  const withAds = companies.filter((c) => c.hasGoogleAds === true);
  const adsUnknown = companies.filter((c) => c.hasGoogleAds === null || c.hasGoogleAds === undefined);

  const avgPaidScore = withWebsite.length
    ? Math.round(withWebsite.reduce((s, c) => s + (c.paidTrafficScore ?? 0), 0) / withWebsite.length)
    : 0;

  const readyForAds = companies.filter((c) => (c.paidTrafficScore ?? 0) >= 60);
  const needsWork = companies.filter((c) => c.website && (c.paidTrafficScore ?? 0) < 40);

  const kpis = [
    { label: "Com site", value: withWebsite.length, total: companies.length, color: "text-cyan" },
    { label: "Com GA4", value: withGA4.length, total: companies.length, color: "text-blue-300" },
    { label: "Com Meta Pixel", value: withPixel.length, total: companies.length, color: "text-indigo-300" },
    { label: "Com conversões", value: withConversions.length, total: companies.length, color: "text-violet-300" },
    { label: "Com GTM", value: withGTM.length, total: companies.length, color: "text-emerald-300" },
    { label: "Com Google Ads", value: withAds.length, total: companies.length, color: "text-amber-300" },
    { label: "Google Ads não verificado", value: adsUnknown.length, total: companies.length, color: "text-slate-300" }
  ];

  return (
    <div className="space-y-8 p-4 md:p-8">
      {error && (
        <div className="rounded-lg border border-amber-400/40 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100">
          <strong>Persistência precisa de atenção:</strong> {error}
        </div>
      )}
      <div>
        <h1 className="text-xl font-semibold text-white">Inteligência Google</h1>
        <p className="mt-1 text-sm text-slate-400">Visão consolidada de prontidão para tráfego pago, keywords e Business Profile.</p>
      </div>

      {/* KPI grid */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((kpi) => {
          const pct = companies.length ? Math.round((kpi.value / companies.length) * 100) : 0;
          return (
            <div key={kpi.label} className="rounded-lg border border-line bg-panel/90 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">{kpi.label}</p>
                <span className={`text-sm font-semibold ${kpi.color}`}>{kpi.value}/{companies.length}</span>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-white/10">
                <div className={`h-1.5 rounded-full bg-current ${kpi.color}`} style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">{pct}% das empresas cadastradas</p>
            </div>
          );
        })}
      </section>

      {/* Paid traffic readiness */}
      <section className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-lg border border-line bg-panel/90 p-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-cyan" />
            <h2 className="font-semibold text-white">Score médio — Tráfego pago</h2>
          </div>
          <p className="mt-4 text-6xl font-semibold text-white">{avgPaidScore}<span className="text-2xl text-slate-500">/100</span></p>
          <div className="mt-3 h-2 rounded-full bg-white/10">
            <div className="h-2 rounded-full bg-electric" style={{ width: `${avgPaidScore}%` }} />
          </div>
          <div className="mt-4 flex gap-4 text-sm">
            <div>
              <p className="text-2xl font-semibold text-emerald-300">{readyForAds.length}</p>
              <p className="text-xs text-slate-400">Prontas para escalar (≥60)</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-red-400">{needsWork.length}</p>
              <p className="text-xs text-slate-400">Precisam de infraestrutura (&lt;40)</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-line bg-panel/90 p-5">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-cyan" />
            <h2 className="font-semibold text-white">Gaps mais comuns</h2>
          </div>
          <div className="mt-4 space-y-3">
            {[
              { label: "Sem GA4", count: companies.length - withGA4.length, priority: "high" },
              { label: "Sem Meta Pixel", count: companies.length - withPixel.length, priority: "high" },
              { label: "Sem eventos de conversão", count: companies.length - withConversions.length, priority: "high" },
              { label: "Sem GTM", count: companies.length - withGTM.length, priority: "medium" },
              { label: "Google Ads não verificado", count: adsUnknown.length, priority: "medium" },
              { label: "Sem site", count: companies.length - withWebsite.length, priority: "high" }
            ]
              .filter((g) => g.count > 0)
              .sort((a, b) => b.count - a.count)
              .map((gap) => (
                <div key={gap.label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`h-3.5 w-3.5 ${gap.priority === "high" ? "text-red-400" : "text-amber-400"}`} />
                    <span className="text-slate-300">{gap.label}</span>
                  </div>
                  <span className="font-medium text-white">{gap.count} empresas</span>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* Companies needing ads infrastructure */}
      {needsWork.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-slate-400">Empresas que precisam de infraestrutura de rastreamento</h2>
          <div className="space-y-2">
            {needsWork.slice(0, 10).map((company) => (
              <Link key={company.id} href={`/companies/${company.id}`} className="flex items-center justify-between rounded-lg border border-line bg-panel/90 px-4 py-3 transition hover:border-electric">
                <div>
                  <p className="text-sm font-medium text-white">{company.name}</p>
                  <p className="text-xs text-slate-500">{company.category} · {company.city}</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  {!company.metaPixel && <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-red-300">Sem Pixel</span>}
                  {!company.hasGA4 && <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-red-300">Sem GA4</span>}
                  <span className="text-slate-500">Score: {company.paidTrafficScore ?? 0}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Ready for ads */}
      {readyForAds.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-slate-400">Empresas prontas para escalar investimento</h2>
          <div className="space-y-2">
            {readyForAds.slice(0, 5).map((company) => (
              <Link key={company.id} href={`/companies/${company.id}`} className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 transition hover:border-emerald-500/40">
                <div>
                  <p className="text-sm font-medium text-white">{company.name}</p>
                  <p className="text-xs text-slate-500">{company.category} · {company.city}</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="font-medium text-emerald-300">Score {company.paidTrafficScore}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
