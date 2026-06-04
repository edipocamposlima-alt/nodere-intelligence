"use client";

import { FormEvent, useMemo, useState } from "react";
import { Download, FileSpreadsheet, UploadCloud } from "lucide-react";
import { getBackendRootUrl } from "@/lib/apiBase";
import { importCompaniesCsv, importCompaniesFile } from "@/lib/api";

const sample = "name;razao_social;cnpj;phone;whatsapp;email_principal;website;city;state;segment;notes\nEmpresa Exemplo;Empresa Exemplo Ltda;00.000.000/0001-00;(54) 3333-3333;(54) 99999-9999;contato@empresa.com.br;https://empresa.com.br;Caxias do Sul;RS;Clínicas e Saúde;Lead importado";
const API_ROOT = getBackendRootUrl();
const importFields = ["name", "razao_social", "cnpj", "phone", "whatsapp", "email_principal", "website", "city", "state", "segment", "notes"];

export function CsvImportPanel() {
  const [csv, setCsv] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [preview, setPreview] = useState<string[][]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Array<{ row: number; reason: string }>>([]);
  const [loading, setLoading] = useState(false);

  const detectedRows = useMemo(() => preview.length + (headers.length ? 1 : 0), [headers.length, preview.length]);

  async function chooseFile(nextFile?: File | null) {
    setFile(nextFile || null);
    setHeaders([]);
    setPreview([]);
    setColumnMap({});
    setMessage("");
    setErrors([]);
    if (!nextFile) return;
    const isSpreadsheet = /\.(xlsx|xls)$/i.test(nextFile.name);
    if (isSpreadsheet) {
      setMessage("Arquivo XLSX selecionado. A prévia será validada no backend durante a importação.");
      setStep(2);
      return;
    }
    const text = await nextFile.text();
    const rows = parsePreview(text);
    setHeaders(rows[0] || []);
    setPreview(rows.slice(1, 4));
    setColumnMap(autoMap(rows[0] || []));
    setStep(2);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const result = file ? await importCompaniesFile(file, columnMap) : await importCompaniesCsv(csv, columnMap);
      setMessage(`${result.imported} importado(s), ${result.duplicates} duplicado(s), ${result.errors.length} erro(s).`);
      setErrors(result.errors);
      setCsv("");
      setFile(null);
      setStep(3);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao importar CSV.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-line bg-panel/90 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <FileSpreadsheet className="h-4 w-4 text-emerald-300" />
          Importar empresas por CSV/XLSX
        </div>
        <div className="flex flex-wrap gap-3">
          <a href={`${API_ROOT}/api/companies/import/template`} target="_blank" className="inline-flex items-center gap-1 text-xs font-semibold text-cyan hover:text-white">
            <Download className="h-3.5 w-3.5" />
            Baixar modelo
          </a>
          <button type="button" onClick={() => { setCsv(sample); setFile(null); setStep(2); const rows = parsePreview(sample); setHeaders(rows[0] || []); setPreview(rows.slice(1, 4)); setColumnMap(autoMap(rows[0] || [])); }} className="text-xs font-semibold text-cyan hover:text-white">
            Colar modelo
          </button>
        </div>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-400">
        Aceita CSV com vírgula/ponto e vírgula ou XLSX. O backend valida email, normaliza telefone/CNPJ, evita duplicidade por CNPJ ou nome+cidade e grava no Supabase.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${step === item ? "border-cyan bg-cyan/10 text-cyan" : "border-line bg-ink text-slate-400"}`}>
            Etapa {item}: {item === 1 ? "Upload" : item === 2 ? "Mapeamento" : "Resultado"}
          </div>
        ))}
      </div>

      <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-cyan/40 bg-cyan/5 p-6 text-center hover:bg-cyan/10">
        <UploadCloud className="h-8 w-8 text-cyan" />
        <span className="mt-2 text-sm font-semibold text-white">{file ? file.name : "Clique para selecionar CSV ou XLSX"}</span>
        <span className="mt-1 text-xs text-slate-400">{file ? `${Math.max(1, Math.round(file.size / 1024))} KB` : "Também é possível colar CSV no campo abaixo."}</span>
        <input type="file" accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={(event) => chooseFile(event.target.files?.[0])} />
      </label>

      {!file && (
        <textarea
          value={csv}
          onChange={(event) => {
            setCsv(event.target.value);
            const rows = parsePreview(event.target.value);
            setHeaders(rows[0] || []);
            setPreview(rows.slice(1, 4));
            setColumnMap(autoMap(rows[0] || []));
            if (event.target.value.trim()) setStep(2);
          }}
          placeholder={sample}
          className="mt-3 min-h-28 w-full rounded-lg border border-line bg-ink px-3 py-2 font-mono text-xs outline-none focus:border-electric"
        />
      )}

      {(headers.length > 0 || file) && (
        <div className="mt-4 rounded-xl border border-line bg-ink p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-white">Mapeamento de colunas</p>
            <p className="text-xs text-slate-400">{file?.name || "CSV colado"} · {detectedRows || "XLSX"} linha(s) detectada(s)</p>
          </div>
          {headers.length > 0 ? (
            <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {headers.map((header) => (
                <label key={header} className="space-y-1 text-xs text-slate-400">
                  {header}
                  <select
                    value={Object.entries(columnMap).find(([, source]) => source === header)?.[0] || ""}
                    onChange={(event) => {
                      setColumnMap((current) => {
                        const next = Object.fromEntries(Object.entries(current).filter(([, source]) => source !== header));
                        if (event.target.value) next[event.target.value] = header;
                        return next;
                      });
                    }}
                    className="w-full rounded-lg border border-line bg-panel px-2 py-2 text-xs text-white"
                  >
                    <option value="">Ignorar</option>
                    {importFields.map((field) => <option key={field} value={field}>{field}</option>)}
                  </select>
                </label>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-xs text-slate-400">Prévia local indisponível para XLSX; o backend validará as colunas no envio.</p>
          )}
          {preview.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="text-slate-400"><tr>{headers.map((h) => <th key={h} className="px-2 py-1">{h}</th>)}</tr></thead>
                <tbody>{preview.map((row, index) => <tr key={index} className="border-t border-line">{headers.map((h, cellIndex) => <td key={`${h}-${cellIndex}`} className="px-2 py-1 text-slate-300">{row[cellIndex]}</td>)}</tr>)}</tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button disabled={loading || (!csv.trim() && !file)} className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {loading ? "Importando..." : "Importar empresas"}
        </button>
        {message && <span className="text-sm text-slate-300">{message}</span>}
      </div>
      {errors.length > 0 && (
        <div className="mt-3 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-xs text-red-100">
          <p className="font-semibold">Erros encontrados</p>
          <ul className="mt-2 space-y-1">
            {errors.slice(0, 8).map((error) => <li key={`${error.row}-${error.reason}`}>Linha {error.row}: {error.reason}</li>)}
          </ul>
        </div>
      )}
    </form>
  );
}

function parsePreview(text: string) {
  const delimiter = ((text.split(/\r?\n/)[0] || "").match(/;/g)?.length ?? 0) >= ((text.split(/\r?\n/)[0] || "").match(/,/g)?.length ?? 0) ? ";" : ",";
  return text.split(/\r?\n/).filter((line) => line.trim()).map((line) => line.split(delimiter).map((cell) => cell.replace(/^"|"$/g, "").trim()));
}

function autoMap(headers: string[]) {
  const aliases: Record<string, string[]> = {
    name: ["name", "nome", "empresa", "nome_fantasia"],
    razao_social: ["razao_social", "razão_social", "razao"],
    cnpj: ["cnpj"],
    phone: ["phone", "telefone", "fone"],
    whatsapp: ["whatsapp", "whats", "zap"],
    email_principal: ["email_principal", "email", "e-mail"],
    website: ["website", "site", "url"],
    city: ["city", "cidade", "municipio"],
    state: ["state", "estado", "uf"],
    segment: ["segment", "segmento", "categoria"],
    notes: ["notes", "observacoes", "obs"]
  };
  const normalized = headers.map((header) => [header, normalizeColumn(header)] as const);
  return Object.fromEntries(importFields.flatMap((field) => {
    const match = normalized.find(([, normalizedHeader]) => (aliases[field] || [field]).map(normalizeColumn).includes(normalizedHeader));
    return match ? [[field, match[0]]] : [];
  }));
}

function normalizeColumn(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}
