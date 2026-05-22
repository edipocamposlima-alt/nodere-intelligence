import { ExternalLink, Globe2, MessageCircle, Phone, Star } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { getCompany } from "@/lib/api";

const whatsappMessage =
  "Ola, tudo bem? Estive analisando a presenca digital da sua empresa no Google e identifiquei algumas oportunidades que podem ajudar voces a gerar mais contatos e melhorar o posicionamento online. Posso te mostrar rapidamente?";

export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const company = await getCompany(id);

  const checks = [
    ["Site", Boolean(company.website)],
    ["SSL", Boolean(company.hasSsl)],
    ["Responsivo", Boolean(company.isResponsive)],
    ["Google Ads", Boolean(company.hasGoogleAds)],
    ["Meta Pixel", Boolean(company.metaPixel)],
    ["GTM", Boolean(company.googleTagManager)],
    ["Analytics", Boolean(company.googleAnalytics)],
    ["SEO básico", Boolean(company.seoBasics)]
  ];

  return (
    <div className="space-y-6 p-4 md:p-8">
      <section className="rounded-lg border border-line bg-panel/90 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-semibold text-white">{company.name}</h2>
              <StatusBadge value={company.opportunityLevel} />
            </div>
            <p className="mt-2 text-sm text-slate-400">
              {company.category} · {company.address}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {company.whatsapp && (
                <a href={`https://wa.me/${company.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappMessage)}`} target="_blank" className="inline-flex items-center gap-2 rounded-lg bg-success px-4 py-2 text-sm font-semibold text-ink">
                  <MessageCircle className="h-4 w-4" />
                  Chamar no WhatsApp
                </a>
              )}
              {company.website && (
                <a href={company.website} target="_blank" className="inline-flex items-center gap-2 rounded-lg border border-line bg-white/5 px-4 py-2 text-sm text-white">
                  <Globe2 className="h-4 w-4" />
                  Site
                </a>
              )}
              {company.mapsUrl && (
                <a href={company.mapsUrl} target="_blank" className="inline-flex items-center gap-2 rounded-lg border border-line bg-white/5 px-4 py-2 text-sm text-white">
                  <ExternalLink className="h-4 w-4" />
                  Google Maps
                </a>
              )}
            </div>
          </div>
          <div className="rounded-lg border border-electric/30 bg-electric/10 p-5 text-center">
            <p className="text-sm text-slate-400">Score comercial</p>
            <p className="mt-2 text-6xl font-semibold text-white">{company.score}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
          <div className="rounded-lg border border-line bg-panel/90 p-5">
            <h3 className="font-semibold text-white">Informações gerais</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <p className="flex items-center gap-2">
                <Star className="h-4 w-4 text-warning" />
                {company.rating ?? "-"} · {company.reviewCount ?? 0} avaliações
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-cyan" />
                {company.phone ?? "Telefone não detectado"}
              </p>
              <p>Status CRM: {company.status}</p>
              <p>PageSpeed mobile: {company.pageSpeed || "não analisado"}</p>
            </div>
          </div>

          <div className="rounded-lg border border-line bg-panel/90 p-5">
            <h3 className="font-semibold text-white">Performance digital</h3>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {checks.map(([label, ok]) => (
                <div key={label} className="rounded-md border border-line bg-ink px-3 py-2 text-sm">
                  <span className={ok ? "text-emerald-300" : "text-red-300"}>{ok ? "Ativo" : "Ausente"}</span>
                  <p className="mt-1 text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-lg border border-line bg-panel/90 p-5">
            <h3 className="font-semibold text-white">Oportunidades detectadas</h3>
            <div className="mt-4 space-y-3">
              {company.detectedOpportunities.map((item) => (
                <p key={item} className="rounded-md border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-red-100">
                  {item}
                </p>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-line bg-panel/90 p-5">
            <h3 className="font-semibold text-white">Sugestões comerciais</h3>
            <div className="mt-4 space-y-3">
              {company.suggestions.map((item) => (
                <p key={item} className="rounded-md border border-electric/20 bg-electric/10 px-3 py-2 text-sm text-blue-100">
                  {item}
                </p>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-line bg-panel/90 p-5">
            <h3 className="font-semibold text-white">Histórico CRM</h3>
            <div className="mt-4 space-y-3">
              {company.notes.length === 0 && <p className="text-sm text-slate-500">Nenhuma observação registrada.</p>}
              {company.notes.map((note) => (
                <p key={note.id} className="rounded-md border border-line bg-ink px-3 py-2 text-sm text-slate-300">
                  {note.body}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
