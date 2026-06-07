import { ExternalLink, Facebook, FileText, Globe2, Instagram, Linkedin, MessageCircle, Phone, ShieldCheck, Star, Youtube, Zap } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { getCompany, getCompanyAudit, getCompanyIntelligence } from "@/lib/api";
import { EnrichTrigger } from "./EnrichTrigger";
import { AuditPanel } from "./AuditPanel";
import { IntelligencePanel } from "./IntelligencePanel";
import { DiagnosisPanel } from "./DiagnosisPanel";
import { LeadOperations } from "./LeadOperations";
import { getApiBaseUrl } from "@/lib/apiBase";

const API_URL = getApiBaseUrl();

export const dynamic = "force-dynamic";

const whatsappMessage =
  "Ola, tudo bem? Estive analisando a presenca digital da sua empresa no Google e identifiquei algumas oportunidades que podem ajudar voces a gerar mais contatos e melhorar o posicionamento online. Posso te mostrar rapidamente?";

function externalUrl(value?: string) {
  const clean = String(value || "").trim();
  if (!clean) return "";
  return /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;
}


function isValidBrazilMobileWhatsapp(value?: string) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return false;
  const local = digits.startsWith("55") ? digits.slice(2) : digits;
  return local.length === 11 && local[2] === "9";
}

function linkedinSearchUrl(name: string) {
  const query = String(name || "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\b(?:www\.)?[\w-]+\.(?:com|com\.br|net|org|br|io|app)\b/gi, "")
    .replace(/\.(com|com\.br|net|org|io|br)(\s|$)/gi, " ")
    .trim();
  return `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(query)}`;
}

export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [company, audit, intel] = await Promise.all([
    getCompany(id),
    getCompanyAudit(id).catch(() => null),
    getCompanyIntelligence(id).catch(() => null)
  ]);

  const checks: [string, boolean][] = [
    ["Site", Boolean(company.website)],
    ["SSL", Boolean(company.hasSsl)],
    ["Responsivo", Boolean(company.isResponsive)],
    ["Google Ads", Boolean(company.hasGoogleAds)],
    ["Meta Pixel", Boolean(company.metaPixel)],
    ["GTM", Boolean(company.googleTagManager || company.gtmContainerId)],
    ["GA4", Boolean(company.hasGA4)],
    ["SEO básico", Boolean(company.seoBasics || (company.hasH1 && company.hasCanonical))]
  ];

  return (
    <div className="space-y-6 p-4 md:p-8">
      {/* Header */}
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
              {isValidBrazilMobileWhatsapp(company.whatsapp) && (
                <a href={`https://wa.me/${company.whatsapp!.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappMessage)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-success px-4 py-2 text-sm font-semibold text-ink">
                  <MessageCircle className="h-4 w-4" />
                  Chamar no WhatsApp
                </a>
              )}
              <a href={`${API_URL}/companies/${company.id}/export-pdf`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-line bg-white/5 px-4 py-2 text-sm text-white">
                <FileText className="h-4 w-4" />
                Exportar PDF
              </a>
              {company.website && (
                <a href={externalUrl(company.website)} target="_blank" rel="noopener noreferrer" className="btn-action">
                  <Globe2 className="h-4 w-4" />
                  Site
                </a>
              )}
              {company.mapsUrl && (
                <a href={company.mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-line bg-white/5 px-4 py-2 text-sm text-white">
                  <ExternalLink className="h-4 w-4" />
                  Google Maps
                </a>
              )}
              {company.instagram && (
                <a href={company.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-line bg-white/5 px-4 py-2 text-sm text-white">
                  <Instagram className="h-4 w-4" />
                  Instagram
                </a>
              )}
              {company.facebook && (
                <a href={company.facebook} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-line bg-white/5 px-4 py-2 text-sm text-white">
                  <Facebook className="h-4 w-4" />
                  Facebook
                </a>
              )}
              {company.linkedin && (
                <a href={externalUrl(company.linkedin)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-line bg-white/5 px-4 py-2 text-sm text-white">
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                </a>
              )}
              {!company.linkedin && (
                <a href={linkedinSearchUrl(company.name)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-blue-400/40 bg-blue-500/15 px-4 py-2 text-sm text-blue-100">
                  <Linkedin className="h-4 w-4" />
                  Buscar empresa no LinkedIn
                </a>
              )}
              {company.youtube && (
                <a href={company.youtube} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-line bg-white/5 px-4 py-2 text-sm text-white">
                  <Youtube className="h-4 w-4" />
                  YouTube
                </a>
              )}
            </div>
          </div>

          {/* Score cards */}
          <div className="flex flex-wrap gap-3 lg:flex-col">
            <div className="rounded-lg border border-electric/30 bg-electric/10 px-5 py-4 text-center">
              <p className="text-xs text-slate-400">Oportunidade</p>
              <p className="mt-1 text-5xl font-semibold text-white">{company.score}</p>
            </div>
            {company.maturityScore !== undefined && (
              <div className="rounded-lg border border-line bg-panel/60 px-4 py-3 text-center">
                <p className="text-xs text-slate-400">Maturidade</p>
                <p className="mt-1 text-3xl font-semibold text-white">{company.maturityScore}</p>
              </div>
            )}
            {company.paidTrafficScore !== undefined && (
              <div className="rounded-lg border border-line bg-panel/60 px-4 py-3 text-center">
                <p className="text-xs text-slate-400">Tráfego pago</p>
                <p className="mt-1 text-3xl font-semibold text-white">{company.paidTrafficScore}</p>
              </div>
            )}
            <EnrichTrigger companyId={company.id} enrichmentStatus={company.enrichmentStatus} hasWebsite={Boolean(company.website)} />
          </div>
        </div>
      </section>

      <LeadOperations company={company} />

      <div className="grid gap-5 xl:grid-cols-[1fr_1.2fr]">
        {/* Left column */}
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
              <p>PageSpeed mobile: {company.pageSpeed ? `${company.pageSpeed}/100` : "não analisado"}</p>
            </div>
          </div>

          <div className="rounded-lg border border-line bg-panel/90 p-5">
            <h3 className="font-semibold text-white">Enriquecimento público</h3>
            <div className="mt-4 grid gap-2 text-sm">
              {[
                ["CNPJ", "não localizado em fonte pública"],
                ["Razão social", "não localizado em fonte pública"],
                ["Decisor/responsável", "não localizado em fonte pública"],
                ["E-mail público", "não localizado em fonte pública"],
                ["LinkedIn", company.linkedin || linkedinSearchUrl(company.name)]
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-line bg-ink px-3 py-2">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="mt-1 break-words text-slate-300">{value}</p>
                  <p className="mt-1 text-[11px] text-slate-600">Fonte: Google Places/site público quando disponível · Confiança: {value === "não localizado em fonte pública" ? "baixa" : "média"}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-line bg-panel/90 p-5">
            <h3 className="font-semibold text-white">Sinais digitais</h3>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {checks.map(([label, ok]) => (
                <div key={label} className="rounded-md border border-line bg-ink px-3 py-2 text-sm">
                  <span className={ok ? "text-emerald-300" : "text-red-300"}>{ok ? "Ativo" : "Ausente"}</span>
                  <p className="mt-1 text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-line bg-panel/90 p-5">
            <h3 className="font-semibold text-white">Oportunidades detectadas</h3>
            <div className="mt-4 space-y-2">
              {company.detectedOpportunities.length === 0
                ? <p className="text-sm text-slate-500">Nenhuma oportunidade detectada.</p>
                : company.detectedOpportunities.map((item) => (
                  <p key={item} className="rounded-md border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-red-100">
                    {item}
                  </p>
                ))}
            </div>
          </div>

          <div className="rounded-lg border border-line bg-panel/90 p-5">
            <h3 className="font-semibold text-white">Sugestões comerciais</h3>
            <div className="mt-4 space-y-2">
              {company.suggestions.length === 0
                ? <p className="text-sm text-slate-500">Sem sugestões no momento.</p>
                : company.suggestions.map((item) => (
                  <p key={item} className="rounded-md border border-electric/20 bg-electric/10 px-3 py-2 text-sm text-blue-100">
                    {item}
                  </p>
                ))}
            </div>
          </div>

          <DiagnosisPanel companyId={company.id} />

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

        {/* Right column — Digital Audit + Intelligence */}
        <div className="space-y-8">
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-cyan" />
              <h3 className="font-semibold text-white">Auditoria digital</h3>
            </div>
            {audit
              ? <AuditPanel audit={audit} />
              : (
                <div className="rounded-lg border border-line bg-panel/90 p-8 text-center">
                  <p className="text-sm text-slate-400">API não disponível. Execute a API local para ver auditoria completa.</p>
                </div>
              )}
          </div>

          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-cyan" />
              <h3 className="font-semibold text-white">Google Intelligence</h3>
            </div>
            {intel
              ? <IntelligencePanel intel={intel} />
              : (
                <div className="rounded-lg border border-line bg-panel/90 p-8 text-center">
                  <p className="text-sm text-slate-400">API não disponível. Execute a API local para ver inteligência Google.</p>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}


