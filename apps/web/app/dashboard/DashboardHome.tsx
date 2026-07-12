import Link from "next/link";
import { AlertTriangle, ArrowUpRight, BarChart3, Building2, CheckCircle2, CircleDollarSign, Flame, Globe2, KanbanSquare, MessageCircle, MousePointerClick, RadioTower, Search, Sparkles, Star, Target, TrendingUp, Users } from "lucide-react";
import type { Company } from "@/lib/types";
import { getCompanies, getDashboard, getOnboardingStatus, getReportProposals, getReportSummary } from "@/lib/api";
import { getServerSessionToken } from "@/lib/serverSession";
import { OnboardingBanner } from "./OnboardingBanner";
import { Logo } from "@/components/brand/Logo";
import { getStatusTone } from "@/lib/statusPalette";

export const dynamic = "force-dynamic";

type FunnelStage = { stage: string; count: number; conversion_from_prev: number };
type Tone = "success" | "info" | "warning" | "orange" | "danger" | "neutral";
type IconTone = "green" | "blue" | "lime" | "gold" | "red" | "orange" | "cyan" | "neutral";

const toneStyle: Record<Tone, { text: string; bg: string; border: string; bar: string; iconTone: IconTone }> = {
  success: { text: "text-[var(--status-high)]", bg: "bg-[var(--status-high-bg)]", border: "border-[var(--status-high-border)]", bar: "bg-[var(--status-high)]", iconTone: "green" },
  info: { text: "text-[var(--status-progress)]", bg: "bg-[var(--status-progress-bg)]", border: "border-[var(--status-progress-border)]", bar: "bg-[var(--status-progress)]", iconTone: "blue" },
  warning: { text: "text-[var(--status-moderate)]", bg: "bg-[var(--status-moderate-bg)]", border: "border-[var(--status-moderate-border)]", bar: "bg-[var(--status-moderate)]", iconTone: "gold" },
  orange: { text: "text-[var(--status-waiting)]", bg: "bg-[var(--status-waiting-bg)]", border: "border-[var(--status-waiting-border)]", bar: "bg-[var(--status-waiting)]", iconTone: "orange" },
  danger: { text: "text-[var(--status-critical)]", bg: "bg-[var(--status-critical-bg)]", border: "border-[var(--status-critical-border)]", bar: "bg-[var(--status-critical)]", iconTone: "red" },
  neutral: { text: "text-[var(--status-low)]", bg: "bg-[var(--status-low-bg)]", border: "border-[var(--status-low-border)]", bar: "bg-[var(--status-low)]", iconTone: "neutral" }
};

const stageTones: Record<string, Tone> = {
  "Novo Lead": "info",
  Qualificado: "success",
  Qualificação: "success",
  Contatado: "info",
  "Em Atendimento": "info",
  Negociação: "info",
  Proposta: "warning",
  "Proposta enviada": "warning",
  Fechamento: "info",
  Fechado: "success",
  Cliente: "success",
  Perdido: "neutral"
};

export default async function DashboardPage() {
  const sessionToken = await getServerSessionToken();
  const [metrics, companiesResult, onboardingStatus, reportSummary, proposalReport] = await Promise.all([
    getDashboard(sessionToken),
    getCompanies(sessionToken).then((companies) => ({ companies, error: "" })).catch((error) => ({
      companies: [] as Company[],
      error: error instanceof Error ? error.message : "Não foi possível carregar leads persistidos."
    })),
    getOnboardingStatus().catch(() => null),
    getReportSummary("30d", sessionToken).catch(() => null),
    getReportProposals("30d").catch(() => ({ by_status: [], pipeline_value: 0, accepted_value: 0 }))
  ]);

  const companies = companiesResult.companies;
  const totalSavedLeads = companies.length || metrics.totalCompanies || reportSummary?.total_leads_in_crm || 0;
  const withoutSocial = companies.filter((company) => !company.instagram && !company.facebook && !company.linkedin && !company.youtube).length;
  const recommendedActionLeads = companies.filter((company) => Boolean(company.nextAction || company.recommendedApproach || company.suggestedApproach || company.detectedOpportunities?.length)).length;
  const convertedClients = companies.filter((company) => ["Fechado", "Cliente"].includes(String(company.status || ""))).length;
  const hotLeads = companies.filter((company) => String(company.temperature || company.opportunityLevel || "").toLowerCase().includes("quente") || company.opportunityLevel === "Alta").length || metrics.hotLeads;
  const openProposals = proposalReport.by_status.filter((item) => ["draft", "sent"].includes(item.status)).reduce((sum, item) => sum + item.count, 0);
  const sentProposals = proposalReport.by_status.filter((item) => item.status === "sent").reduce((sum, item) => sum + item.count, 0);
  const acceptedProposals = proposalReport.by_status.filter((item) => item.status === "accepted").reduce((sum, item) => sum + item.count, 0);

  const segmentCounts = groupAndSort(companies.map((company) => company.category || "Sem segmento")).slice(0, 7);
  const originCounts = groupAndSort(companies.map((company) => sourceLabel(company))).slice(0, 7);
  const priorityCounts = groupAndSort(companies.map((company) => company.opportunityLevel || "Sem prioridade")).slice(0, 5);
  const pipelineRows = Object.entries(metrics.pipeline).sort(([, a], [, b]) => b - a).slice(0, 8);
  const funnelStages = reportSummary?.funnel?.length ? reportSummary.funnel : pipelineRows.map(([stage, count]) => ({ stage, count, conversion_from_prev: 0 }));
  const recentActivities = companies
    .flatMap((company) => (company.notes ?? []).map((note) => ({
      id: note.id,
      companyName: company.name,
      body: cleanActivity(note.body),
      createdAt: note.createdAt,
      status: company.status
    })))
    .filter((item) => item.body)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  const topOpportunities = [...companies]
    .sort((a, b) => Number(b.score || 0) - Number(a.score || 0))
    .slice(0, 8);

  const primaryKpis = [
    { label: "Leads salvos no CRM", value: totalSavedLeads, hint: "Somente registros persistidos", icon: Users, tone: "success" as Tone, iconTone: "green" as IconTone },
    { label: "Score médio", value: `${metrics.averageScore || reportSummary?.avg_score || 0}`, hint: "Oportunidade comercial", icon: Target, tone: "info" as Tone, iconTone: "blue" as IconTone },
    { label: "Leads quentes", value: hotLeads, hint: "Alta prioridade", icon: Flame, tone: "success" as Tone, iconTone: "lime" as IconTone },
    { label: "Conversões", value: convertedClients || acceptedProposals, hint: `${reportSummary?.conversion_rate ?? 0}% no período`, icon: CheckCircle2, tone: "warning" as Tone, iconTone: "gold" as IconTone }
  ];

  const diagnosticKpis = [
    { label: "Empresas encontradas", value: metrics.totalCompanies, icon: Building2, tone: "info" as Tone, iconTone: "blue" as IconTone, href: "/companies" },
    { label: "Sem site", value: metrics.withoutWebsite, icon: Globe2, tone: "danger" as Tone, iconTone: "red" as IconTone, href: "/companies?filter=without-site" },
    { label: "Sem WhatsApp", value: metrics.withoutWhatsapp, icon: MessageCircle, tone: "orange" as Tone, iconTone: "orange" as IconTone, href: "/companies?filter=without-whatsapp" },
    { label: "Sem redes sociais", value: withoutSocial, icon: RadioTower, tone: "warning" as Tone, iconTone: "gold" as IconTone, href: "/companies?filter=without-social" },
    { label: "Sem Google Ads", value: metrics.withoutGoogleAds, icon: MousePointerClick, tone: "warning" as Tone, iconTone: "gold" as IconTone, href: "/companies?filter=without-google-ads" },
    { label: "Ação recomendada", value: recommendedActionLeads, icon: Sparkles, tone: "success" as Tone, iconTone: "green" as IconTone, href: "/crm" },
    { label: "Propostas enviadas", value: sentProposals, icon: CircleDollarSign, tone: "info" as Tone, iconTone: "blue" as IconTone, href: "/app/proposals" },
    { label: "Propostas em aberto", value: openProposals, icon: AlertTriangle, tone: "orange" as Tone, iconTone: "orange" as IconTone, href: "/app/proposals" }
  ];

  const recommendedActions = [
    { title: "Priorizar leads quentes", value: hotLeads, detail: "Alta oportunidade exige contato rápido.", href: "/crm", tone: "success" as Tone },
    { title: "Revisar empresas sem site", value: metrics.withoutWebsite, detail: "Boa entrada para landing page, tráfego e presença digital.", href: "/companies?filter=without-site", tone: "danger" as Tone },
    { title: "Enviar follow-up", value: recommendedActionLeads, detail: "Leads com próximo passo ou recomendação registrada.", href: "/crm", tone: "orange" as Tone },
    { title: "Acompanhar propostas", value: openProposals, detail: "Documentos em aberto pedem retorno comercial.", href: "/app/proposals", tone: "info" as Tone }
  ];

  return (
    <div className="space-y-5 p-4 md:p-6">
      {onboardingStatus && <OnboardingBanner initialSteps={onboardingStatus} />}
      {companiesResult.error && (
        <div className="rounded-lg border border-amber-400/40 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100">
          <strong>Persistência precisa de atenção:</strong> {companiesResult.error}
        </div>
      )}

      <section className="rounded-lg border border-line bg-panel/90 p-4 shadow-glow md:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
            <div className="dashboard-brand-logo nodere-brand-surface inline-flex w-fit rounded-2xl border border-electric/30 p-4 shadow-[0_0_34px_rgba(0,223,130,0.18)]">
              <Logo variant="full" height={64} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-black text-[var(--text-primary)] md:text-2xl">Dashboard executivo</h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
                Visão visual da operação comercial, CRM e inteligência de prospecção com dados salvos no workspace.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/searches" className="inline-flex items-center gap-2 rounded-lg border border-cyan/30 bg-cyan/10 px-3 py-2 text-sm font-bold text-cyan transition hover:bg-cyan/15">
              <Search className="h-4 w-4" /> Buscar empresas
            </Link>
            <Link href="/crm" className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm font-bold text-emerald-200 transition hover:bg-emerald-500/15">
              <KanbanSquare className="h-4 w-4" /> Abrir CRM
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {primaryKpis.map((item) => <KpiCard key={item.label} {...item} />)}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {diagnosticKpis.map((item) => <CompactMetric key={item.label} {...item} />)}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <ConversionFunnel stages={funnelStages} />
        <ScorePanel score={metrics.averageScore || reportSummary?.avg_score || 0} pipeline={metrics.pipeline} />
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <DashboardBarPanel title="Leads por status" rows={pipelineRows} tone="info" />
        <DashboardBarPanel title="Leads por segmento" rows={segmentCounts} tone="success" />
        <DashboardBarPanel title="Origem dos leads" rows={originCounts} tone="warning" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <OpportunityRanking companies={topOpportunities} />
        <div className="space-y-5">
          <DashboardBarPanel title="Oportunidades por prioridade" rows={priorityCounts} tone="orange" />
          <RecommendedActions items={recommendedActions} />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <RecentActivities items={recentActivities} />
        <ProposalSnapshot sent={sentProposals} open={openProposals} accepted={acceptedProposals} pipelineValue={proposalReport.pipeline_value} acceptedValue={proposalReport.accepted_value} />
      </section>
    </div>
  );
}

function KpiCard({ label, value, hint, icon: Icon, tone, iconTone }: { label: string; value: string | number; hint: string; icon: typeof Users; tone: Tone; iconTone?: IconTone }) {
  const style = toneStyle[tone];
  return (
    <div className={`rounded-lg border ${style.border} ${style.bg} p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--text-secondary)]">{label}</p>
          <p className="mt-2 text-3xl font-black text-[var(--text-primary)]">{value}</p>
        </div>
        <span className={`nodere-icon-tone flex h-10 w-10 items-center justify-center rounded-lg border ${style.border}`} data-icon-tone={iconTone || style.iconTone}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-xs text-[var(--text-secondary)]">{hint}</p>
    </div>
  );
}

function CompactMetric({ label, value, icon: Icon, tone, iconTone, href }: { label: string; value: number; icon: typeof Users; tone: Tone; iconTone?: IconTone; href: string }) {
  const style = toneStyle[tone];
  return (
    <Link href={href} className="rounded-lg border border-line bg-panel/90 p-4 transition hover:-translate-y-0.5 hover:border-cyan/50">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-[var(--text-secondary)]">{label}</p>
        <span className="nodere-icon-tone flex h-9 w-9 items-center justify-center rounded-lg" data-icon-tone={iconTone || style.iconTone}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 text-2xl font-black text-[var(--text-primary)]">{value}</p>
    </Link>
  );
}

function ScorePanel({ score, pipeline }: { score: number; pipeline: Record<string, number> }) {
  const bounded = Math.max(0, Math.min(100, Number(score || 0)));
  return (
    <section className="rounded-lg border border-line bg-panel/90 p-5">
      <p className="text-sm font-bold text-[var(--text-primary)]">Score médio de oportunidade</p>
      <div className="mt-6 flex items-end gap-3">
        <span className="text-6xl font-black text-[var(--text-primary)]">{bounded}</span>
        <span className="pb-2 text-sm text-[var(--text-secondary)]">/100</span>
      </div>
      <div className="mt-5 h-2 rounded-full bg-white/10">
        <div className="h-2 rounded-full bg-electric" style={{ width: `${bounded}%` }} />
      </div>
      <div className="mt-5 grid gap-2">
        {Object.entries(pipeline).slice(0, 5).map(([status, total]) => (
          <div key={status} className="flex items-center justify-between text-sm">
            <span className="truncate text-[var(--text-secondary)]">{status}</span>
            <span className="font-bold text-[var(--text-primary)]">{total}</span>
          </div>
        ))}
        {Object.keys(pipeline).length === 0 && <EmptyText />}
      </div>
    </section>
  );
}

function ConversionFunnel({ stages }: { stages: FunnelStage[] }) {
  const max = Math.max(1, ...stages.map((stage) => stage.count));
  return (
    <section className="rounded-lg border border-line bg-panel/90 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-lg font-black text-[var(--text-primary)]">Pipeline por etapa</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Leads salvos distribuídos pelo funil comercial.</p>
        </div>
        <span className="rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 text-xs font-semibold text-cyan">Dados reais do CRM</span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {stages.length === 0 && <EmptyBlock text="Ainda não há dados suficientes para este indicador." />}
        {stages.map((stage) => {
          const tone = toneStyle[stageTones[stage.stage] || "info"];
          return (
            <div key={stage.stage} className="rounded-lg border border-line bg-ink/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className={`h-3 w-3 rounded-full ${tone.bar}`} />
                <span className={`rounded-full px-2 py-1 text-xs font-bold ${tone.bg} ${tone.text}`}>{stage.conversion_from_prev}%</span>
              </div>
              <p className="mt-4 text-sm font-bold text-[var(--text-primary)]">{stage.stage}</p>
              <p className="mt-1 text-3xl font-black text-[var(--text-primary)]">{stage.count}</p>
              <div className="mt-3 h-2 rounded-full bg-white/10">
                <div className={`h-2 rounded-full ${tone.bar}`} style={{ width: `${Math.max(7, (stage.count / max) * 100)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function DashboardBarPanel({ title, rows, tone }: { title: string; rows: Array<[string, number]>; tone: Tone }) {
  const max = Math.max(1, ...rows.map(([, total]) => total));
  const style = toneStyle[tone];
  return (
    <div className="rounded-lg border border-line bg-panel/90 p-5">
      <p className="text-sm font-black text-[var(--text-primary)]">{title}</p>
      <div className="mt-4 space-y-3">
        {rows.length === 0 && <EmptyText />}
        {rows.map(([label, total]) => (
          <div key={label}>
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="truncate text-[var(--text-secondary)]">{label}</span>
              <span className="font-bold text-[var(--text-primary)]">{total}</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-white/10">
              <div className={`h-2 rounded-full ${style.bar}`} style={{ width: `${Math.max(8, (total / max) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OpportunityRanking({ companies }: { companies: Company[] }) {
  return (
    <section className="rounded-lg border border-line bg-panel/90 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-[var(--text-primary)]">Maiores oportunidades</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Top leads salvos no CRM, ordenados por score comercial.</p>
        </div>
        <Link href="/crm" className="inline-flex items-center gap-1 text-sm font-bold text-cyan">Ver CRM <ArrowUpRight className="h-4 w-4" /></Link>
      </div>
      <div className="mt-4 space-y-3">
        {companies.length === 0 && <EmptyBlock text="Ainda não há dados suficientes para este indicador." />}
        {companies.map((company, index) => {
          const tone = company.opportunityLevel === "Alta" ? "success" : company.opportunityLevel === "Media" ? "warning" : "neutral";
          const style = toneStyle[tone];
          return (
            <Link key={company.id} href={`/app/crm/clientes/${encodeURIComponent(company.id)}?tab=overview&return=/dashboard`} className="grid gap-3 rounded-lg border border-line bg-ink/70 p-3 transition hover:border-cyan/50 md:grid-cols-[42px_1fr_auto] md:items-center">
              <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${style.bg} ${style.text} text-sm font-black`}>{index + 1}</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[var(--text-primary)]">{company.name}</p>
                <p className="mt-1 truncate text-xs text-[var(--text-secondary)]">{company.category || "Sem segmento"} · {[company.city, company.state].filter(Boolean).join("/") || "Localidade não informada"}</p>
                <p className="mt-1 line-clamp-1 text-xs text-[var(--text-secondary)]">{mainOpportunity(company)}</p>
              </div>
              <div className="flex items-center gap-2 md:justify-end">
                <span className="nodere-status-badge" data-tone={getStatusTone(company.status || "Novo Lead")} title={company.status || "Novo Lead"}>
                  <span className="nodere-status-dot" aria-hidden="true" />
                  {company.status || "Novo Lead"}
                </span>
                <span className="text-xl font-black text-[var(--text-primary)]">{company.score || 0}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function RecommendedActions({ items }: { items: Array<{ title: string; value: number; detail: string; href: string; tone: Tone }> }) {
  return (
    <section className="rounded-lg border border-line bg-panel/90 p-5">
      <h2 className="text-lg font-black text-[var(--text-primary)]">Ações recomendadas</h2>
      <div className="mt-4 grid gap-3">
        {items.map((item) => {
          const style = toneStyle[item.tone];
          return (
            <Link key={item.title} href={item.href} className={`rounded-lg border ${style.border} ${style.bg} p-3 transition hover:-translate-y-0.5`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[var(--text-primary)]">{item.title}</p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">{item.detail}</p>
                </div>
                <span className={`text-2xl font-black ${style.text}`}>{item.value}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function RecentActivities({ items }: { items: Array<{ id: string; companyName: string; body: string; createdAt: string; status?: string }> }) {
  return (
    <section className="rounded-lg border border-line bg-panel/90 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-[var(--text-primary)]">Atividades recentes</h2>
        <span className="rounded-full bg-cyan/10 px-2 py-1 text-xs font-bold text-cyan">{items.length}</span>
      </div>
      <div className="mt-4 space-y-3">
        {items.length === 0 && <EmptyBlock text="Ainda não há atividades comerciais registradas." />}
        {items.map((activity) => (
          <article key={activity.id} className="rounded-lg border border-line bg-ink/70 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-[var(--text-primary)]">{activity.companyName}</p>
              <span className="text-xs text-[var(--text-secondary)]">{dateLabel(activity.createdAt)}</span>
            </div>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--text-secondary)]">{activity.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProposalSnapshot({ sent, open, accepted, pipelineValue, acceptedValue }: { sent: number; open: number; accepted: number; pipelineValue: number; acceptedValue: number }) {
  return (
    <section className="rounded-lg border border-line bg-panel/90 p-5">
      <h2 className="text-lg font-black text-[var(--text-primary)]">Propostas e conversões</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <MiniStat label="Enviadas" value={sent} tone="info" />
        <MiniStat label="Em aberto" value={open} tone="orange" />
        <MiniStat label="Aceitas" value={accepted} tone="success" />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <MiniStat label="Pipeline" value={money(pipelineValue)} tone="warning" />
        <MiniStat label="Convertido" value={money(acceptedValue)} tone="success" />
      </div>
    </section>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string | number; tone: Tone }) {
  const style = toneStyle[tone];
  return (
    <div className={`rounded-lg border ${style.border} ${style.bg} p-3`}>
      <p className="text-xs text-[var(--text-secondary)]">{label}</p>
      <p className="mt-1 text-lg font-black text-[var(--text-primary)]">{value}</p>
    </div>
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

function sourceLabel(company: Company) {
  if (company.source === "manual" || company.notes?.some((note) => note.body.toLowerCase().includes("manual"))) return "Manual";
  if (company.source === "apollo") return "Apollo";
  if (company.source === "econodata") return "Econodata";
  if (company.cnpj) return "CNPJ";
  if (company.mapsUrl || company.source === "google_places") return "Google Maps";
  return "CRM";
}

function cleanActivity(value: string) {
  const clean = String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/[{}[\]"]/g, " ")
    .replace(/\b(id|payload|metadata|workspace_id|lead_id|company_id)\s*:/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean) return "";
  return clean.length > 180 ? `${clean.slice(0, 177)}...` : clean;
}

function mainOpportunity(company: Company) {
  if (company.detectedOpportunities?.[0]) return company.detectedOpportunities[0];
  if (!company.website) return "Empresa sem site: oportunidade para presença digital.";
  if (!company.whatsapp) return "Sem WhatsApp visível: revisar canal de contato.";
  if (!company.hasGoogleAds) return "Sem Google Ads detectado: avaliar aquisição paga.";
  if (company.recommendedApproach) return company.recommendedApproach;
  return "Oportunidade comercial registrada no CRM.";
}

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Data não informada" : date.toLocaleString("pt-BR");
}

function money(value: number) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function EmptyText() {
  return <p className="text-sm text-[var(--text-secondary)]">Ainda não há dados suficientes para este indicador.</p>;
}

function EmptyBlock({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed border-line p-4 text-sm text-[var(--text-secondary)]">{text}</p>;
}
