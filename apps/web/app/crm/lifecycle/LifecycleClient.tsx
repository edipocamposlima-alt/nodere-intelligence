"use client";

import { useEffect, useState } from "react";
import { Archive, RefreshCw, RotateCcw, ShieldAlert, Trash2 } from "lucide-react";
import { getCompanyDependencies, getCompanyLifecycle, purgeCompany, restoreCompany, type CompanyLifecycleRecord } from "@/lib/api";

export function LifecycleClient() {
  const [state, setState] = useState<"archived" | "trash">("archived");
  const [items, setItems] = useState<CompanyLifecycleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => { void load(); }, [state]);

  async function load() {
    setLoading(true);
    try { setItems(await getCompanyLifecycle(state)); setNotice(""); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Não foi possível carregar o ciclo de vida."); }
    finally { setLoading(false); }
  }

  async function restore(item: CompanyLifecycleRecord) {
    const reason = window.prompt(`Motivo para restaurar “${item.name}”`)?.trim();
    if (!reason || reason.length < 3) return;
    try { await restoreCompany(item.id, reason); setItems((current) => current.filter((candidate) => candidate.id !== item.id)); setNotice("Empresa restaurada para a operação ativa."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Não foi possível restaurar."); }
  }

  async function purge(item: CompanyLifecycleRecord) {
    const dependencies = await getCompanyDependencies(item.id).catch(() => null);
    if (dependencies?.total) return setNotice(`Exclusão definitiva bloqueada por ${dependencies.total} dependência(s). Restaure ou mantenha o registro na lixeira.`);
    const confirmation = window.prompt(`Exclusão definitiva e irreversível. Digite exatamente o nome da empresa:\n${item.name}`);
    if (confirmation !== item.name) return setNotice("A confirmação não corresponde ao nome da empresa.");
    const reason = window.prompt("Justificativa obrigatória (mínimo de 10 caracteres)")?.trim();
    if (!reason || reason.length < 10 || !window.confirm("Esta ação não poderá ser desfeita. Confirmar exclusão definitiva?")) return;
    try { await purgeCompany(item.id, confirmation, reason); setItems((current) => current.filter((candidate) => candidate.id !== item.id)); setNotice("Registro de teste excluído definitivamente após todas as proteções."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "A exclusão definitiva foi bloqueada."); }
  }

  return <div className="space-y-5 p-4 md:p-8">
    <header className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-5 md:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--brand-primary)]">CRM · retenção segura</p><h1 className="mt-2 font-heading text-2xl font-black md:text-3xl">Arquivo e Lixeira</h1><p className="mt-2 max-w-3xl text-sm text-[var(--text-secondary)]">Restauração, retenção de 30 dias, dependências e exclusão definitiva protegida. Dados vinculados nunca são apagados silenciosamente.</p></div><button type="button" onClick={load} disabled={loading} className="briefing-action"><RefreshCw className={loading ? "animate-spin" : ""} /> Atualizar</button></div></header>
    {notice && <div role="status" className="rounded-xl border border-[var(--nodere-gold)] bg-[var(--brand-glow-dim)] p-4 text-sm">{notice}</div>}
    <section className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-5"><div className="flex gap-2" role="tablist"><button type="button" role="tab" aria-selected={state === "archived"} onClick={() => setState("archived")} className={`briefing-action ${state === "archived" ? "briefing-action--primary" : ""}`}><Archive /> Arquivadas</button><button type="button" role="tab" aria-selected={state === "trash"} onClick={() => setState("trash")} className={`briefing-action ${state === "trash" ? "briefing-action--primary" : ""}`}><Trash2 /> Lixeira</button></div>
      <div className="mt-5 space-y-3">{items.map((item) => <article key={item.id} className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] p-4"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="font-heading font-black">{item.name}</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">{item.category || "Sem segmento"} · {[item.city, item.state].filter(Boolean).join("/") || "Sem localidade"}</p><p className="mt-2 text-xs text-[var(--text-muted)]">Motivo: {item.delete_reason || "Não informado"}</p>{state === "trash" && <p className="mt-1 text-xs text-[var(--text-muted)]">Retenção até: {dateLabel(item.purge_after)}</p>}{item.legal_hold && <p className="mt-2 inline-flex items-center gap-1 text-xs font-black text-amber-400"><ShieldAlert /> Retenção legal ativa</p>}</div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => restore(item)} className="briefing-action briefing-action--primary"><RotateCcw /> Restaurar</button>{state === "trash" && <button type="button" onClick={() => purge(item)} disabled={Boolean(item.legal_hold) || !retentionExpired(item.purge_after)} className="briefing-action"><Trash2 /> Excluir definitivamente</button>}</div></div></article>)}{!loading && !items.length && <div className="rounded-xl border border-dashed border-[var(--border-soft)] p-8 text-center text-sm text-[var(--text-muted)]">Nenhum registro neste estado.</div>}</div>
    </section>
  </div>;
}

function dateLabel(value?: string | null) { if (!value) return "não definida"; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleString("pt-BR"); }
function retentionExpired(value?: string | null) { return Boolean(value && new Date(value).getTime() <= Date.now()); }
