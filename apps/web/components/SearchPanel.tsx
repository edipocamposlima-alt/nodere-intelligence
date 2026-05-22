"use client";

import { FormEvent, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { searchCompanies } from "@/lib/api";
import { Company } from "@/lib/types";
import { CompanyTable } from "./CompanyTable";

export function SearchPanel() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Company[]>([]);
  const [message, setMessage] = useState("Use cidade, estado e segmento para encontrar oportunidades.");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const payload = {
      city: String(form.get("city") ?? ""),
      state: String(form.get("state") ?? ""),
      segment: String(form.get("segment") ?? ""),
      keyword: String(form.get("keyword") ?? "")
    };
    const response = await searchCompanies(payload);
    setResults(response.companies);
    setMessage(`${response.companies.length} empresas analisadas e ranqueadas por potencial comercial.`);
    setLoading(false);
  }

  return (
    <section className="space-y-5">
      <form onSubmit={onSubmit} className="rounded-lg border border-line bg-panel/90 p-4 shadow-glow">
        <div className="flex items-center gap-2 text-sm font-medium text-white">
          <Sparkles className="h-4 w-4 text-cyan" />
          Busca inteligente
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-5">
          <input name="segment" required placeholder="Segmento" defaultValue="Concreteira" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-electric" />
          <input name="city" required placeholder="Cidade" defaultValue="Porto Alegre" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-electric" />
          <input name="state" placeholder="Estado" defaultValue="RS" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-electric" />
          <input name="keyword" placeholder="Palavra-chave" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-electric" />
          <button disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg bg-electric px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60">
            <Search className="h-4 w-4" />
            {loading ? "Buscando" : "Buscar"}
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-400">{message}</p>
      </form>
      {results.length > 0 && <CompanyTable companies={results} />}
    </section>
  );
}
