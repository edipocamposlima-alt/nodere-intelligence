import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, Building2, Camera, Globe2, KanbanSquare, MessageCircle, MousePointerClick, Search, Star, TrendingUp } from "lucide-react";
import { CompanyTable } from "@/components/CompanyTable";
import { getCompanies, getDashboard } from "@/lib/api";

export default async function DashboardPage() {
  const [metrics, companies] = await Promise.all([getDashboard(), getCompanies()]);

  const cards = [
    { label: "Empresas encontradas", value: metrics.totalCompanies, icon: Building2, hex: "#0284C7", bg: "#E0F2FE" },
    { label: "Baixa avaliação", value: metrics.lowRating, icon: Star, hex: "#F59E0B", bg: "#FEF3C7" },
    { label: "Sem site", value: metrics.withoutWebsite, icon: Globe2, hex: "#7C3AED", bg: "#EDE9FE" },
    { label: "Sem Google Ads", value: metrics.withoutGoogleAds, icon: MousePointerClick, hex: "#16A34A", bg: "#DCFCE7" },
    { label: "Sem WhatsApp", value: metrics.withoutWhatsapp, icon: MessageCircle, hex: "#059669", bg: "#D1FAE5" },
    { label: "Sem descrição", value: metrics.withoutDescription, icon: AlertTriangle, hex: "#DC2626", bg: "#FEE2E2" },
    { label: "Sem fotos recentes", value: metrics.withoutRecentPhotos, icon: Camera, hex: "#DB2777", bg: "#FCE7F3" },
    { label: "Leads quentes", value: metrics.hotLeads, icon: TrendingUp, hex: "#EA580C", bg: "#FFEDD5" }
  ];
  const actionItems = [
    {
      title: "Atacar leads quentes",
      value: metrics.hotLeads,
      detail: "Priorize contato consultivo hoje",
      href: "/crm",
      color: "from-orange-500 to-rose-500"
    },
    {
      title: "Recuperar empresas sem site",
      value: metrics.withoutWebsite,
      detail: "Oferta direta: landing page + Google Ads",
      href: "/searches",
      color: "from-violet-500 to-blue-500"
    },
    {
      title: "Baixa avaliação no Google",
      value: metrics.lowRating,
      detail: "Abordagem: reputação + perfil otimizado",
      href: "/companies",
      color: "from-amber-400 to-orange-600"
    }
  ];

  return (
    <div className="space-y-8 p-4 md:p-8">
      <section className="rounded-lg border border-electric/25 bg-panel/90 p-5 shadow-glow">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <Image src="/nodere-wordmark.png" alt="NODERE Intelligence" width={360} height={120} priority className="h-auto w-full max-w-sm rounded-xl object-contain" />
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Central comercial para busca de empresas, CRM, funil, WhatsApp, propostas e inteligencia operacional.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm md:min-w-72">
            <div className="rounded-lg border border-line bg-ink p-3">
              <p className="text-slate-400">CRM ativo</p>
              <p className="mt-1 text-2xl font-semibold text-white">{metrics.totalCompanies}</p>
            </div>
            <div className="rounded-lg border border-line bg-ink p-3">
              <p className="text-slate-400">Score medio</p>
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
              <span className="flex h-10 w-10 items-center justify-center rounded-xl shadow-[0_0_22px_rgba(56,189,248,0.18)]" style={{ background: `linear-gradient(135deg, ${card.hex}, ${card.bg})` }}>
                <card.icon className="h-5 w-5 text-white drop-shadow" style={{ strokeWidth: 2.9 }} />
              </span>
            </div>
            <p className="mt-3 text-3xl font-semibold text-white">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {actionItems.map((item) => (
          <Link key={item.title} href={item.href} className={`rounded-xl border border-white/10 bg-gradient-to-br ${item.color} p-5 text-white shadow-[0_18px_45px_rgba(0,0,0,0.18)] transition hover:-translate-y-1`}>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/75">Ação recomendada</p>
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
