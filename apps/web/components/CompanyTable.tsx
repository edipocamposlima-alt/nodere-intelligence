"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bot, CheckCircle2, Download, ExternalLink, FileText, MessageCircle, PhoneCall, Save, Search, Trash2, X } from "lucide-react";
import { Company } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { ApiRequestError, generateAiCallScript, generateAiDiagnosis, generateAiWhatsappMessage, getCompanies, saveSearchResultAsLead, updateCompany } from "@/lib/api";
import { downloadNoderePdf } from "@/lib/pdf";

const whatsappMessage =
  "Ola, tudo bem? Estive analisando a presenca digital da sua empresa no Google e identifiquei algumas oportunidades que podem ajudar voces a gerar mais contatos e melhorar o posicionamento online. Posso te mostrar rapidamente?";

function isValidBrazilMobileWhatsapp(value?: string) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return false;
  const local = digits.startsWith("55") ? digits.slice(2) : digits;
  return local.length === 11 && local[2] === "9";
}

function hasInvalidWhatsapp(company: Company) {
  return Boolean(company.whatsapp) && !isValidBrazilMobileWhatsapp(company.whatsapp);
}

function valueOrNotLocated(value: unknown) {
  if (value === 0) return "0";
  const clean = String(value ?? "").trim();
  return clean || "Não localizado";
}

function companyEmail(company: Company) {
  return valueOrNotLocated(company.emailPrincipal || company.email || (company as any).email_principal);
}

function companySummary(company: Company) {
  const existing = valueOrNotLocated(company.businessSummary || company.resumoSobreEmpresa || (company as any).resumo_sobre_empresa || (company as any).resumo);
  if (existing !== "Não localizado") return existing;
  const signals = [
    company.website ? "site localizado" : "site não localizado",
    company.phone ? "telefone localizado" : "telefone não localizado",
    company.mapsUrl ? "Google Maps localizado" : "Google Maps não localizado",
    company.rating ? `avaliação ${company.rating}${company.reviewCount ? ` com ${company.reviewCount} avaliações` : ""}` : "avaliação não localizada"
  ];
  return `${company.name || "Empresa"} em ${valueOrNotLocated(company.city)}/${valueOrNotLocated(company.state)} no segmento ${valueOrNotLocated(company.category)}. Sinais comerciais: ${signals.join(", ")}.`;
}

function exportRow(company: Company) {
  return {
    segmento: valueOrNotLocated(company.category),
    empresa: valueOrNotLocated(company.name),
    cidade: valueOrNotLocated(company.city),
    estado: valueOrNotLocated(company.state),
    CNPJ: valueOrNotLocated(company.cnpj),
    telefone: valueOrNotLocated(company.phone),
    email: companyEmail(company),
    site: valueOrNotLocated(company.website),
    avaliacao: valueOrNotLocated(company.rating),
    avaliacoes: valueOrNotLocated(company.reviewCount),
    score: valueOrNotLocated(company.nodereScore ?? company.score),
    maps: valueOrNotLocated(company.mapsUrl),
    resumo_sobre_a_empresa: companySummary(company)
  };
}

function normalizeSearch(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function companyMatchesQuery(company: Company, query: string) {
  if (!query) return true;
  const haystack = [
    company.name,
    company.category,
    company.city,
    company.state,
    company.address,
    company.phone,
    company.whatsapp,
    company.cnpj,
    company.email,
    company.emailPrincipal,
    company.website,
    company.mapsUrl,
    companySummary(company),
    company.linkedin,
    company.instagram,
    company.facebook,
    company.status,
    company.opportunityLevel,
    ...(company.detectedOpportunities ?? []),
    ...(company.suggestions ?? []),
    ...(company.notes ?? []).map((note) => note.body)
  ].map(normalizeSearch).join(" ");
  return normalizeSearch(query).split(/\s+/).every((term) => haystack.includes(term));
}

export function CompanyTable({ companies, initialQuery = "", embedded = false }: { companies: Company[]; initialQuery?: string; embedded?: boolean }) {
  const router = useRouter();
  const [baseCompanies, setBaseCompanies] = useState(companies);
  const [visibleCompanies, setVisibleCompanies] = useState(companies);
  const [query, setQuery] = useState(initialQuery);
  const [loadingCompanies, setLoadingCompanies] = useState(companies.length === 0);
  const [loadError, setLoadError] = useState("");
  const [saved, setSaved] = useState<Record<string, "saving" | "saved" | "error">>({});
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [aiMessages, setAiMessages] = useState<Record<string, string>>({});
  const [aiLoading, setAiLoading] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [invalidWhatsappOnly, setInvalidWhatsappOnly] = useState(false);
  const [editingWhatsapp, setEditingWhatsapp] = useState<Record<string, boolean>>({});
  const [whatsappDrafts, setWhatsappDrafts] = useState<Record<string, string>>({});
  const [whatsappErrors, setWhatsappErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setBaseCompanies(companies);
  }, [companies]);

  useEffect(() => {
    let cancelled = false;
    async function loadCompaniesFromBrowser() {
      if (baseCompanies.length > 0) {
        setLoadingCompanies(false);
        return;
      }
      setLoadingCompanies(true);
      setLoadError("");
      try {
        const loaded = await getCompanies();
        if (!cancelled) setBaseCompanies(loaded);
      } catch (error) {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : "Não foi possível carregar empresas.");
      } finally {
        if (!cancelled) setLoadingCompanies(false);
      }
    }
    void loadCompaniesFromBrowser();
    return () => {
      cancelled = true;
    };
  }, [baseCompanies.length]);

  useEffect(() => {
    setVisibleCompanies(baseCompanies.filter((company) => companyMatchesQuery(company, query) && (!invalidWhatsappOnly || hasInvalidWhatsapp(company))));
    setSelected({});
  }, [baseCompanies, query, invalidWhatsappOnly]);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const selectedCompanies = visibleCompanies.filter((company) => selected[company.id]);
  const allSelected = visibleCompanies.length > 0 && selectedCompanies.length === visibleCompanies.length;

  async function saveLead(company: Company) {
    setSaved((current) => ({ ...current, [company.id]: "saving" }));
    try {
      const savedLead = await saveSearchResultAsLead(company);
      const stored = JSON.parse(localStorage.getItem("nodere_saved_leads") || "[]") as string[];
      localStorage.setItem("nodere_saved_leads", JSON.stringify(Array.from(new Set([...stored, company.id, savedLead.company.id]))));
      setSaved((current) => ({ ...current, [company.id]: "saved" }));
      setMessages((current) => ({ ...current, [company.id]: "Lead salvo com sucesso." }));
      setVisibleCompanies((items) => items.filter((item) => item.id !== company.id));
    } catch (error) {
      setSaved((current) => ({ ...current, [company.id]: "error" }));
      const isDuplicate = error instanceof ApiRequestError && error.status === 409;
      setMessages((current) => ({
        ...current,
        [company.id]: isDuplicate ? "Lead já consta no banco de dados NODERE." : error instanceof Error ? error.message : "Não foi possível salvar o lead."
      }));
      if (isDuplicate) setVisibleCompanies((items) => items.filter((item) => item.id !== company.id));
    }
  }

  async function saveSelected() {
    for (const company of selectedCompanies) {
      await saveLead(company);
    }
    setSelected({});
  }

  function ignoreSelected() {
    const selectedIds = new Set(selectedCompanies.map((company) => company.id));
    setVisibleCompanies((items) => items.filter((company) => !selectedIds.has(company.id)));
    setSelected({});
  }

  function exportCsv() {
    const rows = (selectedCompanies.length ? selectedCompanies : visibleCompanies).map(exportRow);
    const header = ["segmento", "empresa", "cidade", "estado", "CNPJ", "telefone", "email", "site", "avaliacao", "avaliacoes", "score", "maps", "resumo_sobre_a_empresa"];
    const csv = [
      header.join(";"),
      ...rows.map((row) => header.map((key) => `"${String((row as any)[key] ?? "").replace(/"/g, '""')}"`).join(";"))
    ].join("\r\n");
    downloadBlob(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }), `nodere-empresas-${Date.now()}.csv`);
  }

  async function exportPdf() {
    const list = (selectedCompanies.length ? selectedCompanies : visibleCompanies).slice(0, 50);
    const content = [
      "NODERE",
      `Relatorio de empresas - ${new Date().toLocaleString("pt-BR")}`,
      `Filtros aplicados: ${query || "sem filtro local"} | Empresas exportadas: ${list.length}`,
      "",
      ...list.flatMap((company, index) => [
        `${index + 1}. ${company.name}`,
        `Segmento: ${valueOrNotLocated(company.category)}`,
        `Cidade/Estado: ${valueOrNotLocated(company.city)}/${valueOrNotLocated(company.state)}`,
        `CNPJ: ${valueOrNotLocated(company.cnpj)}`,
        `Telefone: ${valueOrNotLocated(company.phone)} | E-mail: ${companyEmail(company)}`,
        `Site: ${valueOrNotLocated(company.website)}`,
        `Avaliacao: ${valueOrNotLocated(company.rating)} | Avaliacoes: ${valueOrNotLocated(company.reviewCount)} | Score: ${valueOrNotLocated(company.nodereScore ?? company.score)}`,
        `Maps: ${valueOrNotLocated(company.mapsUrl)}`,
        `Resumo: ${companySummary(company)}`,
        ""
      ])
    ].join("\n");
    await downloadNoderePdf({
      title: "Relatório NODERE",
      subtitle: `Empresas exportadas em ${new Date().toLocaleString("pt-BR")}`,
      body: content,
      fileName: `relatorio-nodere-${Date.now()}.pdf`
    });
  }

  function downloadBlob(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  function clearSearch() {
    setQuery("");
    router.push("/companies");
  }

  async function saveWhatsapp(company: Company) {
    const draft = whatsappDrafts[company.id] ?? company.whatsapp ?? "";
    if (!isValidBrazilMobileWhatsapp(draft)) {
      setWhatsappErrors((current) => ({
        ...current,
        [company.id]: "Número inválido. Celulares brasileiros têm 11 dígitos e o 3º dígito deve ser 9."
      }));
      return;
    }
    setWhatsappErrors((current) => ({ ...current, [company.id]: "" }));
    try {
      const updated = await updateCompany(company.id, { whatsapp: draft });
      setBaseCompanies((items) => items.map((item) => item.id === company.id ? { ...item, ...updated, whatsapp: draft } : item));
      setEditingWhatsapp((current) => ({ ...current, [company.id]: false }));
      setMessages((current) => ({ ...current, [company.id]: "WhatsApp corrigido." }));
    } catch (error) {
      setWhatsappErrors((current) => ({
        ...current,
        [company.id]: error instanceof Error ? error.message : "Não foi possível salvar o WhatsApp."
      }));
    }
  }

  async function runAi(company: Company, kind: "diagnosis" | "whatsapp" | "call") {
    setAiLoading((current) => ({ ...current, [company.id]: kind }));
    setAiMessages((current) => ({ ...current, [company.id]: "" }));
    try {
      const payload = { lead_id: company.id, company_data: company };
      let text = "";
      if (kind === "diagnosis") {
        text = (await generateAiDiagnosis(payload)).diagnosis;
      } else if (kind === "whatsapp") {
        text = (await generateAiWhatsappMessage({ ...payload, approach_type: "first_contact" })).message;
      } else {
        text = (await generateAiCallScript(payload)).script;
      }
      setAiMessages((current) => ({ ...current, [company.id]: text }));
    } catch (error) {
      setAiMessages((current) => ({ ...current, [company.id]: error instanceof Error ? error.message : "IA indisponível no momento." }));
    } finally {
      setAiLoading((current) => {
        const next = { ...current };
        delete next[company.id];
        return next;
      });
    }
  }

  function renderCompanyActions(company: Company, compact = false) {
    const iconButtonClass = "nodere-company-action-icon";
    return (
      <div className={compact ? "space-y-3" : "space-y-2"}>
        <div className="grid grid-cols-2 gap-2 xl:grid-cols-1">
          <button
            onClick={() => saveLead(company)}
            disabled={saved[company.id] === "saving" || saved[company.id] === "saved"}
            className="btn-primary min-h-9 justify-center px-3 py-2 text-xs"
          >
            {saved[company.id] === "saved" ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved[company.id] === "saving" ? "Salvando" : saved[company.id] === "saved" ? "Salvo" : "Salvar lead"}
          </button>
          <Link href={`/companies/${encodeURIComponent(company.id)}`} className="nodere-company-action-primary">
            <FileText className="h-4 w-4" />
            Ficha
          </Link>
        </div>

        <div className="nodere-company-action-strip">
          {isValidBrazilMobileWhatsapp(company.whatsapp) && (
            <a
              href={`https://wa.me/${company.whatsapp!.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappMessage)}`}
              target="_blank"
              className="nodere-company-action-icon nodere-company-action-icon--success"
              aria-label="Chamar no WhatsApp"
              title="Chamar no WhatsApp"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
          )}
          {company.phone && (
            <a href={`tel:${String(company.phone).replace(/[^\d+]/g, "")}`} className={iconButtonClass} aria-label="Ligar para empresa" title="Ligar para empresa">
              <PhoneCall className="h-4 w-4" />
            </a>
          )}
          {company.website && (
            <a target="_blank" href={company.website} className={iconButtonClass} aria-label="Abrir site" title="Abrir site">
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          {company.mapsUrl && (
            <a target="_blank" href={company.mapsUrl} className={iconButtonClass} aria-label="Abrir Google Maps" title="Abrir Google Maps">
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          <button type="button" onClick={() => void runAi(company, "diagnosis")} className="nodere-company-action-icon nodere-company-action-icon--info" aria-label="Gerar diagnóstico IA" title="Gerar diagnóstico IA">
            <Bot className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => void runAi(company, "whatsapp")} className="nodere-company-action-icon nodere-company-action-icon--success" aria-label="Gerar WhatsApp IA" title="Gerar WhatsApp IA">
            <MessageCircle className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => void runAi(company, "call")} className="nodere-company-action-icon nodere-company-action-icon--accent" aria-label="Gerar roteiro de ligação" title="Gerar roteiro de ligação">
            <PhoneCall className="h-4 w-4" />
          </button>
        </div>

        {company.whatsapp && !isValidBrazilMobileWhatsapp(company.whatsapp) && (
          <button
            type="button"
            className="w-full rounded-lg border border-warning/30 bg-warning/10 px-2 py-2 text-left text-[11px] text-amber-100 transition hover:bg-warning/20"
            title="Clique para corrigir"
            onClick={() => {
              setEditingWhatsapp((current) => ({ ...current, [company.id]: true }));
              setWhatsappDrafts((current) => ({ ...current, [company.id]: company.whatsapp ?? "" }));
            }}
          >
            WhatsApp inválido — clique para corrigir
          </button>
        )}

        {aiLoading[company.id] && <p className="text-xs text-cyan">Gerando IA comercial...</p>}
        {aiMessages[company.id] && (
          <div className="max-w-xl whitespace-pre-wrap rounded-lg border border-cyan/25 bg-cyan/10 p-3 text-xs leading-5 text-[var(--text-primary)]">
            {aiMessages[company.id]}
          </div>
        )}
        {editingWhatsapp[company.id] && (
          <div className="flex flex-wrap gap-2">
            <input
              value={whatsappDrafts[company.id] ?? ""}
              onChange={(event) => setWhatsappDrafts((current) => ({ ...current, [company.id]: event.target.value }))}
              placeholder="(XX) 9XXXX-XXXX"
              className="min-w-[180px] flex-1 rounded-lg border border-line bg-ink px-3 py-2 text-xs text-white outline-none focus:border-electric"
            />
            <button type="button" onClick={() => void saveWhatsapp(company)} className="btn-action px-3 py-2 text-xs">Salvar</button>
            <button type="button" onClick={() => setEditingWhatsapp((current) => ({ ...current, [company.id]: false }))} className="btn-secondary px-3 py-2 text-xs">Cancelar</button>
            {whatsappErrors[company.id] && <p className="w-full text-xs text-red-300">{whatsappErrors[company.id]}</p>}
          </div>
        )}
        {messages[company.id] && (
          <p className={`text-xs ${saved[company.id] === "error" ? "text-red-300" : "text-emerald-300"}`}>
            {messages[company.id]}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={embedded ? "overflow-hidden bg-panel/90" : "overflow-hidden rounded-lg border border-line bg-panel/90"}>
      <div className="flex flex-col gap-3 border-b border-line p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-line bg-ink px-3 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-cyan" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filtrar resultados por nome, cidade, segmento, telefone, site ou observação..."
              className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
            />
            {query && (
              <button type="button" onClick={clearSearch} className="rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Limpar busca">
                <X className="h-4 w-4" />
              </button>
            )}
          </label>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="nodere-status-badge" data-tone="progress">
              <span className="nodere-status-dot" aria-hidden="true" />
              {visibleCompanies.length} visível(is)
            </span>
            <span className="nodere-status-badge" data-tone={selectedCompanies.length ? "good" : "neutral"}>
              <span className="nodere-status-dot" aria-hidden="true" />
              {selectedCompanies.length} selecionada(s)
            </span>
          </div>
        </div>
        {(loadingCompanies || loadError) && (
          <div className={`rounded-md border px-3 py-2 text-xs ${loadError ? "border-red-400/40 bg-red-500/10 text-red-100" : "border-cyan/30 bg-cyan/10 text-cyan"}`}>
            {loadError || "Carregando empresas salvas do backend..."}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-bold uppercase tracking-wide text-slate-500">Ações em massa</span>
          <label className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-line bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(event) => {
                const checked = event.target.checked;
                setSelected(Object.fromEntries(visibleCompanies.map((company) => [company.id, checked])));
              }}
              disabled={visibleCompanies.length === 0}
              className="h-4 w-4"
            />
            Selecionar visíveis
          </label>
          <button onClick={saveSelected} disabled={selectedCompanies.length === 0} className="btn-primary min-h-9 px-3 py-2 text-xs">
            <Save className="h-4 w-4" />Salvar selecionadas
          </button>
          <button onClick={ignoreSelected} disabled={selectedCompanies.length === 0} className="btn-secondary min-h-9 px-3 py-2 text-xs">
            <Trash2 className="h-4 w-4" />Ignorar
          </button>
          <button onClick={exportCsv} disabled={visibleCompanies.length === 0} className="btn-secondary min-h-9 px-3 py-2 text-xs">
            <Download className="h-4 w-4" />CSV
          </button>
          <button onClick={exportPdf} disabled={visibleCompanies.length === 0} className="btn-primary min-h-9 px-3 py-2 text-xs">
            <FileText className="h-4 w-4" />PDF
          </button>
          <button
            type="button"
            onClick={() => setInvalidWhatsappOnly((value) => !value)}
            className={`min-h-9 rounded-lg px-3 py-2 text-xs font-semibold transition ${invalidWhatsappOnly ? "bg-warning text-ink" : "border border-warning/40 bg-warning/10 text-amber-100 hover:bg-warning/20"}`}
          >
            Mostrar apenas leads com WhatsApp inválido
          </button>
        </div>
      </div>
      <div className="bg-ink/20">
        {visibleCompanies.length === 0 ? (
          <div className="p-8 text-center">
            <Search className="mx-auto h-9 w-9 text-slate-600" />
            <p className="mt-3 text-sm font-medium text-white">
              {query ? "Nenhuma empresa encontrada com esse filtro." : "Nenhuma empresa salva ainda."}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {query ? "Tente buscar por outro nome, cidade, telefone ou segmento." : "Use a aba Busca de empresas para consultar o Google e salvar leads no CRM."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 p-3 sm:p-4 xl:grid-cols-2">
            {visibleCompanies.map((company) => {
              const score = company.nodereScore ?? company.score * 10;
              const gaps = (company.digitalGaps?.length ? company.digitalGaps : company.detectedOpportunities.slice(0, 3)).slice(0, 4);
              return (
                <article id={`result-${company.id}`} key={company.id} className="scroll-mt-28 rounded-lg border border-line bg-panel/95 p-4 shadow-lg shadow-black/10">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 shrink-0"
                        checked={Boolean(selected[company.id])}
                        onChange={(event) => setSelected((current) => ({ ...current, [company.id]: event.target.checked }))}
                        aria-label={`Selecionar ${company.name}`}
                      />
                      <div className="min-w-0">
                        <Link href={`/companies/${encodeURIComponent(company.id)}`} className="line-clamp-2 text-base font-black text-white hover:text-cyan" title={company.name}>
                          {company.name}
                        </Link>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-400" title={valueOrNotLocated(company.category)}>
                          {valueOrNotLocated(company.category)}
                        </p>
                        <p className="mt-2 break-words text-[11px] text-slate-500">CNPJ: {valueOrNotLocated(company.cnpj)}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <StatusBadge value={company.status} />
                      <StatusBadge value={company.nodereClassification || company.opportunityLevel} />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 text-xs text-slate-300 md:grid-cols-2">
                    <section className="rounded-lg border border-line bg-ink/60 p-3">
                      <p className="font-bold text-slate-200">Localização</p>
                      <p className="mt-1 break-words">{valueOrNotLocated(company.city)}/{valueOrNotLocated(company.state)}</p>
                      <p className="mt-1 line-clamp-3 break-words text-slate-500" title={valueOrNotLocated(company.address)}>
                        {valueOrNotLocated(company.address)}
                      </p>
                    </section>

                    <section className="rounded-lg border border-line bg-ink/60 p-3">
                      <p className="font-bold text-slate-200">Contato e links</p>
                      <p className="mt-1 break-words">Telefone: {valueOrNotLocated(company.phone)}</p>
                      <p className="break-words" title={companyEmail(company)}>E-mail: {companyEmail(company)}</p>
                      <p className="break-words" title={valueOrNotLocated(company.website)}>Site: {valueOrNotLocated(company.website)}</p>
                      <p className="break-words" title={valueOrNotLocated(company.mapsUrl)}>Maps: {valueOrNotLocated(company.mapsUrl)}</p>
                    </section>

                    <section className="rounded-lg border border-line bg-ink/60 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <span className="text-xl font-black text-white">{score}</span>
                          <span className="text-xs text-slate-500">/1000</span>
                          <p className="text-[11px] text-slate-500">Legado {company.score}/100</p>
                        </div>
                        <div className="text-right text-slate-400">
                          <p className="font-bold text-slate-200">Avaliação</p>
                          <p>{valueOrNotLocated(company.rating)} · {valueOrNotLocated(company.reviewCount)} avaliações</p>
                        </div>
                      </div>
                    </section>

                    <section className="rounded-lg border border-line bg-ink/60 p-3">
                      <p className="font-bold text-slate-200">Alertas e oportunidades</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {gaps.length ? gaps.map((gap) => (
                          <span key={gap} className="nodere-status-badge text-[11px]" data-tone="moderate" title="Necessita análise">
                            <span className="nodere-status-dot" aria-hidden="true" />
                            {gap}
                          </span>
                        )) : <span className="text-slate-500">Sem alerta crítico</span>}
                      </div>
                    </section>
                  </div>

                  <section className="mt-3 rounded-lg border border-line bg-ink/60 p-3 text-xs">
                    <p className="font-bold text-slate-200">Resumo sobre a empresa</p>
                    <p className="mt-1 line-clamp-4 break-words leading-5 text-slate-300" title={companySummary(company)}>
                      {companySummary(company)}
                    </p>
                  </section>

                  <section className="nodere-company-actions-panel mt-4 rounded-lg p-3">
                    {renderCompanyActions(company, true)}
                  </section>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
