"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, ExternalLink, Search, ShieldCheck, Sparkles } from "lucide-react";

type Finding = { statement: string; sourceUrl: string; confidence: number };
type Source = { title: string; url: string; publisher: string; retrievedAt: string };
type ResearchRun = {
  id: string;
  status: "review" | "approved" | "persisted";
  query: string;
  facts: Finding[];
  signals: Finding[];
  inferences: Finding[];
  opportunities: Finding[];
  recommended_services: string[];
  sources: Source[];
  identity_confidence: number;
  data_confidence: number;
  commercial_score: number;
  metadata?: { provider?: string; providerWarning?: string | null };
};

export function ResearchPanel() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"quick" | "complete" | "batch">("complete");
  const [run, setRun] = useState<ResearchRun | null>(null);
  const [batchRuns, setBatchRuns] = useState<ResearchRun[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (query.trim().length < 2) return;
    setBusy(true);
    setMessage("Pesquisando fontes públicas e verificáveis...");
    try {
      const queries = query.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
      const isBatch = mode === "batch";
      const response = await fetch(isBatch ? "/api/backend/research/batch" : "/api/backend/research/run", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isBatch ? { queries } : { query: query.trim(), mode })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "A pesquisa não foi concluída.");
      if (isBatch) {
        const runs = Array.isArray(payload.runs) ? payload.runs : [];
        setBatchRuns(runs);
        setRun(runs[0] || null);
        setMessage(`${runs.length} pesquisa(s) concluída(s). Abra cada resultado e revise as fontes antes de aprovar.`);
      } else {
        setBatchRuns([]);
        setRun(payload);
        setMessage("Pesquisa concluída. Revise fatos, inferências e fontes antes de aprovar.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha na pesquisa pública.");
    } finally { setBusy(false); }
  }

  async function approve() {
    if (!run || !window.confirm("Você revisou as fontes e confirma a aprovação desta pesquisa?")) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/backend/research/${encodeURIComponent(run.id)}/approve`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmed: true })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "Não foi possível aprovar.");
      setRun(payload);
      setMessage("Pesquisa aprovada com registro de auditoria. Nenhum dado de empresa foi alterado automaticamente.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Falha ao aprovar."); }
    finally { setBusy(false); }
  }

  return (
    <section className="rounded-2xl border border-emerald-400/20 bg-[var(--bg-card)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-300">Pesquisa autônoma com fontes</p><h2 className="mt-1 text-xl font-black text-[var(--text-primary)]">Inteligência pública revisável</h2><p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">A NODERE separa fatos, sinais, inferências e oportunidades; toda afirmação aceita precisa apontar para uma fonte pública.</p></div>
        <ShieldCheck className="h-6 w-6 text-emerald-300" />
      </div>
      <form onSubmit={submit} className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]">
        {mode === "batch" ? <textarea value={query} onChange={(event) => setQuery(event.target.value)} rows={4} placeholder="Uma empresa, domínio ou CNPJ por linha (até 20)" className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-input)] p-3 text-sm text-[var(--text-primary)] outline-none focus:border-emerald-400" /> : <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Empresa, domínio, CNPJ, segmento ou tema comercial" className="min-h-11 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-input)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-emerald-400" />}
        <select value={mode} onChange={(event) => setMode(event.target.value as "quick" | "complete" | "batch")} className="min-h-11 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-input)] px-3 text-sm text-[var(--text-primary)]"><option value="quick">Pesquisa rápida</option><option value="complete">Pesquisa completa</option><option value="batch">Pesquisa em lote</option></select>
        <button disabled={busy || query.trim().length < 2} className="briefing-action briefing-action--primary"><Search className="h-4 w-4" /> {busy ? "Pesquisando..." : "Pesquisar fontes"}</button>
      </form>
      {message && <p role="status" className="mt-3 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-main)] px-3 py-2 text-sm text-[var(--text-secondary)]">{message}</p>}
      {batchRuns.length > 1 && <div className="mt-3 flex flex-wrap gap-2" aria-label="Resultados do lote">{batchRuns.map((item, index) => <button key={item.id} type="button" onClick={() => setRun(item)} className={`rounded-lg border px-3 py-2 text-xs font-bold ${run?.id === item.id ? "border-emerald-400 bg-emerald-400/10 text-emerald-200" : "border-[var(--border-soft)] text-[var(--text-secondary)]"}`}>{index + 1}. {item.query}</button>)}</div>}

      {run && <div className="mt-5 space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Score label="Confiança de identidade" value={run.identity_confidence} /><Score label="Confiança dos dados" value={run.data_confidence} /><Score label="Score comercial" value={run.commercial_score} />
        </div>
        {run.metadata?.providerWarning && <p className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">{run.metadata.providerWarning}</p>}
        <div className="grid gap-4 xl:grid-cols-2">
          <FindingList title="Fatos verificáveis" items={run.facts} /><FindingList title="Sinais públicos" items={run.signals} /><FindingList title="Inferências" items={run.inferences} /><FindingList title="Oportunidades" items={run.opportunities} />
        </div>
        <div className="rounded-xl border border-[var(--border-soft)] p-4"><h3 className="font-black text-[var(--text-primary)]">Fontes consultadas</h3><div className="mt-3 grid gap-2 md:grid-cols-2">{run.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="flex items-start gap-2 rounded-lg border border-[var(--border-soft)] p-3 text-sm text-[var(--text-secondary)] hover:border-emerald-400"><ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" /><span><strong className="block text-[var(--text-primary)]">{source.title}</strong>{source.publisher}</span></a>)}</div>{!run.sources.length && <p className="mt-2 text-sm text-[var(--text-muted)]">Nenhuma fonte pública verificável foi localizada; não aprove este resultado.</p>}</div>
        {run.status === "review" ? <button type="button" onClick={approve} disabled={busy || !run.sources.length} className="briefing-action briefing-action--primary"><CheckCircle2 className="h-4 w-4" /> Aprovar após revisão</button> : <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm font-bold text-emerald-200"><CheckCircle2 className="h-4 w-4" /> Pesquisa aprovada</span>}
      </div>}
    </section>
  );
}

function Score({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] p-4"><p className="text-xs text-[var(--text-muted)]">{label}</p><p className="mt-1 text-2xl font-black text-[var(--text-primary)]">{Math.max(0, Math.min(100, value || 0))}<small className="text-xs text-[var(--text-muted)]">/100</small></p></div>; }
function FindingList({ title, items }: { title: string; items: Finding[] }) { return <article className="rounded-xl border border-[var(--border-soft)] p-4"><h3 className="flex items-center gap-2 font-black text-[var(--text-primary)]"><Sparkles className="h-4 w-4 text-emerald-300" />{title}</h3><div className="mt-3 space-y-2">{items.map((item, index) => <div key={`${item.sourceUrl}-${index}`} className="rounded-lg bg-[var(--bg-main)] p-3 text-sm text-[var(--text-secondary)]"><p>{item.statement}</p><p className="mt-2 text-xs text-[var(--text-muted)]">Confiança {item.confidence}/100 · <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="text-emerald-300 hover:underline">abrir fonte</a></p></div>)}{!items.length && <p className="text-sm text-[var(--text-muted)]">Nenhum item comprovado nesta categoria.</p>}</div></article>; }
