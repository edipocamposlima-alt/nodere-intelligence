import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, Building2, Camera, Globe2, KanbanSquare, MessageCircle, MousePointerClick, Search, Star, TrendingUp } from "lucide-react";
import { CompanyTable } from "@/components/CompanyTable";
import { getCompanies, getDashboard, getOnboardingStatus, getReportSummary } from "@/lib/api";
import { getServerSessionToken } from "@/lib/serverSession";
import { OnboardingBanner } from "./OnboardingBanner";

export const dynamic = "force-dynamic";

type FunnelStage = { stage: string; count: number; conversion_from_prev: number };

export default async function DashboardPage() {
  const sessionToken = await getServerSessionToken();
  const [metrics, companiesResult, onboardingStatus, reportSummary] = await Promise.all([
    getDashboard(sessionToken),
    getCompanies(sessionToken).then((companies) => ({ companies, error: "" })).catch((error) => ({
      companies: [],
      error: error instanceof Error ? error.message : "Não foi possível carregar leads persistidos."
    })),
    getOnboardingStatus().catch(() => null),
    getReportSummary("30d", sessionToken).catch(() => null)
  ]);
  const companies = companiesResult.companies;
  const segmentCounts = groupAndSort(companies.map((company) => company.category || "Sem segmento")).slice(0, 6);
  const originCounts = groupAndSort(companies.map((company) => {
    if (company.cnpj) return "CNPJ";
    if (company.mapsUrl) return "Google Maps";
    if (company.notes?.some((note) => note.body.toLowerCase().includes("manual"))) return "Manual";
    return "CRM";
  })).slice(0, 6);
  const pipelineRows = Object.entries(metrics.pipeline)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);
  const maxPipeline = Math.max(1, ...pipelineRows.map(([, total]) => total));
  const recentActivities = companies
    .flatMap((company) => (company.notes ?? []).map((note) => ({ ...note, companyName: company.name })))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const cards = [
    { label: "Empresas encontradas", value: metrics.totalCompanies, icon: Building2, hex: "#03624C" },
    { label: "Baixa avaliação", value: metrics.lowRating, icon: Star, hex: "#03624C" },
    { label: "Sem site", value: metrics.withoutWebsite, icon: Globe2, hex: "#03624C" },
    { label: "Sem Google Ads", value: metrics.withoutGoogleAds, icon: MousePointerClick, hex: "#03624C" },
    { label: "Sem WhatsApp", value: metrics.withoutWhatsapp, icon: MessageCircle, hex: "#03624C" },
    { label: "Sem descrição", value: metrics.withoutDescription, icon: AlertTriangle, hex: "#03624C" },
    { label: "Sem fotos recentes", value: metrics.withoutRecentPhotos, icon: Camera, hex: "#03624C" },
    { label: "Leads quentes", value: metrics.hotLeads, icon: TrendingUp, hex: "#03624C" }
  ];
  const actionItems = [
    {
      title: "Atacar leads quentes",
      value: metrics.hotLeads,
      detail: "Priorize contato consultivo hoje",
      href: "/crm",
      tone: "warning"
    },
    {
      title: "Recuperar empresas sem site",
      value: metrics.withoutWebsite,
      detail: "Oferta direta: landing page + Google Ads",
      href: "/searches",
      tone: "brand"
    },
    {
      title: "Baixa avaliação no Google",
      value: metrics.lowRating,
      detail: "Abordagem: reputação + perfil otimizado",
      href: "/companies",
      tone: "danger"
    }
  ];

  return (
    <div className="space-y-8 p-4 md:p-8">
      {onboardingStatus && <OnboardingBanner initialSteps={onboardingStatus} />}
      {companiesResult.error && (
        <div className="rounded-lg border border-amber-400/40 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100">
          <strong>Persistência precisa de atenção:</strong> {companiesResult.error}
        </div>
      )}
      <section className="rounded-lg border border-electric/25 bg-panel/90 p-6 shadow-glow">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <div className="dashboard-brand-logo inline-flex rounded-2xl border border-electric/30 bg-ink/75 p-4 shadow-[0_0_34px_rgba(0,223,130,0.18)]">
              <Image src="/logo-noderi-full.png" alt="NODERI Nexus" width={560} height={190} priority className="h-auto w-full max-w-xl object-contain" />
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Central comercial para busca de empresas, CRM, funil, WhatsApp, propostas e inteligência operacional.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm md:min-w-72">
            <div className="rounded-lg border border-line bg-ink p-3">
              <p className="text-slate-400">CRM ativo</p>
              <p className="mt-1 text-2xl font-semibold text-white">{metrics.totalCompanies}</p>
            </div>
            <div className="rounded-lg border border-line bg-ink p-3">
              <p className="text-slate-400">Score médio</p>
              <p className="mt-1 text-2xl font-semibold text-white">{metrics.averageScore}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="metric-card rounded-lg border border-line bg-panel/90 p-4 transition hover:-translate-y-0.5 hover:border-cyan/60 hover:shadow-[0_12px_32px_rgba(34,211,238,0.12)]">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">{card.label}</p>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-electric/25 bg-electric/10 text-cyan shadow-[0_0_22px_rgba(0,223,130,0.12)]" style={{ color: card.hex }}>
                <card.icon className="h-5 w-5 drop-shadow" style={{ strokeWidth: 2.9 }} />
              </span>
            </div>
            <p className="mt-3 text-3xl font-semibold text-white">{card.value}</p>
          </div>
        ))}
      </section>

      <ConversionFunnel stages={reportSummary?.funnel ?? []} />

      <section className="grid gap-4 lg:grid-cols-3">
        {actionItems.map((item) => (
          <Link key={item.title} href={item.href} className={`rounded-xl border p-5 text-white shadow-[0_18px_45px_rgba(0,0,0,0.18)] transition hover:-translate-y-1 ${item.tone === "brand" ? "border-electric/40 bg-electric/15" : item.tone === "danger" ? "border-danger/40 bg-danger/15" : "border-warning/40 bg-warning/15"}`}>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">Ação recomendada</p>
            <div className="mt-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-lg font-semibold">{item.title}</p>
                <p className="mt-1 text-sm text-white/80">{item.detail}</p>
              </div>
              <span className="text-5xl font-black">{item.value}</span>
            </div>
          </Link>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_0.8fr_0.8fr]">
        <Link href="/searches" className="rounded-lg border border-electric/30 bg-electric/10 p-5 transition hover:border-electric">
          <Search className="h-5 w-5 text-cyan" />
          <p className="mt-4 text-lg font-semibold text-white">Buscar empresas</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">Abra a busca dedicada para filtros, seleção em massa, CSV e PDF.</p>
        </Link>
        <Link href="/crm" className="rounded-lg border border-line bg-panel/90 p-5 transition hover:border-electric/60">
          <KanbanSquare className="h-5 w-5 text-cyan" />
          <p className="mt-4 text-lg font-semibold text-white">Abrir CRM</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">Gerencie leads no pipeline com etapas coloridas e drag and drop.</p>
        </Link>
        <div className="rounded-lg border border-line bg-panel/90 p-5">
          <p className="text-sm font-medium text-white">Score médio de oportunidade</p>
          <div className="mt-6 flex items-end gap-3">
            <span className="text-6xl font-semibold text-white">{metrics.averageScore}</span>
            <span className="pb-2 text-sm text-slate-500">/100</span>
          </div>
          <div className="mt-5 h-2 rounded-full bg-white/10">
            <div className="h-2 rounded-full bg-electric" style={{ width: `${metrics.averageScore}%` }} />
          </div>
          <div className="mt-6 space-y-3">
            {Object.entries(metrics.pipeline).map(([status, total]) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <span className="text-slate-400">{status}</span>
                <span className="font-medium text-white">{total}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <DashboardBarPanel title="Leads por segmento" rows={segmentCounts} accent="#03624C" />
        <DashboardBarPanel title="Origem dos leads" rows={originCounts} accent="#00DF82" />
        <div className="rounded-lg border border-line bg-panel/90 p-5">
          <p className="text-sm font-semibold text-white">Pipeline por etapa</p>
          <div className="mt-4 space-y-3">
            {pipelineRows.length === 0 && <p className="text-sm text-slate-500">Sem etapas com dados ainda.</p>}
            {pipelineRows.map(([status, total]) => (
              <div key={status}>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="truncate text-slate-400">{status}</span>
                  <span className="font-semibold text-white">{total}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-white/10">
                  <div className="h-2 rounded-full bg-gradient-to-r from-cyan to-electric" style={{ width: `${Math.max(7, (total / maxPipeline) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
        <div className="rounded-lg border border-line bg-panel/90 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">Atividades recentes</h2>
            <span className="rounded-full bg-cyan/10 px-2 py-1 text-xs font-bold text-cyan">{recentActivities.length}</span>
          </div>
          <div className="mt-4 space-y-3">
            {recentActivities.length === 0 && (
              <p className="rounded-lg border border-dashed border-line p-4 text-sm text-slate-500">
                Sem atividades registradas. Ao salvar leads, notas, propostas ou follow-ups, o histórico aparece aqui.
              </p>
            )}
            {recentActivities.map((activity) => (
              <div key={activity.id} className="rounded-lg border border-line bg-ink p-3">
                <p className="text-sm font-semibold text-white">{activity.companyName}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{activity.body}</p>
                <p className="mt-2 text-xs text-slate-500">{new Date(activity.createdAt).toLocaleString("pt-BR")}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-line bg-panel/90 p-5">
          <h2 className="text-lg font-semibold text-white">Atalhos rápidos</h2>
          <div className="mt-4 grid gap-3">
            {[
              ["Nova Busca", "/searches", "Buscar empresas reais no Google Places"],
              ["Adicionar Lead", "/companies", "Cadastrar empresa manualmente"],
              ["Ver CRM", "/crm", "Mover oportunidades no funil"],
              ["Ver Relatórios", "/reports", "Analisar desempenho comercial"]
            ].map(([label, href, description]) => (
              <Link key={label} href={href} className="rounded-lg border border-line bg-ink p-3 transition hover:border-cyan hover:bg-cyan/10">
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="mt-1 text-xs text-slate-400">{description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Maiores oportunidades</h2>
          <p className="text-sm text-slate-500">Ordenado por score comercial</p>
        </div>
        <CompanyTable companies={companies} />
      </section>
    </div>
  );
}

const STAGE_COLORS: Record<string, { solid: string; soft: string }> = {
  "Novo Lead": { solid: "#2563EB", soft: "rgba(37,99,235,0.18)" },
  Qualificação: { solid: "#16A34A", soft: "rgba(22,163,74,0.18)" },
  "Em Atendimento": { solid: "#F59E0B", soft: "rgba(245,158,11,0.2)" },
  Proposta: { solid: "#F97316", soft: "rgba(249,115,22,0.18)" },
  Fechamento: { solid: "#7C3AED", soft: "rgba(124,58,237,0.18)" },
  Cliente: { solid: "#03624C", soft: "rgba(3,98,76,0.18)" }
};

function ConversionFunnel({ stages }: { stages: FunnelStage[] }) {
  const max = Math.max(1, ...stages.map((stage) => stage.count));

  return (
    <section className="rounded-lg border border-line bg-panel/90 p-5 shadow-[0_18px_45px_rgba(0,0,0,0.12)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-lg font-semibold text-white">Funil de conversão</p>
          <p className="mt-1 text-sm text-slate-400">Leads distribuídos por etapa comercial e conversão entre fases.</p>
        </div>
        <span className="rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 text-xs font-semibold text-cyan">
          Dados reais do CRM
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {stages.length === 0 && (
          <p className="rounded-lg border border-dashed border-line p-4 text-sm text-slate-500 md:col-span-3 xl:col-span-6">
            Sem dados de funil ainda. Ao salvar leads no CRM, as etapas aparecem aqui automaticamente.
          </p>
        )}
        {stages.map((stage) => {
          const color = STAGE_COLORS[stage.stage] ?? { solid: "#03624C", soft: "rgba(3,98,76,0.18)" };
          return (
            <div key={stage.stage} className="rounded-lg border border-line bg-ink p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color.solid, boxShadow: `0 0 18px ${color.solid}` }} />
                <span className="rounded-full px-2 py-1 text-xs font-bold" style={{ color: color.solid, backgroundColor: color.soft }}>
                  {stage.conversion_from_prev}%
                </span>
              </div>
              <p className="mt-4 text-sm font-semibold text-white">{stage.stage}</p>
              <p className="mt-2 text-3xl font-black text-white">{stage.count}</p>
              <div className="mt-3 h-2 rounded-full bg-white/10">
                <div className="h-2 rounded-full" style={{ width: `${Math.max(7, (stage.count / max) * 100)}%`, backgroundColor: color.solid }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function groupAndSort(values: string[]) {
  const groups = values.reduce<Record<string, number>>((acc, value) => {
    const label = value?.trim() || "Sem informação";
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(groups).sort(([, a], [, b]) => b - a);
}

function DashboardBarPanel({ title, rows, accent }: { title: string; rows: Array<[string, number]>; accent: string }) {
  const max = Math.max(1, ...rows.map(([, total]) => total));
  return (
    <div className="rounded-lg border border-line bg-panel/90 p-5">
      <p className="text-sm font-semibold text-white">{title}</p>
      <div className="mt-4 space-y-3">
        {rows.length === 0 && <p className="text-sm text-slate-500">Sem dados suficientes ainda.</p>}
        {rows.map(([label, total]) => (
          <div key={label}>
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="truncate text-slate-400">{label}</span>
              <span className="font-semibold text-white">{total}</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-white/10">
              <div className="h-2 rounded-full" style={{ width: `${Math.max(8, (total / max) * 100)}%`, backgroundColor: accent }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

