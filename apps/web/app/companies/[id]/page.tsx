import { ExternalLink, Facebook, Globe2, Instagram, Linkedin, MessageCircle, Phone, ShieldCheck, Star, Users, Youtube, Zap } from "lucide-react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { getCompany, getCompanyAudit, getCompanyIntelligence } from "@/lib/api";
import { EnrichTrigger } from "./EnrichTrigger";
import { AuditPanel } from "./AuditPanel";
import { IntelligencePanel } from "./IntelligencePanel";
import { DiagnosisPanel } from "./DiagnosisPanel";
import { LeadOperations } from "./LeadOperations";
import { CompanyPdfActions } from "./CompanyPdfActions";

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

function notInformed(value?: string | number | null) {
  if (value === 0) return "0";
  return value ? String(value) : "Não informado";
}

function commercialEmail(company: any) {
  return notInformed(company.emailPrincipal || company.email_principal || company.email);
}

function commercialSummary(company: any) {
  const existing = company.businessSummary || company.resumoSobreEmpresa || company.resumo_sobre_empresa || company.resumo;
  if (existing) return String(existing);
  const signals = [
    company.website ? "site localizado" : "site não localizado",
    company.phone ? "telefone localizado" : "telefone não localizado",
    company.mapsUrl ? "Google Maps localizado" : "Google Maps não localizado",
    company.rating ? `avaliação ${company.rating}${company.reviewCount ? ` com ${company.reviewCount} avaliações` : ""}` : "avaliação não localizada"
  ];
  return `${company.name || "Empresa"} em ${notInformed(company.city)}/${notInformed(company.state)} no segmento ${notInformed(company.category)}. Sinais comerciais: ${signals.join(", ")}.`;
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-line bg-ink/70 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function CompanyLoadError({ id, message }: { id: string; message: string }) {
  return (
    <div className="space-y-6 p-4 md:p-8">
      <section className="rounded-lg border border-danger/30 bg-danger/10 p-6">
        <h2 className="text-xl font-semibold text-white">Não foi possível abrir a Ficha 360º</h2>
        <p className="mt-2 text-sm leading-6 text-red-100">
          A ficha não carregou todos os dados neste momento. O sistema registrou o erro técnico e manteve a página estável.
        </p>
        <div className="mt-4 rounded-md border border-danger/20 bg-ink px-3 py-2 text-xs text-red-100">
          <p>ID: {decodeURIComponent(id || "")}</p>
          <p>Detalhe: {message || "Erro inesperado ao carregar a ficha."}</p>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <a href="/companies" className="rounded-lg border border-line bg-white/5 px-4 py-2 text-sm text-white">Voltar para empresas</a>
          <a href="/crm" className="rounded-lg bg-electric px-4 py-2 text-sm font-semibold text-white">Abrir CRM</a>
        </div>
      </section>
    </div>
  );
}

export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("nodere_session")?.value || cookieStore.get("nodere-session")?.value || null;
  let company;
  let audit = null;
  let intel = null;
  try {
    [company, audit, intel] = await Promise.all([
      getCompany(id, sessionToken),
      getCompanyAudit(id, sessionToken).catch((error) => {
        console.warn("[company-page] audit unavailable", { id, message: error instanceof Error ? error.message : String(error) });
        return null;
      }),
      getCompanyIntelligence(id, sessionToken).catch((error) => {
        console.warn("[company-page] intelligence unavailable", { id, message: error instanceof Error ? error.message : String(error) });
        return null;
      })
    ]);
  } catch (error) {
    console.error("[company-page] failed to load company", { id, message: error instanceof Error ? error.message : String(error) });
    return <CompanyLoadError id={id} message={error instanceof Error ? error.message : String(error)} />;
  }

  if (!company) return <CompanyLoadError id={id} message="Empresa não localizada no CRM." />;
  const requestedId = decodeURIComponent(id || "");
  if (company.id && requestedId && company.id !== requestedId) {
    redirect(`/companies/${encodeURIComponent(company.id)}`);
  }

  const detectedOpportunities = Array.isArray(company.detectedOpportunities) ? company.detectedOpportunities : [];
  const suggestions = Array.isArray(company.suggestions) ? company.suggestions : [];
  const notes = Array.isArray(company.notes) ? company.notes : [];
  const companyName = company.name || "Empresa sem nome";
  const companyId = encodeURIComponent(company.id);
  const companyRecord = company as typeof company & {
    crmId?: string;
    crm_id?: string;
    leadId?: string;
    lead_id?: string;
    company_id?: string;
    duplicateCount?: number;
    duplicateIds?: string[];
  };
  const crmRecordId = String(companyRecord.crmId || companyRecord.crm_id || companyRecord.leadId || companyRecord.lead_id || companyRecord.company_id || company.id || "");
  const crmRecordHref = crmRecordId ? `/app/crm/clientes/${encodeURIComponent(crmRecordId)}?tab=overview&return=/companies/${companyId}` : "";
  const duplicateCount = Number(companyRecord.duplicateCount || (Array.isArray(companyRecord.duplicateIds) ? companyRecord.duplicateIds.length : 0));

  const checks: [string, boolean | null][] = [
    ["Site", Boolean(company.website)],
    ["SSL", Boolean(company.hasSsl)],
    ["Responsivo", Boolean(company.isResponsive)],
    ["Google Ads", company.hasGoogleAds ?? null],
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
              <h2 className="text-2xl font-semibold text-white">{companyName}</h2>
              <StatusBadge value={company.opportunityLevel} />
            </div>
            <p className="mt-2 text-sm text-slate-400">
              {notInformed(company.category)} · {notInformed(company.address)}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {isValidBrazilMobileWhatsapp(company.whatsapp) && (
                <a href={`https://wa.me/${company.whatsapp!.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappMessage)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-success px-4 py-2 text-sm font-semibold text-ink">
                  <MessageCircle className="h-4 w-4" />
                  Chamar no WhatsApp
                </a>
              )}
              <CompanyPdfActions companyId={company.id} companyName={companyName} />
              {crmRecordHref ? (
                <a href={crmRecordHref} className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-100">
                  <Users className="h-4 w-4" />
                  Abrir CRM
                </a>
              ) : (
                <a href={`/crm?create=${companyId}`} className="inline-flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/15 px-4 py-2 text-sm font-semibold text-warning">
                  <Users className="h-4 w-4" />
                  Criar cadastro CRM
                </a>
              )}
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
                <a href={linkedinSearchUrl(companyName)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-blue-400/40 bg-blue-500/15 px-4 py-2 text-sm text-blue-100">
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
            {duplicateCount > 1 && (
              <p className="mt-3 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
                Existe mais de um registro CRM relacionado. O atalho abre o registro principal vinculado a esta ficha.
              </p>
            )}
          </div>

          {/* Score cards */}
          <div className="flex flex-wrap gap-3 lg:flex-col">
            <div className="rounded-lg border border-electric/30 bg-electric/10 px-5 py-4 text-center">
              <p className="text-xs text-slate-400">Oportunidade</p>
              <p className="mt-1 text-5xl font-semibold text-white">{company.score ?? 0}</p>
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

      <section className="rounded-lg border border-line bg-panel/90 p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan">Dados comerciais da empresa</p>
            <h3 className="mt-1 text-lg font-semibold text-white">Informações localizadas na busca e no CRM</h3>
          </div>
          <span className="nodere-status-badge" data-tone="progress">
            <span className="nodere-status-dot" aria-hidden="true" />
            Dados persistidos na ficha
          </span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <InfoCard label="Segmento" value={notInformed(company.category)} />
          <InfoCard label="Cidade" value={notInformed(company.city)} />
          <InfoCard label="Estado" value={notInformed(company.state)} />
          <InfoCard label="CNPJ" value={notInformed(company.cnpj)} />
          <InfoCard label="Telefone" value={notInformed(company.phone)} />
          <InfoCard label="E-mail" value={commercialEmail(company)} />
          <InfoCard label="Site" value={notInformed(company.website)} />
          <InfoCard label="Maps" value={notInformed(company.mapsUrl)} />
          <InfoCard label="Avaliação" value={notInformed(company.rating)} />
          <InfoCard label="Avaliações" value={notInformed(company.reviewCount)} />
          <InfoCard label="Score" value={notInformed(company.nodereScore ?? company.score)} />
          <InfoCard label="Origem" value={(company.mapsUrl || company.source === "google_places") ? "Google Places/Maps" : notInformed(company.source)} />
        </div>
        <div className="mt-4 rounded-lg border border-line bg-ink/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Resumo sobre a empresa</p>
          <p className="mt-2 text-sm leading-6 text-slate-200">{commercialSummary(company)}</p>
        </div>
      </section>

      <LeadOperations company={company} />

      <div className="grid min-w-0 max-w-full gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        {/* Left column */}
        <div className="min-w-0 max-w-full space-y-5">
          <div className="min-w-0 max-w-full rounded-lg border border-line bg-panel/90 p-5">
            <h3 className="font-semibold text-white">Informações gerais</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <p className="flex min-w-0 items-center gap-2 break-words">
                <Star className="h-4 w-4 shrink-0 text-warning" />
                <span className="min-w-0">{company.rating ?? "-"} · {company.reviewCount ?? 0} avaliações</span>
              </p>
              <p className="flex min-w-0 items-center gap-2 break-words">
                <Phone className="h-4 w-4 shrink-0 text-cyan" />
                <span className="min-w-0">{company.phone ?? "Telefone não detectado"}</span>
              </p>
              <p>Status CRM: {company.status}</p>
              <p>PageSpeed mobile: {company.pageSpeed ? `${company.pageSpeed}/100` : "não analisado"}</p>
            </div>
          </div>

          <div className="min-w-0 max-w-full rounded-lg border border-line bg-panel/90 p-5">
            <h3 className="font-semibold text-white">Enriquecimento público</h3>
            <div className="mt-4 grid gap-2 text-sm">
              {[
                ["CNPJ", "não localizado em fonte pública"],
                ["Razão social", "não localizado em fonte pública"],
                ["Decisor/responsável", "não localizado em fonte pública"],
                ["E-mail público", "não localizado em fonte pública"],
                ["LinkedIn", company.linkedin || linkedinSearchUrl(companyName)]
              ].map(([label, value]) => (
                <div key={label} className="min-w-0 rounded-md border border-line bg-ink px-3 py-2">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="mt-1 break-words text-slate-300">{value}</p>
                  <p className="mt-1 text-[11px] text-slate-600">Fonte: Google Places/site público quando disponível · Confiança: {value === "não localizado em fonte pública" ? "baixa" : "média"}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="min-w-0 max-w-full rounded-lg border border-line bg-panel/90 p-5">
            <h3 className="font-semibold text-white">Sinais digitais</h3>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {checks.map(([label, ok]) => (
                <div key={label} className="min-w-0 rounded-md border border-line bg-ink px-3 py-2 text-sm">
                  <span className={ok === true ? "text-emerald-300" : ok === false ? "text-red-300" : "text-slate-400"}>
                    {ok === true ? "Ativo" : ok === false ? "Ausente" : "Não verificado"}
                  </span>
                  <p className="mt-1 text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="min-w-0 max-w-full rounded-lg border border-line bg-panel/90 p-5">
            <h3 className="font-semibold text-white">Oportunidades detectadas</h3>
            <div className="mt-4 space-y-2">
              {detectedOpportunities.length === 0
                ? <p className="text-sm text-slate-500">Nenhuma oportunidade detectada.</p>
                : detectedOpportunities.map((item) => (
                  <p key={item} className="rounded-md border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-red-100">
                    {item}
                  </p>
                ))}
            </div>
          </div>

          <div className="rounded-lg border border-line bg-panel/90 p-5">
            <h3 className="font-semibold text-white">Sugestões comerciais</h3>
            <div className="mt-4 space-y-2">
              {suggestions.length === 0
                ? <p className="text-sm text-slate-500">Sem sugestões no momento.</p>
                : suggestions.map((item) => (
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
              {notes.length === 0 && <p className="text-sm text-slate-500">Nenhuma observação registrada.</p>}
              {notes.map((note) => (
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
              <h3 className="font-semibold text-white">Inteligência Google</h3>
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


