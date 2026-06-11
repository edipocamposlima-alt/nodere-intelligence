"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Check, GripVertical, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { Company, CrmStatus } from "@/lib/types";
import { getPublicSettings, savePipelineSettings, updateCompany, updateCompanyStatus } from "@/lib/api";

const STAGES_STORAGE_KEY = "nodere_pipeline_stages";
const STAGE_COLORS_STORAGE_KEY = "nodere_pipeline_stage_colors";

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

const defaultStageColors: Record<string, string> = {
  "Novo Lead": "#0EA5E9",
  "Qualificado": "#14B8A6",
  "Contatado": "#FACC15",
  "Diagnóstico enviado": "#D946EF",
  "Reunião marcada": "#6366F1",
  "Proposta enviada": "#F97316",
  "Negociação": "#F59E0B",
  "Fechado": "#22C55E",
  "Perdido": "#F43F5E"
};

const stagePalette = ["#0EA5E9", "#14B8A6", "#FACC15", "#D946EF", "#6366F1", "#F97316", "#F59E0B", "#22C55E", "#F43F5E", "#8B5CF6", "#06B6D4", "#84CC16"];

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace("#", "");
  const value = clean.length === 3 ? clean.split("").map((char) => `${char}${char}`).join("") : clean;
  const int = Number.parseInt(value, 16);
  if (Number.isNaN(int)) return `rgba(14, 165, 233, ${alpha})`;
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function readableTextColor(hex: string) {
  const clean = hex.replace("#", "");
  const value = clean.length === 3 ? clean.split("").map((char) => `${char}${char}`).join("") : clean;
  const int = Number.parseInt(value, 16);
  if (Number.isNaN(int)) return "#FFFFFF";
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.64 ? "#06111F" : "#FFFFFF";
}

function isValidBrazilianMobile(phone?: string) {
  const digits = String(phone || "").replace(/\D/g, "");
  const local = digits.startsWith("55") ? digits.slice(2) : digits;
  return local.length === 11 && local[2] === "9";
}

export function CrmBoard({ companies }: { companies: Company[] }) {
  const [items, setItems] = useState(companies);
  const [query, setQuery] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [columns, setColumns] = useState<string[]>(defaultColumns);
  const [newStage, setNewStage] = useState("");
  const [newStageColor, setNewStageColor] = useState(stagePalette[0]);
  const [editingStage, setEditingStage] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [stageColors, setStageColors] = useState<Record<string, string>>(defaultStageColors);
  const [editingWhatsapp, setEditingWhatsapp] = useState<Record<string, boolean>>({});
  const [whatsappDrafts, setWhatsappDrafts] = useState<Record<string, string>>({});
  const [whatsappErrors, setWhatsappErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STAGES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as string[];
        if (Array.isArray(parsed) && parsed.length > 0) setColumns(parsed);
      }
      const savedColors = localStorage.getItem(STAGE_COLORS_STORAGE_KEY);
      if (savedColors) {
        const parsedColors = JSON.parse(savedColors) as Record<string, string>;
        setStageColors({ ...defaultStageColors, ...parsedColors });
      }
    } catch {
      setColumns(defaultColumns);
      setStageColors(defaultStageColors);
    }

    getPublicSettings()
      .then((payload) => {
        const remoteStages = payload.pipeline?.stages;
        const remoteColors = payload.pipeline?.stageColors;
        if (Array.isArray(remoteStages) && remoteStages.length > 0) {
          setColumns(remoteStages);
          localStorage.setItem(STAGES_STORAGE_KEY, JSON.stringify(remoteStages));
        }
        if (remoteColors && typeof remoteColors === "object") {
          const merged = { ...defaultStageColors, ...remoteColors };
          setStageColors(merged);
          localStorage.setItem(STAGE_COLORS_STORAGE_KEY, JSON.stringify(merged));
        }
      })
      .catch((error) => {
        setMessage(error instanceof Error ? error.message : "Não foi possível carregar o funil persistido.");
      });
  }, []);

  function persistPipeline(nextStages: string[], nextColors: Record<string, string>) {
    setColumns(nextStages);
    setStageColors(nextColors);
    localStorage.setItem(STAGES_STORAGE_KEY, JSON.stringify(nextStages));
    localStorage.setItem(STAGE_COLORS_STORAGE_KEY, JSON.stringify(nextColors));
    savePipelineSettings({ stages: nextStages, stageColors: nextColors })
      .then(() => {
        setMessage("Funil salvo no backend persistente.");
        setTimeout(() => setMessage(null), 2500);
      })
      .catch((error) => {
        setMessage(error instanceof Error ? error.message : "Não foi possível persistir o funil no backend.");
      });
  }

  function persistStageColors(next: Record<string, string>) {
    persistPipeline(columns, next);
  }

  function colorForStage(stage: string, index: number) {
    return stageColors[stage] || stagePalette[index % stagePalette.length] || "#0EA5E9";
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
    persistPipeline([...columns, label], { ...stageColors, [label]: newStageColor });
    setNewStage("");
    setNewStageColor(stagePalette[(columns.length + 1) % stagePalette.length]);
    setMessage("Etapa criada no funil.");
  }

  function removeStage(stage: string) {
    if (columns.length <= 1) {
      setMessage("O funil precisa ter pelo menos uma etapa.");
      return;
    }
    if (items.some((company) => company.status === stage)) {
      setMessage("Não é possível remover uma etapa com leads. Mova os leads antes.");
      return;
    }
    const nextColumns = columns.filter((item) => item !== stage);
    const nextColors = { ...stageColors };
    delete nextColors[stage];
    persistPipeline(nextColumns, nextColors);
    setMessage("Etapa removida do funil.");
  }

  async function renameStage(stage: string) {
    const label = editingValue.trim();
    if (!label || label === stage) {
      setEditingStage(null);
      return;
    }
    if (columns.some((item) => item !== stage && item.toLowerCase() === label.toLowerCase())) {
      setMessage("Já existe uma etapa com este nome.");
      return;
    }
    const affected = items.filter((company) => company.status === stage);
    const nextColumns = columns.map((item) => item === stage ? label : item);
    const nextColors = { ...stageColors, [label]: stageColors[stage] || newStageColor };
    delete nextColors[stage];
    persistPipeline(nextColumns, nextColors);
    setItems((current) => current.map((company) => company.status === stage ? { ...company, status: label as CrmStatus } : company));
    setEditingStage(null);
    setMessage("Renomeando etapa e atualizando leads...");
    try {
      await Promise.all(affected.map((company) => updateCompanyStatus(company.id, label)));
      setMessage("Etapa renomeada no CRM.");
      setTimeout(() => setMessage(null), 2500);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Etapa renomeada localmente, mas alguns leads não sincronizaram.");
    }
  }

  function stageValue(leads: Company[]) {
    return leads.reduce((sum, company) => {
      if (company.status === "Fechado" || company.status === "Perdido") return sum;
      return sum + Math.max(0, Number(company.score || 0) * 100);
    }, 0);
  }

  function formatBRL(value: number) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  }

  async function saveWhatsapp(company: Company) {
    const draft = whatsappDrafts[company.id] ?? company.whatsapp ?? "";
    if (!isValidBrazilianMobile(draft)) {
      setWhatsappErrors((current) => ({
        ...current,
        [company.id]: "Número inválido. Celulares brasileiros têm 11 dígitos e o 3º dígito deve ser 9."
      }));
      return;
    }
    setWhatsappErrors((current) => ({ ...current, [company.id]: "" }));
    try {
      const updated = await updateCompany(company.id, { whatsapp: draft });
      setItems((current) => current.map((item) => item.id === company.id ? { ...item, ...updated, whatsapp: draft } : item));
      setEditingWhatsapp((current) => ({ ...current, [company.id]: false }));
      setMessage("WhatsApp corrigido no CRM.");
      setTimeout(() => setMessage(null), 2500);
    } catch (error) {
      setWhatsappErrors((current) => ({
        ...current,
        [company.id]: error instanceof Error ? error.message : "Não foi possível salvar o WhatsApp."
      }));
    }
  }

  function staleInfo(company: Company) {
    const source = company.lastContactAt || company.updatedAt || company.createdAt;
    const days = Math.floor((Date.now() - new Date(source).getTime()) / 86400000);
    if (!Number.isFinite(days) || company.status === "Fechado" || company.status === "Perdido") return null;
    if (days >= 14) return { label: `Parado há ${days} dias`, className: "border-l-4 border-l-red-500 bg-red-950/20" };
    if (days >= 7) return { label: `Sem contato há ${days} dias`, className: "border-l-4 border-l-amber-400 bg-amber-950/20" };
    return null;
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
        <label className="inline-flex items-center gap-2 rounded-lg border border-line bg-ink px-3 py-2 text-sm text-slate-300">
          Cor
          <input
            type="color"
            value={newStageColor}
            onChange={(event) => setNewStageColor(event.target.value)}
            className="h-8 w-10 cursor-pointer rounded-md border border-white/20 bg-transparent p-0"
            aria-label="Cor da nova etapa"
          />
        </label>
        <button onClick={addStage} className="inline-flex items-center justify-center gap-2 rounded-lg bg-electric px-4 py-2 text-sm font-semibold text-white">
          <Plus className="h-4 w-4" />
          Criar etapa
        </button>
      </div>

      {message && <p className="rounded-lg border border-electric/30 bg-electric/10 px-3 py-2 text-sm text-blue-100">{message}</p>}

      <div className="grid auto-cols-[19rem] grid-flow-col gap-4 overflow-x-auto pb-2">
        {columns.map((column, index) => {
          const leads = filtered.filter((company) => company.status === column);
          const stageColor = colorForStage(column, index);
          const stageTextColor = readableTextColor(stageColor);
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
              className="flex h-[680px] flex-col overflow-hidden rounded-xl border shadow-[0_16px_48px_rgba(0,0,0,0.22)]"
              style={{
                borderColor: hexToRgba(stageColor, 0.88),
                background: `linear-gradient(180deg, ${hexToRgba(stageColor, 0.18)} 0%, ${hexToRgba(stageColor, 0.08)} 100%)`
              }}
            >
              <div
                className="rounded-t-xl border-b border-white/20 px-3 py-3 shadow-[0_10px_28px_rgba(0,0,0,0.16)]"
                style={{
                  backgroundColor: stageColor,
                  color: stageTextColor
                }}
              >
                <div className="flex items-center justify-between gap-2">
                {editingStage === column ? (
                  <div className="flex min-w-0 flex-1 items-center gap-1">
                    <input
                      value={editingValue}
                      onChange={(event) => setEditingValue(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") void renameStage(column);
                        if (event.key === "Escape") setEditingStage(null);
                      }}
                      className="min-w-0 flex-1 rounded-md border border-line bg-ink px-2 py-1 text-xs text-white outline-none focus:border-electric"
                      autoFocus
                    />
                    <button onClick={() => void renameStage(column)} className="rounded-md bg-success p-1 text-ink" aria-label="Salvar nome da etapa">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setEditingStage(null)} className="rounded-md border border-line p-1 text-slate-300" aria-label="Cancelar edição">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <h3 className="min-w-0 truncate text-sm font-black text-white">{column}</h3>
                )}
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-white/25 px-2 py-1 text-xs font-black" style={{ color: stageTextColor }}>{leads.length}</span>
                  <input
                    type="color"
                    value={stageColor}
                    onChange={(event) => persistStageColors({ ...stageColors, [column]: event.target.value })}
                    className="h-7 w-7 cursor-pointer rounded-md border border-white/35 bg-transparent p-0"
                    title={`Alterar cor da etapa ${column}`}
                    aria-label={`Alterar cor da etapa ${column}`}
                  />
                  {editingStage !== column && (
                    <button
                      onClick={() => {
                        setEditingStage(column);
                        setEditingValue(column);
                      }}
                      className="rounded-md border border-white/35 bg-black/10 p-1 hover:bg-white/20"
                      style={{ color: stageTextColor }}
                      aria-label={`Renomear etapa ${column}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button onClick={() => removeStage(column)} className="rounded-md border border-white/35 bg-black/10 p-1 hover:bg-white/20" style={{ color: stageTextColor }} aria-label={`Remover etapa ${column}`}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
                <div className="mt-2 flex items-center justify-between text-xs" style={{ color: stageTextColor }}>
                  <span>{leads.length} oportunidade(s)</span>
                  <span className="font-black">{formatBRL(stageValue(leads))}</span>
                </div>
              </div>
              <div className="crm-stage-scroll min-h-0 flex-1 space-y-3 overflow-y-scroll p-3 pr-2">
                {leads.length === 0 && <p className="rounded-lg border border-dashed border-line p-3 text-xs text-slate-500">Solte um lead aqui.</p>}
                {leads.map((company) => {
                  const stale = staleInfo(company);
                  return (
                    <article
                      key={company.id}
                      draggable
                      onDragStart={(event) => {
                        setDraggedId(company.id);
                        event.dataTransfer.setData("text/plain", company.id);
                      }}
                      className={`rounded-lg border border-white/15 bg-ink/90 p-3 shadow-sm ring-1 ring-white/5 transition hover:-translate-y-0.5 hover:border-cyan/70 hover:shadow-[0_10px_28px_rgba(34,211,238,0.14)] ${stale?.className || ""}`}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                        <div className="min-w-0">
                          <Link href={`/companies/${encodeURIComponent(company.id)}`} className="block truncate text-sm font-medium text-white hover:text-cyan">
                            {company.name}
                          </Link>
                          <p className="mt-1 truncate text-xs text-slate-500">{company.category} · {company.city}/{company.state}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="text-slate-400">Score</span>
                        <span className="font-semibold text-cyan">{company.score}</span>
                      </div>
                      {stale && <p className="mt-2 rounded-md bg-black/20 px-2 py-1 text-[11px] font-semibold text-amber-100">{stale.label}</p>}
                      {company.whatsapp && !isValidBrazilianMobile(company.whatsapp) && (
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingWhatsapp((current) => ({ ...current, [company.id]: true }));
                              setWhatsappDrafts((current) => ({ ...current, [company.id]: company.whatsapp ?? "" }));
                            }}
                            className="rounded-md border border-warning/40 bg-warning/10 px-2 py-1 text-[11px] font-semibold text-amber-100 hover:bg-warning/20"
                            title="Clique para corrigir"
                          >
                            WhatsApp inválido — clique para corrigir
                          </button>
                          {editingWhatsapp[company.id] && (
                            <div className="mt-2 space-y-2">
                              <input
                                value={whatsappDrafts[company.id] ?? ""}
                                onChange={(event) => setWhatsappDrafts((current) => ({ ...current, [company.id]: event.target.value }))}
                                placeholder="(XX) 9XXXX-XXXX"
                                className="w-full rounded-md border border-line bg-panel px-2 py-1 text-xs text-white outline-none focus:border-electric"
                              />
                              <div className="flex gap-2">
                                <button type="button" onClick={() => void saveWhatsapp(company)} className="rounded-md bg-cyan px-2 py-1 text-[11px] font-semibold text-ink">Salvar</button>
                                <button type="button" onClick={() => setEditingWhatsapp((current) => ({ ...current, [company.id]: false }))} className="rounded-md border border-line px-2 py-1 text-[11px] text-slate-300">Cancelar</button>
                              </div>
                              {whatsappErrors[company.id] && <p className="text-[11px] text-red-300">{whatsappErrors[company.id]}</p>}
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
