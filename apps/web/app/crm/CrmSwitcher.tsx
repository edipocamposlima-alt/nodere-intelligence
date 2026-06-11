"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LayoutGrid, ListFilter } from "lucide-react";
import type { Company } from "@/lib/types";
import { CrmBoard } from "./CrmBoard";

export function CrmSwitcher({ companies }: { companies: Company[] }) {
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("crm_view_preference");
    if (saved === "list") setView("list");
  }, []);

  function changeView(next: "kanban" | "list") {
    setView(next);
    localStorage.setItem("crm_view_preference", next);
  }

  const filtered = useMemo(() => companies.filter((company) =>
    (!query || company.name.toLowerCase().includes(query.toLowerCase())) &&
    (!stage || company.status === stage)
  ), [companies, query, stage]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => changeView("kanban")} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${view === "kanban" ? "bg-electric text-white" : "border border-line bg-white/5 text-slate-300"}`}>
            <LayoutGrid className="h-4 w-4" />
            Kanban
          </button>
          <button onClick={() => changeView("list")} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${view === "list" ? "bg-electric text-white" : "border border-line bg-white/5 text-slate-300"}`}>
            <ListFilter className="h-4 w-4" />
            Lista
          </button>
        </div>
        {view === "list" && (
          <div className="flex flex-wrap gap-2">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar empresa" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none" />
            <select value={stage} onChange={(event) => setStage(event.target.value)} className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none">
              <option value="">Todas as etapas</option>
              {Array.from(new Set(companies.map((company) => company.status))).map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
        )}
      </div>
      {view === "kanban" ? <CrmBoard companies={companies} /> : (
        <div className="overflow-x-auto rounded-xl border border-line bg-panel/90">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-line text-left text-xs text-slate-400">
              <tr>
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Etapa</th>
                <th className="px-4 py-3">Cidade</th>
                <th className="px-4 py-3">Último contato</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((company) => (
                <tr key={company.id} className="hover:bg-white/[0.03]">
                  <td className="px-4 py-3 font-semibold text-white">{company.name}</td>
                  <td className="px-4 py-3 text-cyan">{company.score}</td>
                  <td className="px-4 py-3">{company.status}</td>
                  <td className="px-4 py-3 text-slate-300">{company.city}/{company.state}</td>
                  <td className="px-4 py-3 text-slate-400">{company.lastContactAt ? new Date(company.lastContactAt).toLocaleDateString("pt-BR") : "Sem contato"}</td>
                  <td className="px-4 py-3"><Link href={`/companies/${encodeURIComponent(company.id)}`} className="text-cyan">Abrir ficha</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
