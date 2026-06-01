"use client";

import { FormEvent, useState } from "react";
import { AlertTriangle, CheckCircle2, Search, Sparkles } from "lucide-react";
import { searchCompanies } from "@/lib/api";
import { Company } from "@/lib/types";
import { CompanyTable } from "./CompanyTable";

export function SearchPanel() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Company[]>([]);
  const [message, setMessage] = useState("Use cidade, estado e segmento para encontrar oportunidades.");
  const [warning, setWarning] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setWarning(null);
    const form = new FormData(event.currentTarget);
    const payload = {
      companyName: String(form.get("companyName") ?? "").trim(),
      city: String(form.get("city") ?? ""),
      state: String(form.get("state") ?? ""),
      segment: String(form.get("segment") ?? ""),
      keyword: String(form.get("keyword") ?? ""),
      limit: 60
    };

    try {
      if (!Object.values(payload).some(Boolean)) {
        setResults([]);
        setWarning("Informe pelo menos nome da empresa, segmento, cidade, estado ou palavra-chave.");
        setMessage("Busca nao executada.");
        return;
      }

      const response = await searchCompanies(payload);
      const savedIds = JSON.parse(localStorage.getItem("nodere_saved_leads") || "[]") as string[];
      const savedSet = new Set(savedIds);
      const filtered = response.companies.filter((company) => !savedSet.has(company.id));
      setResults(filtered);
      setWarning(response.search.warning ?? response.search.error?.message ?? null);
      setMessage(`${filtered.length} resultado(s) visíveis. ${response.companies.length - filtered.length} já salvo(s) foram ocultado(s). A busca ampla consulta lotes do Google e deduplica por Place ID.`);
    } catch (error) {
      setResults([]);
      setWarning(error instanceof Error ? error.message : "Falha ao buscar empresas.");
      setMessage("Nao foi possivel concluir a busca.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-5">
      <form onSubmit={onSubmit} className="rounded-lg border border-line bg-panel/90 p-4 shadow-glow">
        <div className="flex items-center gap-2 text-sm font-medium text-white">
          <Sparkles className="h-4 w-4 text-cyan" />
          Busca inteligente
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-6">
          <input name="companyName" placeholder="Nome da empresa" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-electric" />
          <input name="segment" placeholder="Segmento" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-electric" />
          <input name="city" placeholder="Cidade" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-electric" />
          <input name="state" placeholder="Estado" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-electric" />
          <input name="keyword" placeholder="Palavra-chave" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-electric" />
          <button disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg bg-electric px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60">
            <Search className="h-4 w-4" />
            {loading ? "Buscando" : "Buscar"}
          </button>
        </div>
        <div className="mt-3 space-y-2">
          <p className="flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-cyan" />
            {message}
          </p>
          {warning && (
            <p className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs leading-5 text-amber-100">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
              {warning}
            </p>
          )}
        </div>
      </form>
      {results.length > 0 && <CompanyTable companies={results} />}
    </section>
  );
}
