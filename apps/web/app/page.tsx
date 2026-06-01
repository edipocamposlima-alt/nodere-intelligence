import Image from "next/image";
import { AlertTriangle, Building2, Camera, Globe2, MessageCircle, MousePointerClick, Star, TrendingUp } from "lucide-react";
import { CompanyTable } from "@/components/CompanyTable";
import { SearchPanel } from "@/components/SearchPanel";
import { getCompanies, getDashboard } from "@/lib/api";

export default async function DashboardPage() {
  const [metrics, companies] = await Promise.all([getDashboard(), getCompanies()]);

  const cards = [
    { label: "Empresas encontradas", value: metrics.totalCompanies, icon: Building2 },
    { label: "Baixa avaliação", value: metrics.lowRating, icon: Star },
    { label: "Sem site", value: metrics.withoutWebsite, icon: Globe2 },
    { label: "Sem Google Ads", value: metrics.withoutGoogleAds, icon: MousePointerClick },
    { label: "Sem WhatsApp", value: metrics.withoutWhatsapp, icon: MessageCircle },
    { label: "Sem descrição", value: metrics.withoutDescription, icon: AlertTriangle },
    { label: "Sem fotos recentes", value: metrics.withoutRecentPhotos, icon: Camera },
    { label: "Leads quentes", value: metrics.hotLeads, icon: TrendingUp }
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
          <div key={card.label} className="rounded-lg border border-line bg-panel/90 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">{card.label}</p>
              <card.icon className="h-4 w-4 text-cyan" />
            </div>
            <p className="mt-3 text-3xl font-semibold text-white">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <SearchPanel />
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
