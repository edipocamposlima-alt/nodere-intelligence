"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Archive, ArrowLeft, CheckCircle2, Download, FilePlus2, History, Mail, Paperclip, RefreshCw, Save, Sparkles, Trash2, Upload } from "lucide-react";
import { fetchAuthenticatedFile, getCommercialBriefingDependencies, trashCommercialBriefing, type BriefingFieldDefinition, type CommercialBriefingDetail } from "@/lib/api";
import { useAuth } from "@/context/AuthProvider";

type Conflict = { fieldKey: string; label: string; currentValue: unknown; collectedValue: unknown; decision?: "keep" | "replace" | "append" };

export function BriefingEditor({ initialBriefing }: { initialBriefing: CommercialBriefingDetail }) {
  const { user } = useAuth();
  const [briefing, setBriefing] = useState(initialBriefing);
  const [answers, setAnswers] = useState<Record<string, unknown>>(initialBriefing.answers || {});
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [notice, setNotice] = useState("");
  const [recoverableDraft, setRecoverableDraft] = useState<Record<string, unknown> | null>(null);
  const [assistantText, setAssistantText] = useState("");
  const [assistantBusy, setAssistantBusy] = useState(false);
  const [assistantSuggestions, setAssistantSuggestions] = useState<Record<string, unknown> | null>(null);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [conflictBusy, setConflictBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const localKey = `nodere:briefing-draft:${briefing.id}`;

  const sections = useMemo(() => {
    const grouped = new Map<string, BriefingFieldDefinition[]>();
    for (const field of briefing.fields) grouped.set(field.section, [...(grouped.get(field.section) || []), field]);
    return Array.from(grouped.entries());
  }, [briefing.fields]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(localKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { answers?: Record<string, unknown>; savedAt?: string };
      if (parsed.answers && parsed.savedAt && new Date(parsed.savedAt).getTime() > new Date(briefing.updated_at).getTime()) setRecoverableDraft(parsed.answers);
    } catch {
      setRecoverableDraft(null);
    }
  }, [briefing.updated_at, localKey]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      localStorage.setItem(localKey, JSON.stringify({ answers, savedAt: new Date().toISOString(), version: briefing.current_version }));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [answers, briefing.current_version, localKey]);

  async function save(changed: Record<string, unknown>, expected = briefing.updated_at) {
    if (saveState === "saving") return;
    setSaveState("saving");
    setNotice("");
    try {
      const response = await fetch(`/api/backend/briefings/${encodeURIComponent(briefing.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ answers: changed, expectedUpdatedAt: expected })
      });
      const payload = await response.json().catch(() => ({}));
      if (response.status === 409) {
        setNotice("Este briefing foi atualizado em outra sessão. Recarregue os dados ou salve novamente após revisar o conflito.");
        setSaveState("error");
        return;
      }
      if (!response.ok) throw new Error(payload.message || payload.error || "Não foi possível salvar o briefing.");
      setBriefing((current) => ({ ...current, ...payload, answers: { ...current.answers, ...changed } }));
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 1_500);
    } catch (error) {
      setSaveState("error");
      setNotice(error instanceof Error ? error.message : "Falha ao salvar briefing.");
    }
  }

  async function reload() {
    setNotice("");
    const response = await fetch(`/api/backend/briefings/${encodeURIComponent(briefing.id)}`, { cache: "no-store", credentials: "include" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return setNotice(payload.message || "Não foi possível recarregar.");
    setBriefing(payload);
    setAnswers(payload.answers || {});
    setSaveState("idle");
  }

  async function action(path: string, body: Record<string, unknown> = {}) {
    setNotice("");
    const response = await fetch(`/api/backend/briefings/${encodeURIComponent(briefing.id)}/${path}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(body)
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message || payload.error || "A ação não foi concluída.");
    setBriefing((current) => ({ ...current, ...payload }));
    return payload;
  }

  async function complete() {
    if (!window.confirm("Concluir este briefing e removê-lo da fila de preenchimento?")) return;
    try {
      await save(answers);
      const comparison = await fetch(`/api/backend/briefings/${encodeURIComponent(briefing.id)}/compare`, { cache: "no-store", credentials: "include" });
      const comparisonPayload = await comparison.json().catch(() => ({}));
      if (!comparison.ok) throw new Error(comparisonPayload.message || "Não foi possível validar os conflitos.");
      if (comparisonPayload.conflicts?.length) {
        setConflicts(comparisonPayload.conflicts.map((item: Conflict) => ({ ...item, decision: "keep" })));
        setNotice("Há conflitos com a ficha 360. Revise as decisões abaixo; depois conclua novamente.");
        return;
      }
      const mapping = await fetch(`/api/backend/briefings/${encodeURIComponent(briefing.id)}/apply-mappings`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ decisions: [] })
      });
      const mappingPayload = await mapping.json().catch(() => ({}));
      if (!mapping.ok) throw new Error(mappingPayload.message || "Não foi possível sincronizar a ficha do cliente.");
      await action("complete", { reason: "Conclusão confirmada pelo usuário" });
      setNotice("Briefing concluído, ficha 360 sincronizada e próxima ação atualizada.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Falha ao concluir."); }
  }

  async function createVersion() {
    if (!window.confirm("Criar uma nova versão editável preservando o snapshot atual?")) return;
    try { await action("version", { reason: "Nova versão solicitada pelo usuário" }); setNotice("Nova versão criada."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Falha ao criar versão."); }
  }

  async function toggleArchive() {
    const restoring = briefing.status === "archived";
    if (!window.confirm(restoring ? "Restaurar este briefing como rascunho?" : "Arquivar este briefing sem apagá-lo?")) return;
    try { await action(restoring ? "restore" : "archive", { reason: restoring ? "Restauração manual" : "Arquivamento manual" }); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Falha ao alterar arquivamento."); }
  }

  async function moveToTrash() {
    const impact = await getCommercialBriefingDependencies(briefing.id).catch(() => null);
    const reason = window.prompt(`Mover ${briefing.code} para a lixeira por 30 dias?\n${impact?.total || 0} dependência(s) serão preservadas.\n\nInforme o motivo:`)?.trim();
    if (!reason || reason.length < 3 || !window.confirm("Li o impacto, entendi que o briefing sairá da operação ativa e confirmo a ação.")) return;
    try {
      await trashCommercialBriefing(briefing.id, reason);
      window.location.assign("/crm/briefings");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Não foi possível mover o briefing para a lixeira."); }
  }

  function updateField(key: string, value: unknown) {
    setAnswers((current) => ({ ...current, [key]: value }));
    setSaveState("idle");
  }

  async function assistedExtraction() {
    if (assistantText.trim().length < 20) return setNotice("Informe um relato comercial mais completo.");
    if (!window.confirm("A extração assistida usa a NODERE AI e consome créditos. Continuar sem salvar automaticamente?")) return;
    setAssistantBusy(true);
    setNotice("");
    try {
      const response = await fetch(`/api/backend/briefings/${encodeURIComponent(briefing.id)}/assist`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ transcript: assistantText, confirmed: true })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || payload.error || "A extração assistida falhou.");
      setAssistantSuggestions(payload.suggestions || {});
      setNotice(`Sugestões geradas sem alteração automática. Crédito cobrado: ${Number(payload.chargedCredit || 0).toLocaleString("pt-BR", { maximumFractionDigits: 4 })}.`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Falha na extração assistida."); }
    finally { setAssistantBusy(false); }
  }

  function applyAssistantSuggestions() {
    if (!assistantSuggestions) return;
    setAnswers((current) => ({ ...current, ...assistantSuggestions }));
    setAssistantSuggestions(null);
    setNotice("Sugestões aplicadas localmente. Revise os campos e clique em Salvar.");
  }

  async function compare() {
    setConflictBusy(true);
    setNotice("");
    try {
      const response = await fetch(`/api/backend/briefings/${encodeURIComponent(briefing.id)}/compare`, { cache: "no-store", credentials: "include" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "Não foi possível comparar.");
      setConflicts((payload.conflicts || []).map((item: Conflict) => ({ ...item, decision: "keep" })));
      if (!payload.conflicts?.length) setNotice("Nenhum conflito entre o briefing e a ficha atual da empresa.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Falha na comparação."); }
    finally { setConflictBusy(false); }
  }

  async function applyConflicts() {
    try {
      const response = await fetch(`/api/backend/briefings/${encodeURIComponent(briefing.id)}/apply-mappings`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ decisions: conflicts.map(({ fieldKey, decision }) => ({ fieldKey, decision })) })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "Não foi possível aplicar as decisões.");
      setConflicts([]);
      setNotice("Decisões aplicadas à ficha da empresa com registro de auditoria.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Falha ao aplicar conflitos."); }
  }

  async function uploadAttachment(file?: File) {
    if (!file) return;
    const body = new FormData();
    body.append("file", file);
    const response = await fetch(`/api/backend/briefings/${encodeURIComponent(briefing.id)}/attachments`, { method: "POST", credentials: "include", body });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return setNotice(payload.message || "Não foi possível anexar o arquivo.");
    setBriefing((current) => ({ ...current, attachments: [payload, ...current.attachments] }));
    setNotice("Arquivo anexado com checksum e armazenamento privado.");
  }

  const companyName = String(answers.company_name || briefing.nodere_companies?.name || briefing.title);

  return (
    <div className="space-y-5 p-4 md:p-8">
      <header className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-5 md:p-7">
        <Link href="/crm/briefings" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--brand-primary)]"><ArrowLeft className="h-4 w-4" /> Voltar aos briefings</Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--brand-primary)]">{briefing.code} · versão {briefing.current_version}</p>
            <h1 className="mt-2 font-heading text-2xl font-black text-[var(--text-primary)] md:text-3xl">{companyName}</h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{briefing.title}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => save(answers)} disabled={saveState === "saving"} className="briefing-action briefing-action--primary"><Save className="h-4 w-4" /> {saveState === "saving" ? "Salvando..." : saveState === "saved" ? "Salvo" : "Salvar rascunho"}</button>
            <button type="button" onClick={complete} className="briefing-action"><CheckCircle2 className="h-4 w-4" /> Concluir</button>
            <button type="button" onClick={createVersion} className="briefing-action"><FilePlus2 className="h-4 w-4" /> Nova versão</button>
            <button type="button" onClick={() => fetchAuthenticatedFile(`/briefings/${encodeURIComponent(briefing.id)}/pdf`, { fileName: `${briefing.code}.pdf` }).catch((error) => setNotice(error instanceof Error ? error.message : "Falha no PDF."))} className="briefing-action"><Download className="h-4 w-4" /> PDF</button>
            {briefing.company_id && <Link href={`/crm/communications?companyId=${encodeURIComponent(briefing.company_id)}`} className="briefing-action"><Mail className="h-4 w-4" /> Comunicar</Link>}
            <button type="button" onClick={toggleArchive} className="briefing-action"><Archive className="h-4 w-4" /> {briefing.status === "archived" ? "Restaurar" : "Arquivar"}</button>
            {(user?.role === "owner" || user?.role === "admin") && <button type="button" onClick={() => void moveToTrash()} className="briefing-action border-red-400/40 text-red-300"><Trash2 className="h-4 w-4" /> Lixeira</button>}
          </div>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-[var(--bg-hover)]"><div className="h-full rounded-full bg-[var(--brand-primary)]" style={{ width: `${briefing.completion_percent || 0}%` }} /></div>
        <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-[var(--text-muted)]"><span>{briefing.completion_percent || 0}% preenchido</span><span>Salvamento no blur + botão · estado: {briefing.status}</span></div>
        {notice && <div role="status" className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200"><span>{notice}</span>{saveState === "error" && <button type="button" onClick={reload} className="inline-flex items-center gap-1 font-black"><RefreshCw className="h-4 w-4" /> Recarregar</button>}</div>}
        {recoverableDraft && <div className="mt-4 rounded-lg border border-[var(--brand-primary)] bg-[var(--brand-glow-dim)] p-3 text-sm text-[var(--text-primary)]"><strong>Rascunho local mais recente encontrado.</strong><div className="mt-2 flex gap-2"><button type="button" onClick={() => { setAnswers(recoverableDraft); setRecoverableDraft(null); }} className="briefing-action briefing-action--primary">Recuperar</button><button type="button" onClick={() => { localStorage.removeItem(localKey); setRecoverableDraft(null); }} className="briefing-action">Descartar local</button></div></div>}
      </header>

      <section className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-heading text-lg font-black text-[var(--text-primary)]">Preenchimento assistido</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">Cole ou dite um relato completo. A IA apenas sugere campos; você revisa antes de aplicar e salvar.</p></div><Sparkles className="h-6 w-6 text-[var(--brand-primary)]" /></div>
        <textarea value={assistantText} onChange={(event) => setAssistantText(event.target.value)} rows={4} placeholder="Ex.: A empresa atua no segmento..." className="mt-4 w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-input)] p-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)]" />
        <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={assistedExtraction} disabled={assistantBusy} className="briefing-action briefing-action--primary"><Sparkles className="h-4 w-4" /> {assistantBusy ? "Extraindo..." : "Extrair sugestões com IA"}</button>{assistantSuggestions && <button type="button" onClick={applyAssistantSuggestions} className="briefing-action"><CheckCircle2 className="h-4 w-4" /> Aplicar {Object.keys(assistantSuggestions).length} sugestões</button>}</div>
      </section>

      <section className="space-y-4">
        {sections.map(([section, fields]) => (
          <article key={section} className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-5">
            <h2 className="font-heading text-lg font-black text-[var(--brand-primary)]">{section}</h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {fields.map((field) => <BriefingField key={field.key} field={field} value={answers[field.key]} disabled={briefing.status === "archived"} onChange={(value) => updateField(field.key, value)} onBlur={() => save({ [field.key]: answers[field.key] })} />)}
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-5">
          <div className="flex items-center justify-between"><div><h2 className="font-heading text-lg font-black text-[var(--text-primary)]">Conflitos com a ficha 360</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">Escolha manter, substituir ou adicionar antes de alterar o cadastro da empresa.</p></div><button type="button" onClick={compare} disabled={conflictBusy} className="briefing-action"><RefreshCw className="h-4 w-4" /> Comparar</button></div>
          <div className="mt-4 space-y-3">{conflicts.map((conflict, index) => <div key={conflict.fieldKey} className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-main)] p-3 text-sm"><strong>{conflict.label}</strong><p className="mt-2 text-[var(--text-secondary)]">Atual: {formatValue(conflict.currentValue)}</p><p className="mt-1 text-[var(--text-secondary)]">Coletado: {formatValue(conflict.collectedValue)}</p><select value={conflict.decision} onChange={(event) => setConflicts((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, decision: event.target.value as Conflict["decision"] } : item))} className="mt-3 min-h-10 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-input)] px-3 text-[var(--text-primary)]"><option value="keep">Manter ficha atual</option><option value="replace">Substituir pela coleta</option><option value="append">Adicionar ao valor atual</option></select></div>)}{conflicts.length > 0 && <button type="button" onClick={applyConflicts} className="briefing-action briefing-action--primary">Aplicar decisões</button>}</div>
        </article>

        <article className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-5">
          <div className="flex items-center justify-between"><div><h2 className="font-heading text-lg font-black text-[var(--text-primary)]">Anexos e histórico</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">Arquivos privados com checksum; versões preservadas para auditoria.</p></div><button type="button" onClick={() => fileInputRef.current?.click()} className="briefing-action"><Upload className="h-4 w-4" /> Anexar</button></div>
          <input ref={fileInputRef} type="file" className="hidden" accept="image/jpeg,image/png,image/webp,application/pdf,.doc,.docx,.txt,audio/*" onChange={(event) => { void uploadAttachment(event.target.files?.[0]); event.target.value = ""; }} />
          <div className="mt-4 space-y-2">{briefing.attachments.map((file) => <div key={file.id} className="flex items-center gap-3 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-main)] p-3 text-sm"><Paperclip className="h-4 w-4 text-[var(--brand-primary)]" /><span className="min-w-0 flex-1 truncate">{file.original_name}</span><small className="text-[var(--text-muted)]">{formatBytes(file.size_bytes)}</small><button type="button" onClick={() => fetchAuthenticatedFile(`/briefings/${encodeURIComponent(briefing.id)}/attachments/${encodeURIComponent(file.id)}/download`, { fileName: file.original_name }).catch((error) => setNotice(error instanceof Error ? error.message : "Falha no anexo."))} aria-label={`Baixar ${file.original_name}`} title={`Baixar ${file.original_name}`} className="briefing-action"><Download /></button></div>)}{!briefing.attachments.length && <p className="text-sm text-[var(--text-muted)]">Nenhum anexo.</p>}</div>
          <div className="mt-5 border-t border-[var(--border-soft)] pt-4"><h3 className="flex items-center gap-2 font-heading font-black text-[var(--text-primary)]"><History className="h-4 w-4" /> Versões</h3><div className="mt-3 space-y-2">{briefing.versions.map((version) => <div key={version.id} className="rounded-lg border border-[var(--border-soft)] p-3 text-sm"><strong>Versão {version.version}</strong><p className="mt-1 text-xs text-[var(--text-muted)]">{version.change_reason || version.change_type} · {dateLabel(version.created_at)}</p></div>)}</div></div>
        </article>
      </section>

    </div>
  );
}

function BriefingField({ field, value, disabled, onChange, onBlur }: { field: BriefingFieldDefinition; value: unknown; disabled: boolean; onChange: (value: unknown) => void; onBlur: () => void }) {
  const text = Array.isArray(value) ? value.join(", ") : String(value ?? "");
  const common = "min-h-11 w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-input)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)] disabled:opacity-60";
  return <label className={`space-y-1 text-sm font-bold text-[var(--text-secondary)] ${field.type === "textarea" ? "lg:col-span-2" : ""}`}><span>{field.label}{field.required ? " *" : ""}</span>{field.type === "textarea" ? <textarea value={text} disabled={disabled} rows={4} onChange={(event) => onChange(event.target.value)} onBlur={onBlur} className={`${common} py-3`} /> : field.type === "select" ? <select value={text} disabled={disabled} onChange={(event) => onChange(event.target.value)} onBlur={onBlur} className={common}><option value="">Selecione</option>{field.options?.map((option) => <option key={option} value={option}>{option}</option>)}</select> : <input type={field.type === "tags" ? "text" : field.type} value={text} disabled={disabled} onChange={(event) => onChange(field.type === "tags" ? event.target.value.split(",").map((item) => item.trim()).filter(Boolean) : event.target.value)} onBlur={onBlur} className={common} />}</label>;
}

function formatValue(value: unknown) { return Array.isArray(value) ? value.join(", ") : String(value ?? "Não informado"); }
function formatBytes(value: number) { return value >= 1024 * 1024 ? `${(value / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(value / 1024))} KB`; }
function dateLabel(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(date); }
