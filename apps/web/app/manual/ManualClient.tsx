"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { BookOpen, CheckCircle2, Download, Search } from "lucide-react";

export function ManualClient({ sections }: { sections: string[][] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections.filter(([title, body]) => `${title} ${body}`.toLowerCase().includes(q));
  }, [query, sections]);

  return (
    <div className="space-y-6 p-4 md:p-8">
      <section className="rounded-xl border border-line bg-panel/90 p-6 print:border-0 print:bg-white">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Image src="/nodere-brand-full.png" alt="NODERE" width={260} height={90} priority className="h-auto w-52 rounded-lg object-contain" />
            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-cyan print:text-blue-700" />
                <h2 className="text-2xl font-semibold text-white print:text-slate-950">Ajuda / Manual NODERE</h2>
              </div>
              <p className="mt-1 text-sm text-slate-400 print:text-slate-600">Manual completo de operação, CRM, busca, IA, Apollo, relatórios e integrações.</p>
            </div>
          </div>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-electric px-4 py-3 text-sm font-semibold text-white print:hidden"
          >
            <Download className="h-4 w-4" />
            Baixar manual em PDF
          </button>
        </div>
        <label className="mt-5 flex items-center gap-2 rounded-lg border border-line bg-ink px-3 py-2 print:hidden">
          <Search className="h-4 w-4 text-cyan" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar no manual: Apollo, CRM, score, PDF, integrações..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>
      </section>

      <section className="grid gap-4 xl:grid-cols-2 print:block">
        {filtered.map(([title, body]) => (
          <article key={title} className="rounded-lg border border-line bg-panel/90 p-5 print:mb-4 print:border-slate-200 print:bg-white">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success print:text-blue-700" />
              <div>
                <h3 className="font-semibold text-white print:text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400 print:text-slate-700">{body}</p>
              </div>
            </div>
          </article>
        ))}
      </section>

      {filtered.length === 0 && (
        <p className="rounded-lg border border-line bg-panel/90 p-5 text-sm text-slate-400">Nenhum tópico encontrado para esta busca.</p>
      )}
    </div>
  );
}
