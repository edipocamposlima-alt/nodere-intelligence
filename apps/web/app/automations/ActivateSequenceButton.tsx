"use client";

import { useState } from "react";
import { Loader2, Play } from "lucide-react";
import { activateSequence, searchCompanyOptions } from "@/lib/api";

type CompanyOption = {
  id: string;
  name: string;
  category?: string;
  city?: string;
  state?: string;
  status?: string;
  score?: number;
};

export function ActivateSequenceButton({ templateId, templateName }: { templateId: string; templateName: string }) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<CompanyOption[]>([]);
  const [selected, setSelected] = useState<CompanyOption | null>(null);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function searchCompanies(value: string) {
    setQuery(value);
    setSelected(null);
    setDone(false);
    if (value.trim().length < 2) {
      setOptions([]);
      return;
    }
    setSearching(true);
    setError(null);
    try {
      const result = await searchCompanyOptions(value, 8);
      setOptions(result.companies);
    } catch (err: any) {
      setOptions([]);
      setError(err.message ?? "Não foi possível buscar empresas.");
    } finally {
      setSearching(false);
    }
  }

  async function activate() {
    if (!selected?.id) return;
    setLoading(true);
    setError(null);
    try {
      await activateSequence(selected.id, templateId);
      setDone(true);
      setQuery("");
      setOptions([]);
      setSelected(null);
      setTimeout(() => setDone(false), 3000);
    } catch (err: any) {
      setError(err.message ?? "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 space-y-2">
      <input
        type="text"
        value={query}
        onChange={(e) => searchCompanies(e.target.value)}
        placeholder="Buscar empresa salva"
        className="w-full rounded-md border border-line bg-ink px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:border-cyan focus:outline-none"
      />
      {searching && <p className="text-[11px] text-slate-500">Buscando empresas...</p>}
      {options.length > 0 && (
        <div className="max-h-44 overflow-y-auto rounded-lg border border-line bg-ink/95 p-1">
          {options.map((company) => (
            <button
              key={company.id}
              type="button"
              onClick={() => {
                setSelected(company);
                setQuery(company.name);
                setOptions([]);
              }}
              className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left text-xs text-slate-200 hover:bg-electric/15"
            >
              <span className="min-w-0">
                <span className="block truncate font-semibold text-white">{company.name}</span>
                <span className="block truncate text-[11px] text-slate-500">
                  {[company.category, company.city, company.state].filter(Boolean).join(" · ") || "Sem dados comerciais"}
                </span>
              </span>
              <span className="shrink-0 rounded-full bg-cyan/10 px-2 py-0.5 text-[10px] text-cyan">
                {company.status || "Lead"}
              </span>
            </button>
          ))}
        </div>
      )}
      {query.trim().length >= 2 && !searching && !selected && options.length === 0 && (
        <p className="text-[11px] text-slate-500">Nenhuma empresa encontrada para esta busca.</p>
      )}
      {selected && (
        <p className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-[11px] text-emerald-200">
          Selecionada: {selected.name}
        </p>
      )}
      <button
        onClick={activate}
        disabled={loading || !selected}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-electric/30 bg-electric/10 px-3 py-1.5 text-xs font-semibold text-blue-300 transition hover:bg-electric/20 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
        {done ? "Ativada!" : `Ativar ${templateName}`}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
