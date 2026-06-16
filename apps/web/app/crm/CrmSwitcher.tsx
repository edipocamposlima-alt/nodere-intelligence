"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Download, LayoutGrid, ListFilter, Plus, Search, SlidersHorizontal } from "lucide-react";
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
  const stages = useMemo(() => Array.from(new Set(companies.map((company) => company.status).filter(Boolean))), [companies]);
  const won = companies.filter((company) => ["Fechado", "Ganho", "Ganho(a)"].includes(String(company.status))).length;
  const stale = companies.filter((company) => {
    const source = company.lastContactAt || company.updatedAt || company.createdAt;
    if (!source) return false;
    const days = Math.floor((Date.now() - new Date(source).getTime()) / 86400000);
    return Number.isFinite(days) && days >= 7 && !["Fechado", "Perdido", "Ganho", "Ganho(a)"].includes(String(company.status));
  }).length;
  const avgScore = companies.length ? Math.round(companies.reduce((sum, company) => sum + Number(company.score || 0), 0) / companies.length) : 0;

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-line bg-panel/90 p-5 shadow-card">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan">CRM comercial</p>
            <h1 className="mt-2 text-2xl font-black text-white">Pipeline, contatos e oportunidades</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              Operação inspirada em quadros modernos de CRM: Kanban para ação diária, lista para auditoria e filtros rápidos para priorização.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/searches" className="inline-flex items-center gap-2 rounded-lg bg-electric px-4 py-2 text-sm font-black text-white transition hover:bg-brand-hover">
              <Plus className="h-4 w-4" />
              Novo lead
            </Link>
            <Link href="/companies" className="inline-flex items-center gap-2 rounded-lg border border-line bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10">
              <Download className="h-4 w-4" />
              Importar / exportar
            </Link>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-5">
          {[
            ["Leads totais", companies.length.toLocaleString("pt-BR")],
            ["Etapas ativas", stages.length.toLocaleString("pt-BR")],
            ["Ganhos", won.toLocaleString("pt-BR")],
            ["Score médio", `${avgScore}/100`],
            ["Sem follow-up", stale.toLocaleString("pt-BR")]
          ].map(([label, value], index) => (
            <div key={label} className="rounded-xl border border-line bg-ink/70 p-4">
              <p className="text-xs text-slate-500">{label}</p>
              <p className={`mt-2 text-2xl font-black ${index === 4 && stale > 0 ? "text-amber-200" : "text-white"}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-panel/90 p-4 shadow-card">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => changeView("kanban")} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${view === "kanban" ? "bg-electric text-white" : "border border-line bg-white/5 text-slate-300 hover:bg-white/10"}`}>
            <LayoutGrid className="h-4 w-4" />
              Pipeline
            </button>
            <button onClick={() => changeView("list")} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${view === "list" ? "bg-electric text-white" : "border border-line bg-white/5 text-slate-300 hover:bg-white/10"}`}>
            <ListFilter className="h-4 w-4" />
              Lista
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="flex min-w-[240px] flex-1 items-center gap-2 rounded-lg border border-line bg-ink px-3 py-2 text-sm text-slate-300 xl:max-w-sm">
              <Search className="h-4 w-4 text-cyan" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar empresa, cidade ou etapa" className="min-w-0 flex-1 bg-transparent outline-none" />
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-line bg-ink px-3 py-2 text-sm text-slate-300">
              <SlidersHorizontal className="h-4 w-4 text-cyan" />
              <select value={stage} onChange={(event) => setStage(event.target.value)} className="bg-transparent outline-none">
              <option value="">Todas as etapas</option>
                {stages.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
          </div>
        </div>
      </div>
      {view === "kanban" ? <CrmBoard companies={filtered} /> : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-panel/90 shadow-card">
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
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">Nenhum lead encontrado para os filtros atuais.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
