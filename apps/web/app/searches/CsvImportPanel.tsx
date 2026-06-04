"use client";

import { FormEvent, useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { getBackendRootUrl } from "@/lib/apiBase";
import { importCompaniesCsv } from "@/lib/api";

const sample = "name;razao_social;cnpj;phone;whatsapp;email_principal;website;city;state;segment;notes\nEmpresa Exemplo;Empresa Exemplo Ltda;00.000.000/0001-00;(54) 3333-3333;(54) 99999-9999;contato@empresa.com.br;https://empresa.com.br;Caxias do Sul;RS;Clínicas e Saúde;Lead importado";
const API_ROOT = getBackendRootUrl();

export function CsvImportPanel() {
  const [csv, setCsv] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Array<{ row: number; reason: string }>>([]);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const result = await importCompaniesCsv(csv);
      setMessage(`${result.imported} importado(s), ${result.duplicates} duplicado(s), ${result.errors.length} erro(s).`);
      setErrors(result.errors);
      setCsv("");
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
          Importar empresas por CSV
        </div>
        <div className="flex flex-wrap gap-3">
          <a href={`${API_ROOT}/api/companies/import/template`} target="_blank" className="inline-flex items-center gap-1 text-xs font-semibold text-cyan hover:text-white">
            <Download className="h-3.5 w-3.5" />
            Baixar modelo
          </a>
          <button type="button" onClick={() => setCsv(sample)} className="text-xs font-semibold text-cyan hover:text-white">
            Colar modelo
          </button>
        </div>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-400">
        Aceita CSV com vírgula ou ponto e vírgula. O backend valida email, normaliza telefone/CNPJ, evita duplicidade por CNPJ ou nome+cidade e grava no Supabase.
      </p>
      <textarea
        value={csv}
        onChange={(event) => setCsv(event.target.value)}
        placeholder={sample}
        className="mt-3 min-h-28 w-full rounded-lg border border-line bg-ink px-3 py-2 font-mono text-xs outline-none focus:border-electric"
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button disabled={loading || !csv.trim()} className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {loading ? "Importando..." : "Importar CSV"}
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
