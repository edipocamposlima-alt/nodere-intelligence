"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Bot, BriefcaseBusiness, CalendarDays, CheckCircle2, Copy, Download, FileText, FolderOpen, Globe2, Linkedin, Mail, MapPin, MessageCircle, PackageCheck, Pencil, Phone, Plus, Send, Sparkles, Trash2, Users, XCircle } from "lucide-react";
import type { Company } from "@/lib/types";
import { CalendarEvent, CatalogItem, InboxMessage, NodereProposal, ProposalItemPayload, addLeadDeal, createProposal, deleteProposal, downloadContractPdf, downloadProposalPdf, getCalendarEvents, getCatalogItems, getInboxMessagesByCompany, getLeadActivities, getLeadContacts, getLeadDeals, getProposals, updateLeadDeal } from "@/lib/api";
import { ScoreBadge } from "@/components/ui/ScoreBadge";

type TabId = "overview" | "history" | "contacts" | "deals" | "products" | "proposals" | "whatsapp" | "email" | "agenda" | "ai" | "apollo" | "files";

const tabs: Array<{ id: TabId; label: string; icon: typeof Sparkles }> = [
  { id: "overview", label: "Visão Geral", icon: Sparkles },
  { id: "history", label: "Histórico", icon: CalendarDays },
  { id: "contacts", label: "Contatos", icon: Users },
  { id: "deals", label: "Negociações", icon: BriefcaseBusiness },
  { id: "products", label: "Produtos/Serviços", icon: PackageCheck },
  { id: "proposals", label: "Propostas e Contratos", icon: FileText },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { id: "email", label: "E-mail", icon: Mail },
  { id: "agenda", label: "Agenda", icon: CalendarDays },
  { id: "ai", label: "IA / Editor", icon: Bot },
  { id: "apollo", label: "Apollo/Econodata", icon: Globe2 },
  { id: "files", label: "Arquivos/Anexos", icon: FolderOpen }
];

type Loaded = {
  overview?: boolean;
  activities?: Array<Record<string, unknown>>;
  contacts?: Array<Record<string, unknown>>;
  deals?: Array<Record<string, unknown>>;
  proposals?: NodereProposal[];
  inbox?: InboxMessage[];
  whatsapp?: InboxMessage[];
  agenda?: CalendarEvent[];
};

type ProductNegotiationDraft = {
  catalogItemId: string;
  productServiceName: string;
  description: string;
  category: string;
  negotiationStatus: string;
  saleType: string;
  negotiatedValue: string;
  discountValue: string;
  finalValue: string;
  paymentTerms: string;
  paymentMethod: string;
  executionDeadline: string;
  expectedStartDate: string;
  expectedEndDate: string;
  responsible: string;
  notes: string;
  lostReason: string;
  nextAction: string;
  nextActionDate: string;
  proposalId: string;
  proposalSentAt: string;
  proposalSentChannel: string;
  previousContractId: string;
  deletedAt?: string;
};

const productCategories = ["produto", "serviço", "pacote", "mensalidade", "implantação", "suporte", "consultoria"];
const negotiationStatuses = ["Em negociação", "Proposta enviada", "Fechou", "Não fechou", "Aguardando retorno", "Cancelado"];
const saleTypes = ["Nova venda", "Upgrade", "Renovação", "Cross-sell", "Upsell"];
const proposalChannels = ["WhatsApp", "E-mail", "Presencial", "Outro"];

function money(value: unknown) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function dateLabel(value: unknown) {
  if (!value) return "Não informado";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("pt-BR");
}

function datetimeLocalLabel(value: unknown) {
  if (!value) return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function decimalFromInput(value: string) {
  const normalized = String(value || "0").replace(/\./g, "").replace(",", ".");
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : 0;
}

function emptyProductNegotiation(): ProductNegotiationDraft {
  return {
    catalogItemId: "",
    productServiceName: "",
    description: "",
    category: "serviço",
    negotiationStatus: "Em negociação",
    saleType: "Nova venda",
    negotiatedValue: "",
    discountValue: "",
    finalValue: "",
    paymentTerms: "",
    paymentMethod: "",
    executionDeadline: "",
    expectedStartDate: "",
    expectedEndDate: "",
    responsible: "",
    notes: "",
    lostReason: "",
    nextAction: "",
    nextActionDate: "",
    proposalId: "",
    proposalSentAt: "",
    proposalSentChannel: "WhatsApp",
    previousContractId: ""
  };
}

function parseProductNegotiation(item: Record<string, unknown>): ProductNegotiationDraft {
  const catalog = asRecord(item.catalog_items);
  let details: Record<string, unknown> = {};
  try {
    details = asRecord(JSON.parse(String(item.description || "{}")));
  } catch {
    details = {};
  }
  const value = String(details.negotiatedValue ?? item.total_price ?? item.contracted_price ?? "");
  return {
    ...emptyProductNegotiation(),
    catalogItemId: String(details.catalogItemId || details.catalog_item_id || item.catalog_item_id || item.product_service_id || catalog.id || ""),
    productServiceName: String(details.productServiceName || item.item_name || catalog.name || ""),
    description: String(details.description || item.description || catalog.description_short || ""),
    category: String(details.category || catalog.type || "serviço"),
    negotiationStatus: String(details.negotiationStatus || statusFromApi(item.status)),
    saleType: String(details.saleType || details.origin || "Nova venda"),
    negotiatedValue: value,
    discountValue: String(details.discountValue || ""),
    finalValue: String(details.finalValue || value),
    paymentTerms: String(details.paymentTerms || ""),
    paymentMethod: String(details.paymentMethod || ""),
    executionDeadline: String(details.executionDeadline || ""),
    expectedStartDate: String(details.expectedStartDate || item.started_at || "").slice(0, 10),
    expectedEndDate: String(details.expectedEndDate || item.ended_at || "").slice(0, 10),
    responsible: String(details.responsible || ""),
    notes: String(details.notes || item.notes || ""),
    lostReason: String(details.lostReason || ""),
    nextAction: String(details.nextAction || ""),
    nextActionDate: datetimeLocalLabel(details.nextActionDate),
    proposalId: String(details.proposalId || ""),
    proposalSentAt: datetimeLocalLabel(details.proposalSentAt),
    proposalSentChannel: String(details.proposalSentChannel || "WhatsApp"),
    previousContractId: String(details.previousContractId || ""),
    deletedAt: details.deletedAt ? String(details.deletedAt) : undefined
  };
}

function statusToApi(status: string) {
  const map: Record<string, string> = {
    "Em negociação": "negotiating",
    "Proposta enviada": "proposal",
    "Fechou": "won",
    "Não fechou": "lost",
    "Aguardando retorno": "paused",
    "Cancelado": "cancelled"
  };
  return map[status] || "negotiating";
}

function statusFromApi(status: unknown) {
  const map: Record<string, string> = {
    negotiating: "Em negociação",
    proposal: "Proposta enviada",
    won: "Fechou",
    lost: "Não fechou",
    paused: "Aguardando retorno",
    cancelled: "Cancelado"
  };
  return map[String(status || "")] || String(status || "Em negociação");
}

function payloadFromProductNegotiation(draft: ProductNegotiationDraft) {
  const negotiatedValue = decimalFromInput(draft.negotiatedValue);
  const discountValue = decimalFromInput(draft.discountValue);
  const finalValue = draft.finalValue ? decimalFromInput(draft.finalValue) : Math.max(negotiatedValue - discountValue, 0);
  const details = { ...draft, catalogItemId: draft.catalogItemId || "", negotiatedValue, discountValue, finalValue };
  return {
    catalogItemId: draft.catalogItemId || undefined,
    itemName: draft.productServiceName,
    itemType: draft.category === "produto" ? "product" : "service",
    totalPrice: finalValue,
    unitPrice: finalValue,
    status: statusToApi(draft.negotiationStatus),
    startedAt: draft.expectedStartDate || undefined,
    endedAt: draft.expectedEndDate || undefined,
    description: JSON.stringify(details),
    notes: draft.notes
  };
}

function externalUrl(value?: string) {
  const clean = String(value || "").trim();
  if (!clean) return "";
  return /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;
}

function whatsappUrl(company: Company) {
  const raw = company.whatsapp || company.phone || "";
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const phone = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${phone}`;
}

function linkedinSearchUrl(company: Company) {
  return company.linkedin || `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(company.name)}`;
}

export function CrmClientFullPage({ company }: { company: Company }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab") as TabId | null;
  const activeTab = tabs.some((item) => item.id === requestedTab) ? requestedTab! : "overview";
  const returnHref = searchParams.get("return") || "/crm";
  const [role, setRole] = useState("viewer");
  const [loaded, setLoaded] = useState<Loaded>({});
  const [loadingTab, setLoadingTab] = useState("");
  const [message, setMessage] = useState("");
  const canEdit = ["owner", "admin", "operator"].includes(role);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => setRole(String(payload?.user?.role || "viewer")))
      .catch(() => setRole("viewer"));
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoadingTab(activeTab);
        if (activeTab === "overview" && !loaded.overview) {
          const [activities, contacts, deals, proposalsRaw, inboxPayload, agendaRaw] = await Promise.all([
            getLeadActivities(company.id),
            getLeadContacts(company.id),
            getLeadDeals(company.id),
            getProposals(),
            getInboxMessagesByCompany(company.id),
            getCalendarEvents()
          ]);
          if (!cancelled) {
            const proposals = proposalsRaw.filter((item) => item.lead_id === company.id);
            const agenda = agendaRaw.filter((item) => item.company_id === company.id);
            const inbox = inboxPayload.messages;
            setLoaded((current) => ({
              ...current,
              overview: true,
              activities,
              contacts,
              deals,
              proposals,
              inbox,
              whatsapp: inbox.filter((item) => item.type === "whatsapp"),
              agenda
            }));
          }
        }
        if (activeTab === "history" && !loaded.activities) {
          const activities = await getLeadActivities(company.id);
          if (!cancelled) setLoaded((current) => ({ ...current, activities }));
        }
        if (activeTab === "contacts" && !loaded.contacts) {
          const contacts = await getLeadContacts(company.id);
          if (!cancelled) setLoaded((current) => ({ ...current, contacts }));
        }
        if (activeTab === "deals" && !loaded.deals) {
          const deals = await getLeadDeals(company.id);
          if (!cancelled) setLoaded((current) => ({ ...current, deals }));
        }
        if (activeTab === "products" && (!loaded.deals || !loaded.proposals)) {
          const [deals, proposalsRaw] = await Promise.all([
            loaded.deals ? Promise.resolve(loaded.deals) : getLeadDeals(company.id),
            loaded.proposals ? Promise.resolve(loaded.proposals) : getProposals()
          ]);
          if (!cancelled) setLoaded((current) => ({ ...current, deals, proposals: proposalsRaw.filter((item) => item.lead_id === company.id) }));
        }
        if (activeTab === "proposals" && !loaded.proposals) {
          const proposals = (await getProposals()).filter((item) => item.lead_id === company.id);
          if (!cancelled) setLoaded((current) => ({ ...current, proposals }));
        }
        if (activeTab === "whatsapp" && !loaded.whatsapp) {
          const payload = await getInboxMessagesByCompany(company.id);
          if (!cancelled) setLoaded((current) => ({ ...current, inbox: payload.messages, whatsapp: payload.messages.filter((item) => item.type === "whatsapp") }));
        }
        if (activeTab === "email" && !loaded.inbox) {
          const payload = await getInboxMessagesByCompany(company.id);
          if (!cancelled) setLoaded((current) => ({ ...current, inbox: payload.messages, whatsapp: payload.messages.filter((item) => item.type === "whatsapp") }));
        }
        if (activeTab === "agenda" && !loaded.agenda) {
          const agenda = (await getCalendarEvents()).filter((item) => item.company_id === company.id);
          if (!cancelled) setLoaded((current) => ({ ...current, agenda }));
        }
      } catch (error) {
        if (!cancelled) setMessage(error instanceof Error ? error.message : "Não foi possível carregar esta seção.");
      } finally {
        if (!cancelled) setLoadingTab("");
      }
    }
    load();
    return () => { cancelled = true; };
  }, [activeTab, company.id, loaded.activities, loaded.agenda, loaded.contacts, loaded.deals, loaded.inbox, loaded.overview, loaded.proposals, loaded.whatsapp]);

  const summary = useMemo(() => {
    const deals = loaded.deals || [];
    const proposals = loaded.proposals || [];
    return {
      value: Number(company.dealValue || deals.reduce((sum, deal) => sum + Number(deal.value || deal.total_price || deal.contracted_price || 0), 0)),
      lastProposal: proposals[0]?.updated_at || proposals[0]?.created_at,
      nextAction: company.nextAction || String(deals[0]?.nextAction || deals[0]?.next_action || ""),
      lastContact: company.lastContactAt || loaded.activities?.[0]?.occurred_at || loaded.activities?.[0]?.created_at
    };
  }, [company.dealValue, company.lastContactAt, company.nextAction, loaded.activities, loaded.deals, loaded.proposals]);

  function changeTab(tab: TabId) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setMessage("Link direto da ficha copiado.");
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)]">
      <header className="sticky top-0 z-20 border-b border-line bg-[var(--bg-main)]/95 px-4 py-4 backdrop-blur md:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
              <span>{company.category || "Segmento não informado"}</span>
              <span>•</span>
              <span>{[company.city, company.state].filter(Boolean).join("/") || "Localidade não informada"}</span>
              <span>•</span>
              <span>{company.status || "Novo Lead"}</span>
            </div>
            <h1 className="mt-1 truncate text-2xl font-black">{company.name}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={returnHref} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold"><ArrowLeft className="h-4 w-4" /> Voltar ao CRM</Link>
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold"><FileText className="h-4 w-4" /> Exportar PDF</button>
            {company.mapsUrl && <a href={company.mapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold"><MapPin className="h-4 w-4" /> Maps</a>}
            <a href={linkedinSearchUrl(company)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold"><Linkedin className="h-4 w-4" /> LinkedIn</a>
            {whatsappUrl(company) && <a href={whatsappUrl(company)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold"><MessageCircle className="h-4 w-4" /> WhatsApp</a>}
            <Link href="/app/proposals" className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold"><Send className="h-4 w-4" /> Criar proposta</Link>
            <button disabled={!canEdit} onClick={() => changeTab("agenda")} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"><Plus className="h-4 w-4" /> Criar tarefa</button>
            <button onClick={copyLink} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold"><Copy className="h-4 w-4" /> Copiar link</button>
          </div>
        </div>
      </header>

      {message && <div className="mx-4 mt-4 rounded-lg border border-line bg-panel px-4 py-3 text-sm md:mx-6">{message}</div>}

      <main className="grid gap-4 p-4 md:p-6 xl:grid-cols-[240px_minmax(0,1fr)_300px]">
        <aside className="rounded-xl border border-line bg-panel p-2 xl:sticky xl:top-24 xl:h-[calc(100dvh-7rem)] xl:overflow-y-auto">
          <nav className="grid grid-cols-2 gap-1 sm:grid-cols-3 xl:grid-cols-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => changeTab(tab.id)} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold ${activeTab === tab.id ? "bg-electric text-white" : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"}`}>
                  <Icon className="h-4 w-4" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="min-h-[62vh] rounded-xl border border-line bg-panel p-4 md:p-5">
          {loadingTab === activeTab && <p className="text-sm text-[var(--text-secondary)]">Carregando seção...</p>}
          {activeTab === "overview" && <Overview company={company} loaded={loaded} summary={summary} />}
          {activeTab === "history" && <ListSection title="Histórico comercial" empty="Nenhuma atividade registrada." items={loaded.activities} fields={["summary", "type", "responsible", "occurred_at", "created_at"]} />}
          {activeTab === "contacts" && <ListSection title="Contatos" empty="Nenhum contato vinculado." items={loaded.contacts} fields={["name", "role", "phone", "email", "linkedin_url"]} />}
          {activeTab === "deals" && <ListSection title="Negociações" empty="Nenhuma negociação cadastrada." items={loaded.deals} fields={["name", "status", "temperature", "value", "nextAction", "responsible"]} moneyFields={["value"]} />}
          {activeTab === "products" && (
            <ProductsSection
              companyId={company.id}
              items={loaded.deals}
              proposals={loaded.proposals}
              canEdit={canEdit}
              canDelete={["owner", "admin"].includes(role)}
              onChange={(deals) => setLoaded((current) => ({ ...current, deals }))}
            />
          )}
          {activeTab === "proposals" && <ProposalsSection company={company} products={loaded.deals} items={loaded.proposals} role={role} onChange={(proposals) => setLoaded((current) => ({ ...current, proposals }))} />}
          {activeTab === "whatsapp" && <ListSection title="WhatsApp" empty="Nenhuma conversa WhatsApp encontrada." items={loaded.whatsapp as unknown as Array<Record<string, unknown>> | undefined} fields={["body", "message", "direction", "sent_at", "created_at"]} />}
          {activeTab === "email" && <ListSection title="E-mail" empty="Nenhum e-mail encontrado nesta ficha." items={(loaded.inbox || []).filter((item) => item.type === "email") as unknown as Array<Record<string, unknown>>} fields={["subject", "body", "message", "direction", "sent_at", "created_at"]} />}
          {activeTab === "agenda" && <ListSection title="Agenda" empty="Nenhuma tarefa ou evento vinculado." items={loaded.agenda as unknown as Array<Record<string, unknown>> | undefined} fields={["title", "status", "start_at", "end_at", "responsible"]} />}
          {activeTab === "ai" && <AiSection company={company} />}
          {activeTab === "apollo" && <ApolloSection company={company} />}
          {activeTab === "files" && <ListSection title="Arquivos/Anexos" empty="Nenhum anexo encontrado no histórico carregado." items={[]} fields={[]} />}
        </section>

        <aside className="rounded-xl border border-line bg-panel p-4 xl:sticky xl:top-24 xl:h-[calc(100dvh-7rem)] xl:overflow-y-auto">
          <h2 className="text-sm font-black uppercase tracking-[0.14em] text-[var(--text-secondary)]">Resumo comercial</h2>
          <div className="mt-4 space-y-3">
            <ScoreBadge score={company.score || 0} />
            <SummaryRow label="Valor em negociação" value={money(summary.value)} />
            <SummaryRow label="Etapa" value={company.status || "Não informado"} />
            <SummaryRow label="Temperatura" value={company.temperature || company.opportunityLevel || "Não informado"} />
            <SummaryRow label="Próxima ação" value={summary.nextAction || "Não informado"} />
            <SummaryRow label="Último contato" value={dateLabel(summary.lastContact)} />
            <SummaryRow label="Última proposta" value={dateLabel(summary.lastProposal)} />
            <SummaryRow label="Responsável" value={company.ownerId || "Workspace"} />
          </div>
          <div className="mt-5 grid gap-2">
            <button disabled={!canEdit} onClick={() => changeTab("history")} className="rounded-lg bg-electric px-3 py-2 text-sm font-bold text-white disabled:opacity-50">Registrar interação</button>
            <button disabled={!canEdit} onClick={() => changeTab("deals")} className="rounded-lg border border-line px-3 py-2 text-sm font-bold disabled:opacity-50">Atualizar negociação</button>
          </div>
        </aside>
      </main>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-line bg-ink/60 p-3"><p className="text-xs text-[var(--text-secondary)]">{label}</p><p className="mt-1 text-sm font-bold">{value}</p></div>;
}

function Overview({ company, loaded, summary }: { company: Company; loaded: Loaded; summary: { value: number; lastProposal: unknown; nextAction: string; lastContact: unknown } }) {
  const opportunities = [...(company.detectedOpportunities || []), ...(company.opportunitySignals || [])].slice(0, 8);
  const proposals = loaded.proposals || [];
  const deals = loaded.deals || [];
  const inbox = loaded.inbox || [];
  const activities = loaded.activities || [];
  const contacts = loaded.contacts || [];
  const agenda = loaded.agenda || [];
  const latestProposal = proposals[0];
  const currentDeal = deals[0];
  const companyRecord = company as Company & { serviceInterest?: string };
  const recommendedService = companyRecord.serviceInterest || company.recommendedApproach || company.suggestedApproach || String(currentDeal?.itemName || currentDeal?.item_name || latestProposal?.service_type || "Não informado");
  const timeline = buildTimeline(company, loaded);
  return (
    <div>
      <h2 className="text-xl font-black">Visão Geral</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Info label="Telefone" value={company.phone || company.whatsapp || "Não informado"} icon={Phone} />
        <Info label="Site" value={company.website || "Não informado"} icon={Globe2} href={externalUrl(company.website)} />
        <Info label="CNPJ" value={company.cnpj || "Não informado"} icon={BriefcaseBusiness} />
        <Info label="Endereço" value={company.address || "Não informado"} icon={MapPin} />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <SummaryCard label="Último contato" value={dateLabel(summary.lastContact)} hint={`${inbox.length} mensagem(ns), ${activities.length} atividade(s)`} />
        <SummaryCard label="Última proposta" value={latestProposal ? money(latestProposal.total) : "Não informado"} hint={latestProposal ? `${latestProposal.status} · ${dateLabel(latestProposal.updated_at || latestProposal.created_at)}` : "Nenhuma proposta vinculada"} />
        <SummaryCard label="Status da negociação" value={String(currentDeal?.status || company.status || "Não informado")} hint={company.temperature || company.opportunityLevel || "Temperatura não informada"} />
        <SummaryCard label="Próxima ação" value={summary.nextAction || "Não informado"} hint={agenda[0]?.title || "Sem tarefa futura carregada"} />
        <SummaryCard label="Serviço recomendado" value={recommendedService} hint={company.priorityReason || "Recomendação baseada na ficha comercial"} />
        <SummaryCard label="Valor em negociação" value={money(summary.value)} hint={currentDeal ? "Negociação vinculada" : "Estimativa do CRM"} />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <section className="rounded-xl border border-line bg-ink/60 p-4">
          <h3 className="font-black">Linha do tempo consolidada</h3>
          <div className="mt-4 space-y-3">
            {timeline.map((event) => (
              <article key={event.id} className="relative rounded-lg border border-line bg-panel p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="text-sm">{event.title}</strong>
                  <span className="text-xs text-[var(--text-secondary)]">{dateLabel(event.date)}</span>
                </div>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{event.detail}</p>
                <span className="mt-2 inline-flex rounded-full border border-line px-2 py-1 text-[11px] font-bold text-cyan">{event.channel}</span>
              </article>
            ))}
            {!timeline.length && <p className="rounded-lg border border-dashed border-line p-6 text-center text-sm text-[var(--text-secondary)]">Nenhum evento comercial consolidado ainda.</p>}
          </div>
        </section>

        <div className="space-y-4">
          <section className="rounded-xl border border-line bg-ink/60 p-4">
            <h3 className="font-black">Solução recomendada</h3>
            <div className="mt-3 space-y-3 text-sm">
              <InfoLine label="Diagnóstico" value={company.digitalPresenceAnalysis || company.suggestedApproach || "Sem diagnóstico registrado."} />
              <InfoLine label="Problema identificado" value={company.digitalGaps?.join(", ") || "Sem problema registrado."} />
              <InfoLine label="Oportunidade comercial" value={opportunities[0] || "Sem oportunidade registrada."} />
              <InfoLine label="Serviço recomendado" value={recommendedService} />
              <InfoLine label="Justificativa" value={company.priorityReason || company.recommendedApproach || "Sem justificativa registrada."} />
              <InfoLine label="Prioridade" value={company.opportunityLevel || company.nodereClassification || "Não informado"} />
              <InfoLine label="Próximo passo sugerido" value={summary.nextAction || company.nextSteps?.[0] || "Não informado"} />
            </div>
          </section>

          <section className="rounded-xl border border-line bg-ink/60 p-4">
            <h3 className="font-black">Histórico comercial</h3>
            <div className="mt-3 grid gap-2 text-sm">
              <InfoLine label="Contatos cadastrados" value={String(contacts.length)} />
              <InfoLine label="WhatsApps" value={String(inbox.filter((item) => item.type === "whatsapp").length)} />
              <InfoLine label="E-mails" value={String(inbox.filter((item) => item.type === "email").length)} />
              <InfoLine label="Atividades" value={String(activities.length)} />
              <InfoLine label="Negociações" value={String(deals.length)} />
              <InfoLine label="Propostas/contratos" value={String(proposals.length)} />
              <InfoLine label="Agenda" value={String(agenda.length)} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-line bg-ink/60 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">{label}</p>
      <p className="mt-2 line-clamp-2 text-lg font-black">{value}</p>
      <p className="mt-1 line-clamp-2 text-xs text-[var(--text-secondary)]">{hint}</p>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return <p><span className="font-semibold text-[var(--text-secondary)]">{label}: </span>{value}</p>;
}

function eventDate(value: unknown) {
  const date = value ? new Date(String(value)) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : "";
}

function buildTimeline(company: Company, loaded: Loaded) {
  const events: Array<{ id: string; title: string; detail: string; channel: string; date: string }> = [];
  (loaded.inbox || []).forEach((item, index) => {
    const inboxRecord = item as InboxMessage & { message?: string };
    const type = item.type === "whatsapp" ? "Contato por WhatsApp" : item.type === "email" ? "Contato por e-mail" : "Contato registrado";
    events.push({
      id: `inbox-${item.id || index}`,
      title: type,
      detail: String(item.body || inboxRecord.message || item.subject || item.direction || "Mensagem registrada"),
      channel: String(item.direction || item.type || "inbox"),
      date: eventDate(item.sent_at || item.created_at)
    });
  });
  (loaded.activities || []).forEach((item, index) => {
    const type = String(item.type || "note");
    events.push({
      id: `activity-${String(item.id || index)}`,
      title: type === "proposal" ? "Proposta enviada" : type === "meeting" ? "Reunião registrada" : type === "loss" ? "Perda registrada" : "Observação criada",
      detail: String(item.summary || item.title || item.body || item.details || "Atividade comercial"),
      channel: String(item.channel || type),
      date: eventDate(item.occurred_at || item.occurredAt || item.created_at || item.createdAt)
    });
  });
  (loaded.proposals || []).forEach((item) => {
    events.push({
      id: `proposal-${item.id}`,
      title: item.metadata?.document_type === "contract" ? "Contrato gerado" : "Proposta gerada",
      detail: `${item.title} · ${item.status} · ${money(item.total)}`,
      channel: "Propostas e Contratos",
      date: eventDate(item.updated_at || item.created_at)
    });
  });
  (loaded.deals || []).forEach((item, index) => {
    events.push({
      id: `deal-${String(item.id || index)}`,
      title: String(item.status || "").toLowerCase().includes("won") ? "Venda fechada" : String(item.status || "").toLowerCase().includes("lost") ? "Perda registrada" : "Nova negociação",
      detail: `${String(item.name || item.itemName || item.item_name || "Negociação")} · ${money(item.value || item.total_price || item.contracted_price)}`,
      channel: "Negociação",
      date: eventDate(item.updated_at || item.updatedAt || item.created_at || item.createdAt || company.updatedAt)
    });
  });
  (loaded.agenda || []).forEach((item) => {
    events.push({
      id: `agenda-${item.id}`,
      title: "Reunião agendada",
      detail: `${item.title || "Evento"} · ${item.status || "pendente"}`,
      channel: "Agenda",
      date: eventDate(item.start_at)
    });
  });
  if (company.status) {
    events.push({
      id: "company-status",
      title: "Alteração de status",
      detail: `${company.name} está em ${company.status}`,
      channel: "CRM",
      date: eventDate(company.updatedAt || company.createdAt)
    });
  }
  return events
    .filter((item) => item.date)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 30);
}

function Info({ label, value, icon: Icon, href }: { label: string; value: string; icon: typeof Phone; href?: string }) {
  const content = <><Icon className="h-4 w-4 text-cyan" /><div><p className="text-xs text-[var(--text-secondary)]">{label}</p><p className="break-words text-sm font-bold">{value}</p></div></>;
  return href ? <a href={href} target="_blank" rel="noreferrer" className="flex gap-3 rounded-lg border border-line bg-ink/60 p-3 hover:border-cyan/50">{content}</a> : <div className="flex gap-3 rounded-lg border border-line bg-ink/60 p-3">{content}</div>;
}

function ListSection({ title, empty, items, fields, moneyFields = [] }: { title: string; empty: string; items?: Array<Record<string, unknown>>; fields: string[]; moneyFields?: string[] }) {
  return (
    <div>
      <h2 className="text-xl font-black">{title}</h2>
      <div className="mt-4 space-y-3">
        {(items || []).map((item, index) => (
          <article key={String(item.id || index)} className="rounded-lg border border-line bg-ink/60 p-4">
            {fields.map((field) => item[field] ? <p key={field} className="text-sm"><span className="font-semibold text-[var(--text-secondary)]">{field}: </span>{moneyFields.includes(field) ? money(item[field]) : String(item[field])}</p> : null)}
          </article>
        ))}
        {(!items || items.length === 0) && <p className="rounded-lg border border-dashed border-line p-6 text-center text-sm text-[var(--text-secondary)]">{empty}</p>}
      </div>
    </div>
  );
}

function ProductsSection({ companyId, items, proposals, canEdit, canDelete, onChange }: { companyId: string; items?: Array<Record<string, unknown>>; proposals?: NodereProposal[]; canEdit: boolean; canDelete: boolean; onChange: (items: Array<Record<string, unknown>>) => void }) {
  const [draft, setDraft] = useState<ProductNegotiationDraft>(emptyProductNegotiation);
  const [editingId, setEditingId] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const visibleItems = (items || []).filter((item) => !parseProductNegotiation(item).deletedAt);
  const parsedItems = visibleItems.map((item) => ({ item, draft: parseProductNegotiation(item) }));
  const closed = parsedItems.filter(({ draft: current }) => current.negotiationStatus === "Fechou");
  const inProgress = parsedItems.filter(({ draft: current }) => !["Fechou", "Não fechou", "Cancelado"].includes(current.negotiationStatus));
  const totalNegotiating = inProgress.reduce((sum, { draft: current }) => sum + decimalFromInput(current.finalValue || current.negotiatedValue), 0);
  const totalClosed = closed.reduce((sum, { draft: current }) => sum + decimalFromInput(current.finalValue || current.negotiatedValue), 0);
  const nextAction = parsedItems
    .filter(({ draft: current }) => current.nextActionDate)
    .sort((a, b) => new Date(a.draft.nextActionDate).getTime() - new Date(b.draft.nextActionDate).getTime())[0]?.draft;

  function setField(field: keyof ProductNegotiationDraft, value: string) {
    setDraft((current) => {
      const next = { ...current, [field]: value };
      if (field === "negotiatedValue" || field === "discountValue") {
        const finalValue = Math.max(decimalFromInput(next.negotiatedValue) - decimalFromInput(next.discountValue), 0);
        next.finalValue = finalValue ? String(finalValue) : "";
      }
      return next;
    });
  }

  async function saveProductNegotiation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    if (!companyId) {
      setNotice("Não é possível salvar produto/serviço sem cliente vinculado.");
      return;
    }
    if (!canEdit) {
      setNotice("Seu perfil possui somente leitura nesta ficha.");
      return;
    }
    if (!draft.productServiceName.trim()) {
      setNotice("Informe o produto ou serviço.");
      return;
    }
    if (draft.negotiationStatus === "Não fechou" && !draft.lostReason.trim()) {
      setNotice("Informe o motivo de perda para negociações que não fecharam.");
      return;
    }
    try {
      setSaving(true);
      const payload = payloadFromProductNegotiation(draft);
      const saved = editingId ? await updateLeadDeal(companyId, editingId, payload) : await addLeadDeal(companyId, payload);
      onChange(editingId ? (items || []).map((item) => item.id === editingId ? saved : item) : [saved, ...(items || [])]);
      setDraft(emptyProductNegotiation());
      setEditingId("");
      setNotice(editingId ? "Produto/serviço atualizado." : "Produto/serviço registrado na ficha.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível salvar o produto/serviço.");
    } finally {
      setSaving(false);
    }
  }

  function editItem(item: Record<string, unknown>) {
    setEditingId(String(item.id || ""));
    setDraft(parseProductNegotiation(item));
    setNotice("");
  }

  async function changeStatus(item: Record<string, unknown>, status: string) {
    const current = { ...parseProductNegotiation(item), negotiationStatus: status };
    if (status === "Não fechou" && !current.lostReason.trim()) {
      editItem(item);
      setDraft(current);
      setNotice("Informe o motivo de perda antes de marcar como não fechado.");
      return;
    }
    try {
      setSaving(true);
      const saved = await updateLeadDeal(companyId, String(item.id), payloadFromProductNegotiation(current));
      onChange((items || []).map((existing) => existing.id === item.id ? saved : existing));
      setNotice(status === "Fechou" ? "Produto/serviço marcado como fechado." : "Produto/serviço marcado como perdido.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível atualizar o status.");
    } finally {
      setSaving(false);
    }
  }

  async function logicalDelete(item: Record<string, unknown>) {
    if (!canDelete) {
      setNotice("Somente owner/admin podem excluir produtos/serviços da ficha.");
      return;
    }
    if (!window.confirm("Excluir este produto/serviço da ficha? O registro será inativado logicamente.")) return;
    const current = { ...parseProductNegotiation(item), negotiationStatus: "Cancelado", deletedAt: new Date().toISOString() };
    try {
      setSaving(true);
      const saved = await updateLeadDeal(companyId, String(item.id), payloadFromProductNegotiation(current));
      onChange((items || []).map((existing) => existing.id === item.id ? saved : existing));
      setNotice("Produto/serviço excluído logicamente.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível excluir logicamente.");
    } finally {
      setSaving(false);
    }
  }

  async function downloadLinkedProposal(proposalId: string) {
    const proposal = (proposals || []).find((item) => item.id === proposalId);
    await downloadProposalPdf(proposalId, `${proposal?.title || "proposta-nodere"}.pdf`);
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">Produtos/Serviços</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Contratações e negociações vinculadas a este cliente.</p>
        </div>
        {!canEdit && <span className="rounded-full border border-line px-3 py-1 text-xs font-bold text-[var(--text-secondary)]">Somente leitura</span>}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total em negociação" value={money(totalNegotiating)} hint={`${inProgress.length} item(ns) em andamento`} />
        <SummaryCard label="Total fechado" value={money(totalClosed)} hint={`${closed.length} contratação(ões) fechada(s)`} />
        <SummaryCard label="Produtos/serviços" value={String(visibleItems.length)} hint="Registros ativos nesta ficha" />
        <SummaryCard label="Próxima ação" value={nextAction?.nextAction || "Não informado"} hint={dateLabel(nextAction?.nextActionDate)} />
      </div>

      {notice && <p className="mt-4 rounded-lg border border-line bg-ink/60 px-4 py-3 text-sm">{notice}</p>}

      {canEdit && (
        <form onSubmit={saveProductNegotiation} className="mt-5 rounded-xl border border-line bg-ink/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-black">{editingId ? "Editar produto/serviço" : "Adicionar produto/serviço"}</h3>
            {editingId && <button type="button" onClick={() => { setEditingId(""); setDraft(emptyProductNegotiation()); }} className="rounded-lg border border-line px-3 py-2 text-sm font-bold">Cancelar edição</button>}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Field label="Produto ou serviço" value={draft.productServiceName} onChange={(value) => setField("productServiceName", value)} required />
            <SelectField label="Tipo" value={draft.category} options={productCategories} onChange={(value) => setField("category", value)} />
            <SelectField label="Status da negociação" value={draft.negotiationStatus} options={negotiationStatuses} onChange={(value) => setField("negotiationStatus", value)} />
            <SelectField label="Tipo de venda" value={draft.saleType} options={saleTypes} onChange={(value) => setField("saleType", value)} />
            <Field label="Valor negociado" value={draft.negotiatedValue} onChange={(value) => setField("negotiatedValue", value)} placeholder="0,00" />
            <Field label="Desconto aplicado" value={draft.discountValue} onChange={(value) => setField("discountValue", value)} placeholder="0,00" />
            <Field label="Valor final" value={draft.finalValue} onChange={(value) => setField("finalValue", value)} placeholder="0,00" />
            <Field label="Prazo de pagamento" value={draft.paymentTerms} onChange={(value) => setField("paymentTerms", value)} />
            <Field label="Forma de pagamento" value={draft.paymentMethod} onChange={(value) => setField("paymentMethod", value)} />
            <Field label="Prazo execução/entrega" value={draft.executionDeadline} onChange={(value) => setField("executionDeadline", value)} />
            <Field label="Data prevista de início" type="date" value={draft.expectedStartDate} onChange={(value) => setField("expectedStartDate", value)} />
            <Field label="Data prevista de conclusão" type="date" value={draft.expectedEndDate} onChange={(value) => setField("expectedEndDate", value)} />
            <Field label="Responsável" value={draft.responsible} onChange={(value) => setField("responsible", value)} />
            <Field label="Próxima ação" value={draft.nextAction} onChange={(value) => setField("nextAction", value)} />
            <Field label="Data da próxima ação" type="datetime-local" value={draft.nextActionDate} onChange={(value) => setField("nextActionDate", value)} />
            <SelectField label="Proposta vinculada" value={draft.proposalId} options={["", ...(proposals || []).map((item) => item.id)]} labels={{ "": "Sem proposta vinculada", ...(proposals || []).reduce<Record<string, string>>((acc, item) => ({ ...acc, [item.id]: `${item.title} · ${money(item.total)}` }), {}) }} onChange={(value) => setField("proposalId", value)} />
            <Field label="Data de envio da proposta" type="datetime-local" value={draft.proposalSentAt} onChange={(value) => setField("proposalSentAt", value)} />
            <SelectField label="Canal de envio" value={draft.proposalSentChannel} options={proposalChannels} onChange={(value) => setField("proposalSentChannel", value)} />
            <Field label="Contratação anterior (upgrade)" value={draft.previousContractId} onChange={(value) => setField("previousContractId", value)} placeholder="ID ou referência, se houver" />
            <TextAreaField label="Descrição do produto/serviço" value={draft.description} onChange={(value) => setField("description", value)} />
            <TextAreaField label="Observações comerciais" value={draft.notes} onChange={(value) => setField("notes", value)} />
            {draft.negotiationStatus === "Não fechou" && <TextAreaField label="Motivo de perda" value={draft.lostReason} onChange={(value) => setField("lostReason", value)} required />}
          </div>
          <button disabled={saving} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-electric px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
            <Plus className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar"}
          </button>
        </form>
      )}

      <div className="mt-5 space-y-3">
        {parsedItems.map(({ item, draft: current }) => {
          const proposal = (proposals || []).find((proposalItem) => proposalItem.id === current.proposalId);
          return (
            <article key={String(item.id)} className="rounded-xl border border-line bg-ink/60 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-cyan">{current.category} · {current.saleType}</p>
                  <h3 className="mt-1 text-lg font-black">{current.productServiceName || "Produto/serviço sem nome"}</h3>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{current.description || "Sem descrição registrada."}</p>
                </div>
                <span className="rounded-full border border-line px-3 py-1 text-xs font-bold">{current.negotiationStatus}</span>
              </div>
              <div className="mt-4 grid gap-2 text-sm md:grid-cols-2 xl:grid-cols-3">
                <InfoLine label="Valor negociado" value={money(decimalFromInput(current.negotiatedValue))} />
                <InfoLine label="Desconto" value={money(decimalFromInput(current.discountValue))} />
                <InfoLine label="Valor final" value={money(decimalFromInput(current.finalValue || current.negotiatedValue))} />
                <InfoLine label="Pagamento" value={[current.paymentTerms, current.paymentMethod].filter(Boolean).join(" · ") || "Não informado"} />
                <InfoLine label="Execução" value={current.executionDeadline || "Não informado"} />
                <InfoLine label="Período" value={`${dateLabel(current.expectedStartDate)} até ${dateLabel(current.expectedEndDate)}`} />
                <InfoLine label="Responsável" value={current.responsible || "Não informado"} />
                <InfoLine label="Próxima ação" value={current.nextAction || "Não informado"} />
                <InfoLine label="Data próxima ação" value={dateLabel(current.nextActionDate)} />
                <InfoLine label="Proposta" value={proposal ? proposal.title : current.proposalId || "Não vinculada"} />
                <InfoLine label="Envio" value={`${dateLabel(current.proposalSentAt)} · ${current.proposalSentChannel || "canal não informado"}`} />
                {current.lostReason && <InfoLine label="Motivo de perda" value={current.lostReason} />}
              </div>
              {current.notes && <p className="mt-3 rounded-lg border border-line bg-panel p-3 text-sm text-[var(--text-secondary)]">{current.notes}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                {canEdit && <button type="button" onClick={() => editItem(item)} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-bold"><Pencil className="h-4 w-4" /> Editar</button>}
                {canEdit && <button type="button" disabled={saving} onClick={() => changeStatus(item, "Fechou")} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-bold"><CheckCircle2 className="h-4 w-4" /> Marcar como fechado</button>}
                {canEdit && <button type="button" disabled={saving} onClick={() => changeStatus(item, "Não fechou")} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-bold"><XCircle className="h-4 w-4" /> Marcar como perdido</button>}
                {proposal && <Link href="/app/proposals" className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-bold"><FileText className="h-4 w-4" /> Ver proposta</Link>}
                {proposal && <button type="button" onClick={() => downloadLinkedProposal(proposal.id)} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-bold"><Download className="h-4 w-4" /> Baixar PDF</button>}
                {canDelete && <button type="button" disabled={saving} onClick={() => logicalDelete(item)} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-bold text-red-300"><Trash2 className="h-4 w-4" /> Excluir</button>}
              </div>
            </article>
          );
        })}
        {!parsedItems.length && <p className="rounded-lg border border-dashed border-line p-6 text-center text-sm text-[var(--text-secondary)]">Nenhum produto/serviço contratado ou em negociação para este cliente.</p>}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false, placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <label className="text-sm font-semibold">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <input required={required} type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-cyan" />
    </label>
  );
}

function SelectField({ label, value, options, labels, onChange }: { label: string; value: string; options: string[]; labels?: Record<string, string>; onChange: (value: string) => void }) {
  return (
    <label className="text-sm font-semibold">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-cyan">
        {options.map((option) => <option key={option || "empty"} value={option}>{labels?.[option] || option}</option>)}
      </select>
    </label>
  );
}

function TextAreaField({ label, value, onChange, required = false }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <label className="text-sm font-semibold md:col-span-2">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <textarea required={required} value={value} onChange={(event) => onChange(event.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-cyan" />
    </label>
  );
}

type ProposalGroup = {
  id: string;
  documentType: "proposal" | "contract";
  current: NodereProposal;
  versions: NodereProposal[];
  signature: string;
};

function proposalDocumentType(item: NodereProposal): "proposal" | "contract" {
  return item.metadata?.document_type === "contract" ? "contract" : "proposal";
}

function proposalVersionNumber(item: NodereProposal, index: number) {
  const fromMetadata = Number(item.metadata?.version_number || item.metadata?.version);
  return Number.isFinite(fromMetadata) && fromMetadata > 0 ? fromMetadata : Number(item.version || index + 1);
}

function proposalSignature(item: NodereProposal) {
  const terms = (item.items || []).map((proposalItem) => ({
    catalog_item_id: proposalItem.catalog_item_id,
    name: proposalItem.snapshot_name,
    quantity: proposalItem.quantity,
    unit: proposalItem.snapshot_unit_price,
    discount_type: proposalItem.discount_type,
    discount_percent: proposalItem.discount_percent,
    discount_amount: proposalItem.discount_amount,
    gross_total: proposalItem.gross_total,
    final_total: proposalItem.final_total,
    payment_terms: proposalItem.snapshot_payment_terms,
    payment_method: proposalItem.snapshot_payment_method,
    execution_deadline: proposalItem.snapshot_execution_deadline
  })).sort((a, b) => String(a.catalog_item_id || a.name).localeCompare(String(b.catalog_item_id || b.name)));
  return JSON.stringify({
    type: proposalDocumentType(item),
    service_type: item.service_type || "",
    subtotal: Number(item.subtotal || 0),
    discount: Number(item.discount || 0),
    total: Number(item.total || 0),
    currency: item.currency || "BRL",
    valid_until: item.valid_until || "",
    terms
  });
}

function groupProposals(items?: NodereProposal[]) {
  const groups = new Map<string, NodereProposal[]>();
  (items || [])
    .filter((item) => !item.metadata?.deleted_at)
    .forEach((item) => {
      const explicitGroup = String(item.metadata?.document_group_id || "");
      const signature = explicitGroup || proposalSignature(item);
      groups.set(signature, [...(groups.get(signature) || []), item]);
    });
  return Array.from(groups.entries()).map(([signature, versions]) => {
    const sorted = [...versions].sort((a, b) => new Date(String(b.updated_at || b.created_at || 0)).getTime() - new Date(String(a.updated_at || a.created_at || 0)).getTime());
    const current = sorted[0];
    return {
      id: String(current.metadata?.document_group_id || signature),
      documentType: proposalDocumentType(current),
      current,
      versions: sorted,
      signature
    } as ProposalGroup;
  }).sort((a, b) => new Date(String(b.current.updated_at || b.current.created_at || 0)).getTime() - new Date(String(a.current.updated_at || a.current.created_at || 0)).getTime());
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: "Rascunho",
    sent: "Enviada",
    accepted: "Aceita",
    rejected: "Recusada",
    expired: "Expirada",
    cancelled: "Cancelada"
  };
  return labels[status] || status;
}

function slug(value: string) {
  return String(value || "documento").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
}

type DocumentSelectionState = {
  quantity: number;
  appliedPrice: string;
  discountType: "none" | "percent" | "amount";
  discountPercent: string;
  discountAmount: string;
  discountReason: string;
  customerNote: string;
  internalNote: string;
};

function proposalUnitLabel(value?: string | null) {
  const labels: Record<string, string> = {
    unit: "Unidade",
    hour: "Hora",
    monthly: "Mensalidade",
    package: "Pacote",
    project: "Projeto",
    daily: "Diária",
    other: "Outro"
  };
  return labels[String(value || "")] || value || "Unidade";
}

function catalogBasePrice(item: CatalogItem) {
  return Number(item.promotional_price ?? item.price ?? 0);
}

function newDocumentSelection(item: CatalogItem): DocumentSelectionState {
  return {
    quantity: 1,
    appliedPrice: String(catalogBasePrice(item)),
    discountType: "none",
    discountPercent: "",
    discountAmount: "",
    discountReason: "",
    customerNote: "",
    internalNote: ""
  };
}

function ProposalsSection({ company, products, items, role, onChange }: { company: Company; products?: Array<Record<string, unknown>>; items?: NodereProposal[]; role: string; onChange: (items: NodereProposal[]) => void }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [selected, setSelected] = useState<Record<string, DocumentSelectionState>>({});
  const [documentType, setDocumentType] = useState<"proposal" | "contract">("proposal");
  const [documentGroupId, setDocumentGroupId] = useState<string | null>(null);
  const [title, setTitle] = useState(`Proposta comercial - ${company.name}`);
  const [customerNotes, setCustomerNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const groups = groupProposals(items);
  const currentDocument = groups[0]?.current;
  const canCreate = ["owner", "admin", "operator"].includes(role);
  const canDelete = ["owner", "admin"].includes(role);
  const canEditProposal = ["owner", "admin", "operator"].includes(role);
  const canEditContract = ["owner", "admin"].includes(role);
  const activeCatalog = useMemo(() => catalogItems.filter((item) => item.status === "active"), [catalogItems]);
  const linkedCatalogIds = useMemo(() => {
    const ids = new Set<string>();
    (products || []).forEach((item) => {
      const draft = parseProductNegotiation(item);
      if (draft.catalogItemId) ids.add(draft.catalogItemId);
      const matched = activeCatalog.find((catalog) => catalog.name.toLowerCase() === draft.productServiceName.toLowerCase());
      if (matched) ids.add(matched.id);
    });
    return ids;
  }, [activeCatalog, products]);
  const selectableCatalog = useMemo(() => {
    return activeCatalog.filter((item) => linkedCatalogIds.has(item.id));
  }, [activeCatalog, linkedCatalogIds]);
  const selectedRows = selectableCatalog.filter((item) => selected[item.id]).map((item) => ({ catalog: item, selection: selected[item.id] }));
  const totals = selectedRows.reduce((acc, row) => {
    const unit = decimalFromInput(row.selection.appliedPrice) || catalogBasePrice(row.catalog);
    const gross = unit * Number(row.selection.quantity || 0);
    const discount = row.selection.discountType === "percent"
      ? gross * (decimalFromInput(row.selection.discountPercent) / 100)
      : row.selection.discountType === "amount"
        ? decimalFromInput(row.selection.discountAmount)
        : 0;
    const safeDiscount = Math.min(discount, gross);
    acc.original += catalogBasePrice(row.catalog) * Number(row.selection.quantity || 0);
    acc.applied += gross;
    acc.discount += safeDiscount;
    acc.final += Math.max(0, gross - safeDiscount);
    return acc;
  }, { original: 0, applied: 0, discount: 0, final: 0 });

  useEffect(() => {
    let mounted = true;
    getCatalogItems("?status=active")
      .then((rows) => { if (mounted) setCatalogItems(rows); })
      .catch((error) => { if (mounted) setNotice(error instanceof Error ? error.message : "Não foi possível carregar catálogo ativo."); });
    return () => { mounted = false; };
  }, []);

  async function downloadDocument(item: NodereProposal) {
    const type = proposalDocumentType(item);
    const name = `${type === "contract" ? "contrato" : "proposta"}-${slug(item.title || item.id)}-v${item.version || 1}.pdf`;
    if (type === "contract") await downloadContractPdf(item.id, name);
    else await downloadProposalPdf(item.id, name);
  }

  async function removeDocument(item: NodereProposal) {
    if (!canDelete) {
      setNotice("Somente owner/admin podem excluir propostas ou contratos.");
      return;
    }
    const reason = window.prompt("Informe o motivo da exclusão lógica:", "Documento removido da ficha comercial.");
    if (reason === null) return;
    if (reason.trim().length < 3) {
      setNotice("Informe um motivo de exclusão com pelo menos 3 caracteres.");
      return;
    }
    try {
      const deleted = await deleteProposal(item.id, reason);
      onChange((items || []).map((proposal) => proposal.id === item.id ? deleted : proposal));
      setNotice("Documento excluído logicamente do histórico ativo.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível excluir o documento.");
    }
  }

  function canEdit(item: NodereProposal) {
    return proposalDocumentType(item) === "contract" ? canEditContract : canEditProposal;
  }

  function toggleProduct(item: CatalogItem, checked: boolean) {
    setSelected((current) => {
      const next = { ...current };
      if (!checked) delete next[item.id];
      else next[item.id] = next[item.id] || newDocumentSelection(item);
      return next;
    });
  }

  function updateSelected(itemId: string, patch: Partial<DocumentSelectionState>) {
    setSelected((current) => ({ ...current, [itemId]: { ...(current[itemId] || { quantity: 1, appliedPrice: "0", discountType: "none", discountPercent: "", discountAmount: "", discountReason: "", customerNote: "", internalNote: "" }), ...patch } }));
  }

  function validateDocument() {
    if (documentType === "contract" && !canEditContract) return "Seu perfil não possui permissão para gerar contratos.";
    if (!selectedRows.length) return "Selecione pelo menos um produto/serviço vinculado e ativo.";
    for (const row of selectedRows) {
      const unit = decimalFromInput(row.selection.appliedPrice);
      const quantity = Number(row.selection.quantity || 0);
      if (unit < 0 || quantity <= 0) return `Informe valor aplicado e quantidade válidos para ${row.catalog.name}.`;
      if (row.selection.discountType === "percent" && decimalFromInput(row.selection.discountAmount) > 0) return "Use desconto por percentual OU por valor.";
      if (row.selection.discountType === "amount" && decimalFromInput(row.selection.discountPercent) > 0) return "Use desconto por percentual OU por valor.";
      const discountValue = row.selection.discountType === "percent" ? unit * quantity * (decimalFromInput(row.selection.discountPercent) / 100) : row.selection.discountType === "amount" ? decimalFromInput(row.selection.discountAmount) : 0;
      if (discountValue > 0 && !row.selection.discountReason.trim()) return `Informe o motivo do desconto para ${row.catalog.name}.`;
      if (discountValue > unit * quantity) return `Desconto maior que o valor aplicado em ${row.catalog.name}.`;
    }
    return "";
  }

  function buildDocumentItems(): ProposalItemPayload[] {
    return selectedRows.map(({ catalog, selection }) => {
      const unit = decimalFromInput(selection.appliedPrice) || catalogBasePrice(catalog);
      const base = catalogBasePrice(catalog);
      const priceDelta = unit !== base ? `Preço aplicado alterado de ${money(base)} para ${money(unit)}.` : "";
      return {
        catalog_item_id: catalog.id,
        quantity: Number(selection.quantity || 1),
        unit_price_override: unit,
        discount_type: selection.discountType,
        discount_percent: selection.discountType === "percent" ? decimalFromInput(selection.discountPercent) : null,
        discount_amount: selection.discountType === "amount" ? decimalFromInput(selection.discountAmount) : null,
        discount_reason: selection.discountType !== "none" ? selection.discountReason.trim() : null,
        customer_item_note: selection.customerNote.trim() || null,
        internal_item_note: [priceDelta, selection.internalNote.trim()].filter(Boolean).join(" ") || null
      } as ProposalItemPayload;
    });
  }

  async function createControlledDocument() {
    const validation = validateDocument();
    if (validation) {
      setNotice(validation);
      return;
    }
    try {
      setSaving(true);
      const created = await createProposal({
        lead_id: company.id,
        title: title.trim() || `${documentType === "contract" ? "Contrato" : "Proposta"} - ${company.name}`,
        document_type: documentType,
        service_type: selectedRows.map((row) => row.catalog.name).join(", "),
        customer_notes: customerNotes.trim() || null,
        internal_notes: internalNotes.trim() || null,
        items: buildDocumentItems(),
        valid_until: validUntil || null,
        document_group_id: documentGroupId,
        change_reason: internalNotes.trim() || "Documento gerado pela ficha comercial com produtos/serviços selecionados."
      });
      if (documentType === "contract") await downloadContractPdf(created.id, `contrato-${slug(created.title || created.id)}.pdf`);
      else await downloadProposalPdf(created.id, `proposta-${slug(created.title || created.id)}.pdf`);
      onChange([created, ...(items || [])]);
      setSelected({});
      setCustomerNotes("");
      setInternalNotes("");
      setDocumentGroupId(null);
      setNotice(`${documentType === "contract" ? "Contrato" : "Proposta"} gerado(a), salvo(a) e vinculado(a) a ${company.name}.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível gerar o documento.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">Propostas e Contratos</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Histórico controlado de documentos vinculados a {company.name}.</p>
        </div>
        {!canCreate && <span className="rounded-full border border-line px-3 py-1 text-xs font-bold text-[var(--text-secondary)]">Somente leitura</span>}
      </div>

      {notice && <p className="mt-4 rounded-lg border border-line bg-ink/60 px-4 py-3 text-sm">{notice}</p>}

      {canCreate && (
        <section className="mt-4 rounded-xl border border-line bg-ink/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-black">Selecionar produtos/serviços</h3>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Nome, descrição, pagamento, forma, prazo e valor base vêm do cadastro oficial. Aqui só é possível ajustar preço aplicado, desconto e observações.</p>
              {documentGroupId && <p className="mt-2 rounded-lg border border-cyan/30 bg-cyan/10 px-3 py-2 text-xs font-semibold text-cyan">Nova versão vinculada ao documento atual. A versão anterior será preservada no histórico.</p>}
            </div>
            <select value={documentType} onChange={(event) => setDocumentType(event.target.value as "proposal" | "contract")} className="rounded-lg border border-line bg-panel px-3 py-2 text-sm">
              <option value="proposal">Proposta</option>
              {canEditContract && <option value="contract">Contrato</option>}
            </select>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Field label="Título do documento" value={title} onChange={setTitle} />
            <Field label="Validade" type="date" value={validUntil} onChange={setValidUntil} />
            <TextAreaField label="Observações comerciais para o cliente" value={customerNotes} onChange={setCustomerNotes} />
            <TextAreaField label="Observações internas da negociação" value={internalNotes} onChange={setInternalNotes} />
          </div>
          <div className="mt-4 space-y-3">
            {selectableCatalog.map((catalog) => {
              const state = selected[catalog.id];
              const base = catalogBasePrice(catalog);
              const applied = state ? decimalFromInput(state.appliedPrice) || base : base;
              const gross = applied * Number(state?.quantity || 1);
              const discount = state?.discountType === "percent" ? gross * (decimalFromInput(state.discountPercent) / 100) : state?.discountType === "amount" ? decimalFromInput(state.discountAmount) : 0;
              return (
                <article key={catalog.id} className="rounded-lg border border-line bg-panel p-3">
                  <label className="flex items-start gap-3">
                    <input type="checkbox" checked={Boolean(state)} onChange={(event) => toggleProduct(catalog, event.target.checked)} />
                    <span className="min-w-0">
                      <strong>{catalog.name}</strong>
                      <small className="mt-1 block text-[var(--text-secondary)]">{catalog.type === "service" ? "Serviço" : "Produto"} · {proposalUnitLabel(catalog.billing_unit || catalog.unit_measure)} · Valor base {money(base)}</small>
                      <small className="mt-1 block text-[var(--text-secondary)]">{catalog.description_short || "Sem descrição."}</small>
                      <small className="mt-1 block text-[var(--text-secondary)]">Condição: {catalog.payment_conditions || "Não informada"} · Forma: {catalog.payment_method || "Não informada"} · Prazo: {catalog.execution_time || (catalog.delivery_days ? `${catalog.delivery_days} dias` : "Não informado")}</small>
                    </span>
                  </label>
                  {state && (
                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      <Field label="Quantidade" type="number" value={String(state.quantity)} onChange={(value) => updateSelected(catalog.id, { quantity: Number(value || 1) })} />
                      <Field label="Valor aplicado" value={state.appliedPrice} onChange={(value) => updateSelected(catalog.id, { appliedPrice: value })} />
                      <SelectField label="Tipo de desconto" value={state.discountType} options={["none", "percent", "amount"]} labels={{ none: "Sem desconto", percent: "Percentual", amount: "Valor R$" }} onChange={(value) => updateSelected(catalog.id, { discountType: value as DocumentSelectionState["discountType"], discountPercent: "", discountAmount: "" })} />
                      {state.discountType === "percent" && <Field label="Desconto %" value={state.discountPercent} onChange={(value) => updateSelected(catalog.id, { discountPercent: value, discountAmount: "" })} />}
                      {state.discountType === "amount" && <Field label="Desconto R$" value={state.discountAmount} onChange={(value) => updateSelected(catalog.id, { discountAmount: value, discountPercent: "" })} />}
                      {state.discountType !== "none" && <Field label="Motivo do desconto" value={state.discountReason} onChange={(value) => updateSelected(catalog.id, { discountReason: value })} required />}
                      <Field label="Observação comercial do item" value={state.customerNote} onChange={(value) => updateSelected(catalog.id, { customerNote: value })} />
                      <Field label="Observação interna do item" value={state.internalNote} onChange={(value) => updateSelected(catalog.id, { internalNote: value })} />
                      <div className="rounded-lg border border-line bg-ink/70 p-3 text-sm">
                        <p>Original: <strong>{money(base * Number(state.quantity || 1))}</strong></p>
                        <p>Aplicado: <strong>{money(gross)}</strong></p>
                        <p>Desconto: <strong>{money(Math.min(discount, gross))}</strong></p>
                        <p>Final: <strong>{money(Math.max(0, gross - Math.min(discount, gross)))}</strong></p>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
            {!selectableCatalog.length && <p className="rounded-lg border border-dashed border-line p-5 text-center text-sm text-[var(--text-secondary)]">Nenhum produto/serviço ativo disponível para composição. Cadastre itens no catálogo oficial antes de gerar documentos.</p>}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-panel p-3 text-sm">
            <span>Original: <strong>{money(totals.original)}</strong></span>
            <span>Aplicado: <strong>{money(totals.applied)}</strong></span>
            <span>Desconto: <strong>{money(totals.discount)}</strong></span>
            <span>Total final: <strong>{money(totals.final)}</strong></span>
          </div>
          <button type="button" disabled={saving || !selectedRows.length} onClick={createControlledDocument} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-electric px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
            <FileText className="h-4 w-4" /> {saving ? "Gerando..." : documentType === "contract" ? "Gerar contrato PDF" : "Gerar proposta PDF"}
          </button>
        </section>
      )}

      {currentDocument && (
        <section className="mt-4 rounded-xl border border-cyan/40 bg-cyan/10 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-cyan">Documento atual em destaque</p>
              <h3 className="mt-1 text-lg font-black">{currentDocument.title}</h3>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{proposalDocumentType(currentDocument) === "contract" ? "Contrato" : "Proposta"} · {statusLabel(currentDocument.status)} · Versão {currentDocument.version || 1}</p>
            </div>
            <strong className="text-xl">{money(currentDocument.total)}</strong>
          </div>
          <div className="mt-4 grid gap-2 text-sm md:grid-cols-2 xl:grid-cols-4">
            <InfoLine label="Cliente vinculado" value={company.name} />
            <InfoLine label="Criado em" value={dateLabel(currentDocument.created_at)} />
            <InfoLine label="Última atualização" value={dateLabel(currentDocument.updated_at || currentDocument.created_at)} />
            <InfoLine label="Criado por" value={String(currentDocument.metadata?.created_by || currentDocument.metadata?.user_id || "Não informado")} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => downloadDocument(currentDocument)} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-bold"><Download className="h-4 w-4" /> Baixar PDF</button>
            <Link href="/app/proposals" className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-bold"><FileText className="h-4 w-4" /> Visualizar</Link>
            {canEdit(currentDocument) && <button type="button" onClick={() => { setDocumentType(proposalDocumentType(currentDocument)); setDocumentGroupId(String(currentDocument.metadata?.document_group_id || currentDocument.id)); setTitle(currentDocument.title); setNotice("Monte a nova versão selecionando novamente os produtos/serviços e ajustes permitidos."); }} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-bold"><Copy className="h-4 w-4" /> Nova versão</button>}
            {canEdit(currentDocument) && <Link href="/app/proposals" className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-bold"><Pencil className="h-4 w-4" /> Editar</Link>}
            {canDelete && <button type="button" onClick={() => removeDocument(currentDocument)} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-bold text-red-300"><Trash2 className="h-4 w-4" /> Excluir</button>}
          </div>
        </section>
      )}

      <div className="mt-5 space-y-3">
        {groups.map((group) => {
          const item = group.current;
          const isOpen = Boolean(expanded[group.id]);
          return (
            <article key={group.id} className="rounded-xl border border-line bg-ink/60 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-cyan">{group.documentType === "contract" ? "Contrato" : "Proposta"} · Versão atual</p>
                  <h3 className="mt-1 font-black">{item.title}</h3>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{statusLabel(item.status)} · {dateLabel(item.updated_at || item.created_at)} · {group.versions.length} versão(ões)</p>
                </div>
                <strong>{money(item.total)}</strong>
              </div>
              <div className="mt-3 grid gap-2 text-sm md:grid-cols-2 xl:grid-cols-3">
                <InfoLine label="Tipo" value={group.documentType === "contract" ? "Contrato" : "Proposta"} />
                <InfoLine label="Cliente" value={company.name} />
                <InfoLine label="Versão atual" value={String(item.version || group.versions.length)} />
                <InfoLine label="Criado em" value={dateLabel(item.created_at)} />
                <InfoLine label="Atualizado em" value={dateLabel(item.updated_at || item.created_at)} />
                <InfoLine label="Itens" value={`${item.items?.length || 0} item(ns) com snapshot`} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => downloadDocument(item)} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-bold"><Download className="h-4 w-4" /> Baixar PDF</button>
                <Link href="/app/proposals" className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-bold"><FileText className="h-4 w-4" /> Visualizar</Link>
                {canEdit(item) && <Link href="/app/proposals" className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-bold"><Pencil className="h-4 w-4" /> Editar</Link>}
                {canDelete && <button type="button" onClick={() => removeDocument(item)} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-bold text-red-300"><Trash2 className="h-4 w-4" /> Excluir</button>}
                <button type="button" onClick={() => setExpanded((current) => ({ ...current, [group.id]: !isOpen }))} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-bold">Histórico de versões</button>
              </div>
              {isOpen && (
                <div className="mt-4 space-y-2 rounded-lg border border-line bg-panel p-3">
                  {group.versions.map((version, index) => (
                    <div key={version.id} className="rounded-lg border border-line bg-ink/60 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <strong className="text-sm">Versão {proposalVersionNumber(version, group.versions.length - index - 1)}{version.id === item.id ? " · atual" : ""}</strong>
                        <button type="button" onClick={() => downloadDocument(version)} className="inline-flex items-center gap-2 rounded-lg border border-line px-2 py-1 text-xs font-bold"><Download className="h-3.5 w-3.5" /> PDF</button>
                      </div>
                      <div className="mt-2 grid gap-1 text-xs text-[var(--text-secondary)] md:grid-cols-2">
                        <span>Data/hora: {dateLabel(version.updated_at || version.created_at)}</span>
                        <span>Usuário: {String(version.metadata?.updated_by || version.metadata?.created_by || "Não informado")}</span>
                        <span>Tipo de alteração: {version.id === item.id ? "Versão atual" : "Versão anterior"}</span>
                        <span>Status: {statusLabel(version.status)}</span>
                        <span>Resumo: {version.items?.length || 0} item(ns), total {money(version.total)}</span>
                        <span>Motivo: {String(version.metadata?.change_reason || version.metadata?.delete_reason || "Não informado")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>
          );
        })}
        {!groups.length && <p className="rounded-lg border border-dashed border-line p-6 text-center text-sm text-[var(--text-secondary)]">Nenhuma proposta ou contrato vinculado.</p>}
      </div>
    </div>
  );
}

function AiSection({ company }: { company: Company }) {
  return <div><h2 className="text-xl font-black">IA / Editor</h2><p className="mt-3 text-sm text-[var(--text-secondary)]">Use os sinais comerciais da ficha para preparar abordagem, follow-up e observações controladas para {company.name}.</p></div>;
}

function ApolloSection({ company }: { company: Company }) {
  return (
    <div>
      <h2 className="text-xl font-black">Apollo/Econodata</h2>
      <div className="mt-4 space-y-3">
        {(company.decisionMakers || []).map((person, index) => (
          <article key={`${person.name}-${index}`} className="rounded-lg border border-line bg-ink/60 p-4">
            <h3 className="font-black">{person.name || "Decisor sem nome"}</h3>
            <p className="text-sm text-[var(--text-secondary)]">{person.title || "Cargo não informado"} · {person.source || "fonte não informada"}</p>
            {person.linkedin && <a href={person.linkedin} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm font-bold text-cyan">LinkedIn</a>}
          </article>
        ))}
        {(!company.decisionMakers || company.decisionMakers.length === 0) && <p className="rounded-lg border border-dashed border-line p-6 text-sm text-[var(--text-secondary)]">Nenhum decisor carregado para esta ficha.</p>}
      </div>
    </div>
  );
}
