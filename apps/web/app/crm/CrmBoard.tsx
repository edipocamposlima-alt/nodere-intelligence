"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { GripVertical, Plus, Search, Trash2 } from "lucide-react";
import { Company, CrmStatus } from "@/lib/types";
import { updateCompanyStatus } from "@/lib/api";

const defaultColumns = [
  "Novo Lead",
  "Qualificado",
  "Contatado",
  "Diagnóstico enviado",
  "Reunião marcada",
  "Proposta enviada",
  "Negociação",
  "Fechado",
  "Perdido"
] as string[];

const stageStyle: Record<string, string> = {
  "Novo Lead": "border-blue-500/35 bg-blue-500/10",
  "Qualificado": "border-cyan/35 bg-cyan/10",
  "Contatado": "border-yellow-500/35 bg-yellow-500/10",
  "Diagnóstico enviado": "border-purple-500/35 bg-purple-500/10",
  "Reunião marcada": "border-indigo-500/35 bg-indigo-500/10",
  "Proposta enviada": "border-orange-500/35 bg-orange-500/10",
  "Negociação": "border-amber-500/35 bg-amber-500/10",
  "Fechado": "border-success/35 bg-success/10",
  "Perdido": "border-danger/35 bg-danger/10"
};

export function CrmBoard({ companies }: { companies: Company[] }) {
  const [items, setItems] = useState(companies);
  const [query, setQuery] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [columns, setColumns] = useState<string[]>(defaultColumns);
  const [newStage, setNewStage] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("nodere_pipeline_stages");
    if (saved) {
      const parsed = JSON.parse(saved) as string[];
      if (Array.isArray(parsed) && parsed.length > 0) setColumns(parsed);
    }
  }, []);

  function persistStages(next: string[]) {
    setColumns(next);
    localStorage.setItem("nodere_pipeline_stages", JSON.stringify(next));
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((company) =>
      [company.name, company.category, company.city, company.state, company.phone, company.website]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [items, query]);

  async function moveLead(companyId: string, status: string) {
    const previous = items;
    setItems((current) => current.map((company) => company.id === companyId ? { ...company, status: status as CrmStatus } : company));
    setMessage("Salvando etapa do funil...");
    try {
      await updateCompanyStatus(companyId, status);
      setMessage("Etapa atualizada no CRM.");
      setTimeout(() => setMessage(null), 2500);
    } catch (error) {
      setItems(previous);
      setMessage(error instanceof Error ? error.message : "Não foi possível atualizar a etapa.");
    }
  }

  function addStage() {
    const label = newStage.trim();
    if (!label) return;
    if (columns.some((stage) => stage.toLowerCase() === label.toLowerCase())) {
      setMessage("Esta etapa já existe.");
      return;
    }
    persistStages([...columns, label]);
    setNewStage("");
    setMessage("Etapa criada no funil.");
  }

  function removeStage(stage: string) {
    if (items.some((company) => company.status === stage)) {
      setMessage("Não é possível remover uma etapa com leads. Mova os leads antes.");
      return;
    }
    persistStages(columns.filter((item) => item !== stage));
    setMessage("Etapa removida do funil.");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border border-line bg-panel/90 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">CRM</h2>
          <p className="mt-1 text-sm text-slate-400">Arraste os leads entre etapas para atualizar o funil comercial.</p>
        </div>
        <label className="flex items-center gap-2 rounded-lg border border-line bg-ink px-3 py-2 text-sm text-slate-300">
          <Search className="h-4 w-4 text-cyan" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar lead..." className="bg-transparent outline-none" />
        </label>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-line bg-panel/90 p-3 sm:flex-row sm:items-center">
        <input
          value={newStage}
          onChange={(event) => setNewStage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addStage();
            }
          }}
          placeholder="Nova etapa do funil, ex: Retomar futuramente"
          className="min-w-0 flex-1 rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-electric"
        />
        <button onClick={addStage} className="inline-flex items-center justify-center gap-2 rounded-lg bg-electric px-4 py-2 text-sm font-semibold text-white">
          <Plus className="h-4 w-4" />
          Criar etapa
        </button>
      </div>

      {message && <p className="rounded-lg border border-electric/30 bg-electric/10 px-3 py-2 text-sm text-blue-100">{message}</p>}

      <div className="grid auto-cols-[17rem] grid-flow-col gap-4 overflow-x-auto pb-2">
        {columns.map((column) => {
          const leads = filtered.filter((company) => company.status === column);
          return (
            <section
              key={column}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const companyId = event.dataTransfer.getData("text/plain") || draggedId;
                if (companyId) void moveLead(companyId, column);
                setDraggedId(null);
              }}
              className={`min-h-[420px] rounded-lg border p-3 ${stageStyle[column] ?? "border-line bg-panel/90"}`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">{column}</h3>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-white/5 px-2 py-1 text-xs text-slate-400">{leads.length}</span>
                  {!defaultColumns.includes(column) && (
                    <button onClick={() => removeStage(column)} className="rounded-md border border-line p-1 text-slate-400 hover:text-red-300" aria-label={`Remover etapa ${column}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-3 space-y-3">
                {leads.length === 0 && <p className="rounded-lg border border-dashed border-line p-3 text-xs text-slate-500">Solte um lead aqui.</p>}
                {leads.map((company) => (
                  <article
                    key={company.id}
                    draggable
                    onDragStart={(event) => {
                      setDraggedId(company.id);
                      event.dataTransfer.setData("text/plain", company.id);
                    }}
                    className="rounded-lg border border-line bg-panel/95 p-3 shadow-sm hover:border-electric/60"
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                      <div className="min-w-0">
                        <Link href={`/companies/${company.id}`} className="block truncate text-sm font-medium text-white hover:text-cyan">
                          {company.name}
                        </Link>
                        <p className="mt-1 truncate text-xs text-slate-500">{company.category} · {company.city}/{company.state}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Score</span>
                      <span className="font-semibold text-cyan">{company.score}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
