"use client";

import Link from "@/components/NativeLink";
import { useDeferredValue, useMemo, useState } from "react";
import { Archive, CheckCircle2, Download, FilePlus2, FileText, RotateCcw, Search, Sparkles, Trash2, Upload } from "lucide-react";
import { getCommercialBriefingDependencies, purgeCommercialBriefing, restoreDeletedCommercialBriefing, trashCommercialBriefing, type CommercialBriefingSummary } from "@/lib/api";
import type { Company } from "@/lib/types";
import { useAuth } from "@/context/AuthProvider";

type Props = {
  initialBriefings: CommercialBriefingSummary[];
  companies: Company[];
  initialError?: string;
};

const tabs = [
  { id: "draft", label: "Em preenchimento" },
  { id: "completed", label: "Concluídos" },
  { id: "archived", label: "Arquivados" },
  { id: "trash", label: "Lixeira" },
  { id: "all", label: "Todos" }
] as const;

export function BriefingsClient({ initialBriefings, companies, initialError = "" }: Props) {
  const { user } = useAuth();
  const [briefings, setBriefings] = useState(initialBriefings);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("draft");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const [creating, setCreating] = useState(false);
  const [companyId, setCompanyId] = useState(companies[0]?.id || "");
  const [priority, setPriority] = useState<CommercialBriefingSummary["priority"]>("normal");
  const [notice, setNotice] = useState(initialError);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<{ valid: number; invalid: Array<{ row: number; errors: string[] }> } | null>(null);
  const [importing, setImporting] = useState(false);

  const metrics = useMemo(() => ({
    total: briefings.length,
    draft: briefings.filter((item) => item.status === "draft").length,
    completed: briefings.filter((item) => item.status === "completed").length,
    urgent: briefings.filter((item) => item.status === "draft" && (item.priority === "urgent" || item.priority === "high")).length
  }), [briefings]);

  const visible = useMemo(() => briefings.filter((item) => {
    if (activeTab !== "all" && (activeTab === "trash" ? !item.is_deleted : item.status !== activeTab || item.is_deleted)) return false;
    if (!deferredSearch) return true;
    const company = item.nodere_companies?.name || "";
    return `${item.code} ${item.title} ${company}`.toLowerCase().includes(deferredSearch);
  }), [activeTab, briefings, deferredSearch]);

  async function createBriefing() {
    if (!companyId || creating) return;
    setCreating(true);
    setNotice("");
    try {
      const response = await fetch("/api/backend/briefings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ companyId, priority })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || payload.error || "Não foi possível criar o briefing.");
      const company = companies.find((item) => item.id === companyId);
      setBriefings((current) => [{ ...payload, nodere_companies: company ? { id: company.id, name: company.name, category: company.category, city: company.city, state: company.state } : null }, ...current]);
      window.location.assign(`/crm/briefings/${encodeURIComponent(payload.id)}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Falha ao criar briefing.");
    } finally {
      setCreating(false);
    }
  }

  async function previewImport(file?: File) {
    if (!file) return;
    setImportFile(file);
    setImporting(true);
    setNotice("");
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/backend/briefings/import.xlsx?preview=true", { method: "POST", credentials: "include", body });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "Não foi possível validar a planilha.");
      setImportPreview({ valid: Number(payload.valid || 0), invalid: payload.invalid || [] });
      setNotice(payload.invalid?.length ? "A planilha possui erros. Corrija as linhas indicadas antes de importar." : `Prévia aprovada: ${payload.valid} linha(s) pronta(s).`);
    } catch (error) {
      setImportPreview(null);
      setNotice(error instanceof Error ? error.message : "Falha na prévia da importação.");
    } finally {
      setImporting(false);
    }
  }

  async function confirmImport() {
    if (!importFile || !importPreview || importPreview.invalid.length || !window.confirm(`Importar ${importPreview.valid} briefing(s) agora?`)) return;
    setImporting(true);
    try {
      const body = new FormData();
      body.append("file", importFile);
      const response = await fetch("/api/backend/briefings/import.xlsx", { method: "POST", credentials: "include", headers: { "X-Import-Batch": `web-${crypto.randomUUID()}` }, body });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok && response.status !== 207) throw new Error(payload.message || "A importação falhou.");
      const failed = (payload.results || []).filter((item: { status: string }) => item.status === "failed").length;
      setNotice(failed ? `Importação concluída com ${failed} falha(s). Consulte o relatório retornado.` : "Importação concluída sem falhas.");
      setImportFile(null);
      setImportPreview(null);
      window.setTimeout(() => window.location.reload(), 700);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Falha na importação.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-5 p-4 md:p-8">
      <header className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-5 shadow-sm md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--brand-primary)]">CRM comercial</p>
            <h1 className="mt-2 font-heading text-2xl font-black text-[var(--text-primary)] md:text-3xl">Briefings Comerciais</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">Preparação comercial versionada, vinculada à ficha 360 da empresa e pronta para continuidade, auditoria e geração de PDF.</p>
          </div>
          <div className="flex flex-wrap gap-2"><a href="/api/backend/briefings/export.xlsx" className="briefing-action"><Download /> Exportar XLSX</a><a href="/api/backend/briefings/export.csv" className="briefing-action"><Download /> CSV</a><a href="/api/backend/briefings/import-template.xlsx" className="briefing-action"><FileText /> Modelo XLSX</a><label className="briefing-action cursor-pointer"><Upload /> {importing ? "Validando..." : "Importar XLSX"}<input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" disabled={importing} className="sr-only" onChange={(event) => { void previewImport(event.target.files?.[0]); event.target.value = ""; }} /></label></div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Total" value={metrics.total} icon={FileText} />
          <Metric label="Em preenchimento" value={metrics.draft} icon={FilePlus2} />
          <Metric label="Concluídos" value={metrics.completed} icon={CheckCircle2} />
          <Metric label="Alta prioridade" value={metrics.urgent} icon={Sparkles} />
        </div>
      </header>

      <section className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-5">
        <h2 className="font-heading text-lg font-black text-[var(--text-primary)]">Novo briefing</h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto]">
          <label className="space-y-1 text-sm font-bold text-[var(--text-secondary)]">
            Empresa
            <select value={companyId} onChange={(event) => setCompanyId(event.target.value)} className="min-h-11 w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-input)] px-3 text-[var(--text-primary)]">
              {!companies.length && <option value="">Nenhuma empresa ativa disponível</option>}
              {companies.map((company) => <option key={company.id} value={company.id}>{company.name} · {company.city || "sem cidade"}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm font-bold text-[var(--text-secondary)]">
            Prioridade
            <select value={priority} onChange={(event) => setPriority(event.target.value as CommercialBriefingSummary["priority"])} className="min-h-11 w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-input)] px-3 text-[var(--text-primary)]">
              <option value="low">Baixa</option><option value="normal">Normal</option><option value="high">Alta</option><option value="urgent">Urgente</option>
            </select>
          </label>
          <button type="button" onClick={createBriefing} disabled={creating || !companyId} className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--brand-primary)] px-5 text-sm font-black text-white disabled:opacity-50">
            <FilePlus2 className="h-4 w-4" /> {creating ? "Criando..." : "Criar briefing"}
          </button>
        </div>
        {notice && <p role="alert" className="mt-3 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">{notice}</p>}
        {importPreview && <div className="mt-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] p-4 text-sm"><strong>Prévia: {importPreview.valid} válida(s), {importPreview.invalid.length} inválida(s).</strong>{importPreview.invalid.slice(0, 10).map((item) => <p key={item.row} className="mt-1 text-[var(--text-secondary)]">Linha {item.row}: {item.errors.join("; ")}</p>)}{!importPreview.invalid.length && <button type="button" onClick={confirmImport} disabled={importing} className="briefing-action briefing-action--primary mt-3">Confirmar importação</button>}</div>}
      </section>

      <section className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Status dos briefings">
            {tabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} className={`rounded-lg border px-3 py-2 text-sm font-bold ${activeTab === tab.id ? "border-[var(--brand-primary)] bg-[var(--brand-glow-dim)] text-[var(--text-primary)]" : "border-[var(--border-soft)] text-[var(--text-secondary)]"}`}>{tab.label}</button>)}
          </div>
          <label className="flex min-h-10 min-w-0 items-center gap-2 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-input)] px-3 sm:min-w-72">
            <Search className="h-4 w-4 text-[var(--text-muted)]" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar empresa, código ou título" className="min-w-0 flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none" />
          </label>
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-2">
          {visible.map((briefing) => <BriefingCard key={briefing.id} briefing={briefing} role={user?.role} onChanged={(id, next) => setBriefings((current) => next ? current.map((item) => item.id === id ? next : item) : current.filter((item) => item.id !== id))} />)}
        </div>
        {!visible.length && <div className="mt-4 rounded-xl border border-dashed border-[var(--border-soft)] p-8 text-center text-sm text-[var(--text-muted)]">Nenhum briefing encontrado neste filtro.</div>}
      </section>
    </div>
  );
}

function BriefingCard({ briefing, role, onChanged }: { briefing: CommercialBriefingSummary; role?: string; onChanged: (id: string, next?: CommercialBriefingSummary) => void }) {
  const companyName = briefing.nodere_companies?.name || "Empresa vinculada";
  const canDelete = role === "owner" || role === "admin";

  async function moveToTrash() {
    const impact = await getCommercialBriefingDependencies(briefing.id).catch(() => null);
    const reason = window.prompt(`Mover ${briefing.code} para a lixeira por 30 dias?\n${impact?.total || 0} dependência(s) serão preservadas.\n\nInforme o motivo:`)?.trim();
    if (!reason || reason.length < 3 || !window.confirm("Li o impacto e confirmo a movimentação para a lixeira.")) return;
    const updated = await trashCommercialBriefing(briefing.id, reason);
    onChanged(briefing.id, { ...briefing, ...updated, status: "trash", is_deleted: true });
  }

  async function restore() {
    const reason = window.prompt(`Motivo para restaurar ${briefing.code}`)?.trim();
    if (!reason || reason.length < 3) return;
    const updated = await restoreDeletedCommercialBriefing(briefing.id, reason);
    onChanged(briefing.id, { ...briefing, ...updated, status: "draft", is_deleted: false });
  }

  async function purge() {
    const impact = await getCommercialBriefingDependencies(briefing.id).catch(() => null);
    if (impact?.total) return window.alert(`Purge bloqueado por ${impact.total} dependência(s).`);
    const confirmation = window.prompt(`Exclusão irreversível. Digite o código exatamente:\n${briefing.code}`);
    const reason = window.prompt("Justificativa obrigatória (mínimo de 10 caracteres)")?.trim();
    if (confirmation !== briefing.code || !reason || reason.length < 10 || !window.confirm("Confirmar exclusão definitiva?")) return;
    await purgeCommercialBriefing(briefing.id, confirmation, reason);
    onChanged(briefing.id);
  }
  return (
    <article className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] p-4 transition hover:border-[var(--brand-primary)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-wide text-[var(--brand-primary)]">{briefing.code}</p>
          <h3 className="mt-1 truncate font-heading text-lg font-black text-[var(--text-primary)]">{companyName}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-[var(--text-secondary)]">{briefing.title}</p>
        </div>
        <Status status={briefing.is_deleted ? "trash" : briefing.status} />
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--bg-hover)]"><div className="h-full rounded-full bg-[var(--brand-primary)]" style={{ width: `${Math.max(0, Math.min(100, briefing.completion_percent || 0))}%` }} /></div>
      <div className="mt-2 flex items-center justify-between text-xs text-[var(--text-muted)]"><span>{briefing.completion_percent || 0}% preenchido</span><span>Versão {briefing.current_version || 1}</span></div>
      <div className="mt-4 grid gap-2 text-xs text-[var(--text-secondary)] sm:grid-cols-2">
        <span>Prioridade: <strong>{priorityLabel(briefing.priority)}</strong></span>
        <span>Atualizado: <strong>{dateLabel(briefing.updated_at)}</strong></span>
        <span className="sm:col-span-2">Próxima ação: <strong>{briefing.next_action || "Não definida"}</strong></span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {!briefing.is_deleted && <Link href={`/crm/briefings/${encodeURIComponent(briefing.id)}`} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-[var(--brand-primary)] px-3 text-sm font-black text-white"><FileText className="h-4 w-4" /> {briefing.status === "draft" ? "Continuar" : "Visualizar"}</Link>}
        {briefing.status === "archived" && <span className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)]"><Archive className="h-4 w-4" /> preservado no histórico</span>}
        {canDelete && !briefing.is_deleted && <button type="button" onClick={() => void moveToTrash()} className="briefing-action border-red-400/40 text-red-300"><Trash2 className="h-4 w-4" /> Lixeira</button>}
        {canDelete && briefing.is_deleted && <button type="button" onClick={() => void restore()} className="briefing-action briefing-action--primary"><RotateCcw className="h-4 w-4" /> Restaurar</button>}
        {canDelete && briefing.is_deleted && <button type="button" onClick={() => void purge()} disabled={Boolean(briefing.legal_hold) || !retentionExpired(briefing.retention_until)} className="briefing-action border-red-400/40 text-red-300"><Trash2 className="h-4 w-4" /> Excluir definitivamente</button>}
      </div>
    </article>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: typeof FileText }) {
  return <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] p-4"><div className="flex items-center justify-between"><span className="text-sm font-bold text-[var(--text-secondary)]">{label}</span><Icon className="h-5 w-5 text-[var(--brand-primary)]" /></div><strong className="mt-2 block font-heading text-2xl text-[var(--text-primary)]">{value}</strong></div>;
}

function Status({ status }: { status: CommercialBriefingSummary["status"] }) {
  const labels = { draft: "Rascunho", completed: "Concluído", archived: "Arquivado", trash: "Lixeira" };
  return <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-black ${status === "completed" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : status === "archived" ? "border-slate-500/40 bg-slate-500/10 text-slate-300" : status === "trash" ? "border-red-500/40 bg-red-500/10 text-red-300" : "border-amber-500/40 bg-amber-500/10 text-amber-300"}`}>{labels[status]}</span>;
}

function priorityLabel(priority: CommercialBriefingSummary["priority"]) {
  return ({ low: "Baixa", normal: "Normal", high: "Alta", urgent: "Urgente" } as const)[priority] || priority;
}

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(date);
}

function retentionExpired(value?: string | null) { return Boolean(value && new Date(value).getTime() <= Date.now()); }
