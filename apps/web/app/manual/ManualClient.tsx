"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { BookOpen, CheckCircle2, Download, Search } from "lucide-react";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ManualClient({ sections }: { sections: string[][] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections.filter(([title, body]) => `${title} ${body}`.toLowerCase().includes(q));
  }, [query, sections]);

  const toc = sections.map(([title]) => ({ title, id: slugify(title) }));

  return (
    <div className="space-y-6 p-4 md:p-8">
      <section className="rounded-xl border border-line bg-panel/90 p-6 print:border-0 print:bg-white">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
              <Image src="/logo-noderi-full.png" alt="NODERI" width={260} height={90} priority className="h-auto w-52 rounded-lg object-contain" />
            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-cyan print:text-blue-700" />
                <h2 className="text-2xl font-semibold text-white print:text-slate-950">Ajuda / Manual NODERI</h2>
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

      <div className="grid gap-5 lg:grid-cols-[280px_1fr] print:block">
        <aside className="rounded-xl border border-line bg-panel/90 p-4 lg:sticky lg:top-4 lg:self-start print:hidden">
          <p className="text-sm font-semibold text-white">Sumário</p>
          <nav className="mt-3 max-h-[68vh] space-y-1 overflow-y-auto pr-1">
            {toc.map((item) => (
              <a key={item.id} href={`#${item.id}`} className="block rounded-lg px-3 py-2 text-xs leading-5 text-slate-400 hover:bg-white/[0.06] hover:text-white">
                {item.title}
              </a>
            ))}
          </nav>
        </aside>

      <section className="grid gap-4 xl:grid-cols-2 print:block">
        {filtered.map(([title, body]) => (
          <article id={slugify(title)} key={title} className="scroll-mt-6 rounded-lg border border-line bg-panel/90 p-5 print:mb-4 print:border-slate-200 print:bg-white">
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
    </div>
  );
}
