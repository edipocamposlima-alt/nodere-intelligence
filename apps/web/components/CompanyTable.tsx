"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, Download, ExternalLink, FileText, MessageCircle, Save, Trash2 } from "lucide-react";
import { Company } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { addCompanyNote } from "@/lib/api";

const whatsappMessage =
  "Ola, tudo bem? Estive analisando a presenca digital da sua empresa no Google e identifiquei algumas oportunidades que podem ajudar voces a gerar mais contatos e melhorar o posicionamento online. Posso te mostrar rapidamente?";

function pdfEscape(value: string) {
  return value.replace(/[\\()]/g, "\\$&").replace(/[^\x20-\x7EÀ-ÿ]/g, " ");
}

function buildSimplePdf(title: string, body: string) {
  const lines = [title, "", ...body.split(/\r?\n/)].flatMap((line) => {
    const clean = line.trim();
    if (clean.length <= 86) return [clean];
    return clean.match(/.{1,86}(\s|$)/g)?.map((chunk) => chunk.trim()) ?? [clean];
  }).slice(0, 58);

  const text = lines.map((line, index) => `BT /F1 10 Tf 50 ${780 - index * 13} Td (${pdfEscape(line)}) Tj ET`).join("\n");
  const stream = `q\n${text}\nQ`;
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer << /Root 1 0 R /Size ${objects.length + 1} >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

export function CompanyTable({ companies }: { companies: Company[] }) {
  const [visibleCompanies, setVisibleCompanies] = useState(companies);
  const [saved, setSaved] = useState<Record<string, "saving" | "saved" | "error">>({});
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setVisibleCompanies(companies);
    setSelected({});
  }, [companies]);

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

  function exportPdf() {
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
    downloadBlob(buildSimplePdf("Relatorio NODERE", content), `relatorio-nodere-${Date.now()}.pdf`);
  }

  function downloadBlob(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-panel/90">
      <div className="flex flex-col gap-3 border-b border-line p-3 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-slate-400">
          {selectedCompanies.length ? `${selectedCompanies.length} selecionada(s)` : `${visibleCompanies.length} empresa(s) na lista`}
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={saveSelected} disabled={selectedCompanies.length === 0} className="inline-flex items-center gap-2 rounded-lg bg-electric px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
            <Save className="h-4 w-4" />Salvar selecionadas
          </button>
          <button onClick={ignoreSelected} disabled={selectedCompanies.length === 0} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-xs text-white disabled:opacity-50">
            <Trash2 className="h-4 w-4" />Ignorar
          </button>
          <button onClick={exportCsv} disabled={visibleCompanies.length === 0} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-xs text-white disabled:opacity-50">
            <Download className="h-4 w-4" />CSV
          </button>
          <button onClick={exportPdf} disabled={visibleCompanies.length === 0} className="inline-flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-amber-100 disabled:opacity-50">
            <FileText className="h-4 w-4" />PDF
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
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
              <tr key={company.id} className="hover:bg-white/[0.03]">
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={Boolean(selected[company.id])}
                    onChange={(event) => setSelected((current) => ({ ...current, [company.id]: event.target.checked }))}
                  />
                </td>
                <td className="px-4 py-4">
                  <Link href={`/companies/${company.id}`} className="font-medium text-white hover:text-cyan">
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
                      className="inline-flex items-center gap-2 rounded-lg bg-electric px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {saved[company.id] === "saved" ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                      {saved[company.id] === "saving" ? "Salvando" : saved[company.id] === "saved" ? "Salvo" : "Salvar lead"}
                    </button>
                    <Link href={`/companies/${company.id}`} className="inline-flex items-center gap-2 rounded-lg border border-line bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:border-electric">
                      <FileText className="h-4 w-4" />
                      Ficha
                    </Link>
                    {company.whatsapp && (
                      <a
                        href={`https://wa.me/${company.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappMessage)}`}
                        target="_blank"
                        className="rounded-lg border border-success/30 bg-success/10 p-2 text-emerald-200 hover:bg-success/20"
                        aria-label="Chamar no WhatsApp"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </a>
                    )}
                    {company.mapsUrl && (
                      <a target="_blank" href={company.mapsUrl} className="rounded-lg border border-line bg-white/5 p-2 text-slate-300 hover:text-white" aria-label="Abrir Google Maps">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
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
      </div>
    </div>
  );
}
