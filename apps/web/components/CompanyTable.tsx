"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, Download, ExternalLink, FileText, MessageCircle, Save, Search, Trash2, X } from "lucide-react";
import { Company } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { addCompanyNote, getCompanies, updateCompany } from "@/lib/api";
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
    company.website,
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

export function CompanyTable({ companies, initialQuery = "" }: { companies: Company[]; initialQuery?: string }) {
  const router = useRouter();
  const [baseCompanies, setBaseCompanies] = useState(companies);
  const [visibleCompanies, setVisibleCompanies] = useState(companies);
  const [query, setQuery] = useState(initialQuery);
  const [loadingCompanies, setLoadingCompanies] = useState(companies.length === 0);
  const [loadError, setLoadError] = useState("");
  const [saved, setSaved] = useState<Record<string, "saving" | "saved" | "error">>({});
  const [messages, setMessages] = useState<Record<string, string>>({});
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
      await addCompanyNote(company.id, `Lead salvo no CRM a partir da busca em ${new Date().toLocaleString("pt-BR")}.`);
      const stored = JSON.parse(localStorage.getItem("nodere_saved_leads") || "[]") as string[];
      localStorage.setItem("nodere_saved_leads", JSON.stringify(Array.from(new Set([...stored, company.id]))));
      setSaved((current) => ({ ...current, [company.id]: "saved" }));
      setMessages((current) => ({ ...current, [company.id]: "Lead salvo com sucesso." }));
      setVisibleCompanies((items) => items.filter((item) => item.id !== company.id));
    } catch (error) {
      setSaved((current) => ({ ...current, [company.id]: "error" }));
      setMessages((current) => ({
        ...current,
        [company.id]: error instanceof Error ? error.message : "Não foi possível salvar o lead."
      }));
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
    const rows = (selectedCompanies.length ? selectedCompanies : visibleCompanies).map((company) => ({
      empresa: company.name,
      cidade: company.city,
      estado: company.state,
      segmento: company.category,
      telefone: company.phone ?? "",
      site: company.website ?? "",
      avaliacao: company.rating ?? "",
      avaliacoes: company.reviewCount ?? "",
      score: company.score,
      maps: company.mapsUrl ?? ""
    }));
    const header = Object.keys(rows[0] ?? { empresa: "", cidade: "", estado: "" });
    const csv = [header.join(";"), ...rows.map((row) => header.map((key) => `"${String((row as any)[key] ?? "").replace(/"/g, '""')}"`).join(";"))].join("\n");
    downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), `nodere-empresas-${Date.now()}.csv`);
  }

  async function exportPdf() {
    const list = (selectedCompanies.length ? selectedCompanies : visibleCompanies).slice(0, 50);
    const content = [
      "NODERE Intelligence",
      `Relatorio de empresas - ${new Date().toLocaleString("pt-BR")}`,
      "",
      ...list.flatMap((company, index) => [
        `${index + 1}. ${company.name}`,
        `Segmento: ${company.category} | ${company.city}/${company.state}`,
        `Score: ${company.score} | Avaliacao: ${company.rating ?? "-"} (${company.reviewCount ?? 0})`,
        `Falha principal: ${company.detectedOpportunities[0] ?? "Sem alerta critico"}`,
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

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-panel/90">
      <div className="flex flex-col gap-3 border-b border-line p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-line bg-ink px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-cyan" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filtrar empresas salvas por nome, cidade, segmento, telefone, site ou observação..."
              className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
            />
            {query && (
              <button type="button" onClick={clearSearch} className="rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Limpar busca">
                <X className="h-4 w-4" />
              </button>
            )}
          </label>
          <div className="text-sm text-slate-400">
            {selectedCompanies.length ? `${selectedCompanies.length} selecionada(s)` : `${visibleCompanies.length} de ${baseCompanies.length} empresa(s)`}
          </div>
        </div>
        {(loadingCompanies || loadError) && (
          <div className={`rounded-md border px-3 py-2 text-xs ${loadError ? "border-red-400/40 bg-red-500/10 text-red-100" : "border-cyan/30 bg-cyan/10 text-cyan"}`}>
            {loadError || "Carregando empresas salvas do backend..."}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <button onClick={saveSelected} disabled={selectedCompanies.length === 0} className="btn-primary px-3 py-2 text-xs">
            <Save className="h-4 w-4" />Salvar selecionadas
          </button>
          <button onClick={ignoreSelected} disabled={selectedCompanies.length === 0} className="btn-secondary px-3 py-2 text-xs">
            <Trash2 className="h-4 w-4" />Ignorar
          </button>
          <button onClick={exportCsv} disabled={visibleCompanies.length === 0} className="btn-secondary px-3 py-2 text-xs">
            <Download className="h-4 w-4" />CSV
          </button>
          <button onClick={exportPdf} disabled={visibleCompanies.length === 0} className="btn-primary px-3 py-2 text-xs">
            <FileText className="h-4 w-4" />PDF
          </button>
          <button
            type="button"
            onClick={() => setInvalidWhatsappOnly((value) => !value)}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${invalidWhatsappOnly ? "bg-warning text-ink" : "border border-warning/40 bg-warning/10 text-amber-100 hover:bg-warning/20"}`}
          >
            Mostrar apenas leads com WhatsApp inválido
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
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
        <table className="w-full min-w-[840px] border-collapse text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    setSelected(Object.fromEntries(visibleCompanies.map((company) => [company.id, checked])));
                  }}
                />
              </th>
              <th className="px-4 py-3">Empresa</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Avaliação</th>
              <th className="px-4 py-3">Falhas detectadas</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {visibleCompanies.map((company) => (
              <tr id={`result-${company.id}`} key={company.id} className="scroll-mt-28 hover:bg-white/[0.03]">
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={Boolean(selected[company.id])}
                    onChange={(event) => setSelected((current) => ({ ...current, [company.id]: event.target.checked }))}
                  />
                </td>
                <td className="px-4 py-4">
                  <Link href={`/companies/${encodeURIComponent(company.id)}`} className="font-medium text-white hover:text-cyan">
                    {company.name}
                  </Link>
                  <p className="mt-1 text-xs text-slate-500">
                    {company.category} · {company.city}/{company.state}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-white">{company.score}</span>
                    <StatusBadge value={company.opportunityLevel} />
                  </div>
                </td>
                <td className="px-4 py-4 text-slate-300">
                  {company.rating ?? "-"} · {company.reviewCount ?? 0} avaliações
                </td>
                <td className="px-4 py-4 text-slate-400">{company.detectedOpportunities[0] ?? "Sem alerta critico"}</td>
                <td className="px-4 py-4">
                  <StatusBadge value={company.status} />
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => saveLead(company)}
                      disabled={saved[company.id] === "saving" || saved[company.id] === "saved"}
                      className="btn-primary px-3 py-2 text-xs"
                    >
                      {saved[company.id] === "saved" ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                      {saved[company.id] === "saving" ? "Salvando" : saved[company.id] === "saved" ? "Salvo" : "Salvar lead"}
                    </button>
                    <Link href={`/companies/${encodeURIComponent(company.id)}`} className="inline-flex items-center gap-2 rounded-lg border border-line bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:border-electric">
                      <FileText className="h-4 w-4" />
                      Ficha
                    </Link>
                    {isValidBrazilMobileWhatsapp(company.whatsapp) && (
                      <a
                        href={`https://wa.me/${company.whatsapp!.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappMessage)}`}
                        target="_blank"
                        className="rounded-lg border border-success/30 bg-success/10 p-2 text-emerald-200 hover:bg-success/20"
                        aria-label="Chamar no WhatsApp"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </a>
                    )}
                    {company.whatsapp && !isValidBrazilMobileWhatsapp(company.whatsapp) && (
                      <button
                        type="button"
                        className="rounded-lg border border-warning/30 bg-warning/10 px-2 py-2 text-[11px] text-amber-100 transition hover:bg-warning/20"
                        title="Clique para corrigir"
                        onClick={() => {
                          setEditingWhatsapp((current) => ({ ...current, [company.id]: true }));
                          setWhatsappDrafts((current) => ({ ...current, [company.id]: company.whatsapp ?? "" }));
                        }}
                      >
                        WhatsApp inválido — clique para corrigir
                      </button>
                    )}
                    {company.mapsUrl && (
                      <a target="_blank" href={company.mapsUrl} className="rounded-lg border border-line bg-white/5 p-2 text-slate-300 hover:text-white" aria-label="Abrir Google Maps">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                  {editingWhatsapp[company.id] && (
                    <div className="mt-2 flex flex-wrap gap-2">
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
                    <p className={`mt-2 text-xs ${saved[company.id] === "error" ? "text-red-300" : "text-emerald-300"}`}>
                      {messages[company.id]}
                    </p>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
}
