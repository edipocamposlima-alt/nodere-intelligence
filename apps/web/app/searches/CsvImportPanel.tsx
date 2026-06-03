"use client";

import { FormEvent, useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { importCompaniesCsv } from "@/lib/api";

const sample = "name,phone,email,website,city,state,segment,notes\nEmpresa Exemplo,54999999999,contato@empresa.com,https://empresa.com,Caxias do Sul,RS,Academia,Lead importado";

export function CsvImportPanel() {
  const [csv, setCsv] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const result = await importCompaniesCsv(csv);
      setMessage(`${result.imported} importado(s), ${result.duplicates} duplicado(s), ${result.errors.length} erro(s).`);
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
          Importar leads por CSV
        </div>
        <button type="button" onClick={() => setCsv(sample)} className="text-xs font-semibold text-cyan hover:text-white">
          Usar modelo CSV
        </button>
      </div>
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
    </form>
  );
}
