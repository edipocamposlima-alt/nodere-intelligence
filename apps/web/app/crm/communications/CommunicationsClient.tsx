"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, ExternalLink, FileUp, History, Mail, MessageCircle, Paperclip, RefreshCw, Save, Send, ShieldCheck } from "lucide-react";
import type { Company } from "@/lib/types";

const RichTextEditor = dynamic(() => import("@/components/RichTextEditor").then((module) => module.RichTextEditor), { ssr: false });
const RichTextPreview = dynamic(() => import("@/components/RichTextEditor").then((module) => module.RichTextPreview), { ssr: false });

type Channel = "email" | "whatsapp";
type IntegrationStatus = { provider: string; status: string; account_label?: string; last_error?: string };
type Template = { id: string; name: string; channel: Channel | "internal"; subject?: string; body_text?: string; body_html?: string; category?: string };
type Thread = {
  id: string;
  channel: Channel | "internal";
  subject?: string;
  status: string;
  last_event_at?: string;
  nodere_companies?: { id: string; name: string } | null;
};
type Event = { id: string; event_type: string; direction: string; status: string; subject?: string; body_text?: string; body_html?: string; occurred_at: string };
type Draft = { id: string; thread_id: string; channel: Channel; status: string };
type AttachmentOption = { ref: string; source: "briefing" | "company-file"; name: string; mimeType?: string; sizeBytes: number; context: string };

export function CommunicationsClient({ companies }: { companies: Company[] }) {
  const [status, setStatus] = useState<Record<string, IntegrationStatus>>({});
  const [templates, setTemplates] = useState<Template[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [activeThreadId, setActiveThreadId] = useState("");
  const [channel, setChannel] = useState<Channel>("email");
  const [companyId, setCompanyId] = useState(companies[0]?.id || "");
  const [recipient, setRecipient] = useState(companies[0]?.email || "");
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [templateId, setTemplateId] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [assistedPending, setAssistedPending] = useState<{ outboxId: string; url: string } | null>(null);
  const [attachments, setAttachments] = useState<AttachmentOption[]>([]);
  const [selectedAttachmentRefs, setSelectedAttachmentRefs] = useState<string[]>([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  const availableTemplates = useMemo(() => templates.filter((item) => item.channel === channel), [channel, templates]);
  const selectedCompany = companies.find((item) => item.id === companyId);

  useEffect(() => { void refresh(); }, []);

  useEffect(() => {
    const requestedCompanyId = new URLSearchParams(window.location.search).get("companyId");
    if (requestedCompanyId && companies.some((company) => company.id === requestedCompanyId)) {
      setCompanyId(requestedCompanyId);
    }
  }, [companies]);

  useEffect(() => {
    if (!selectedCompany) return;
    setRecipient(channel === "email" ? selectedCompany.email || "" : selectedCompany.whatsapp || selectedCompany.phone || "");
  }, [channel, selectedCompany]);

  useEffect(() => {
    setSelectedAttachmentRefs([]);
    if (!companyId) return void setAttachments([]);
    void refreshAttachments(companyId);
  }, [companyId]);

  useEffect(() => {
    if (!activeThreadId) return void setEvents([]);
    void request<Event[]>(`/threads/${encodeURIComponent(activeThreadId)}/events`).then(setEvents).catch((error) => setNotice(error.message));
  }, [activeThreadId]);

  async function refresh() {
    setBusy(true);
    try {
      const [nextStatus, nextTemplates, nextThreads] = await Promise.all([
        request<Record<string, IntegrationStatus>>("/status"),
        request<Template[]>("/templates"),
        request<Thread[]>("/threads")
      ]);
      setStatus(nextStatus);
      setTemplates(nextTemplates);
      setThreads(nextThreads);
      if (!activeThreadId && nextThreads[0]) setActiveThreadId(nextThreads[0].id);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível atualizar as comunicações.");
    } finally {
      setBusy(false);
    }
  }

  async function refreshAttachments(targetCompanyId = companyId) {
    if (!targetCompanyId) return setAttachments([]);
    try {
      setAttachments(await request<AttachmentOption[]>(`/attachments?companyId=${encodeURIComponent(targetCompanyId)}`));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível listar os anexos.");
    }
  }

  async function uploadAttachment(file?: File) {
    if (!file || !companyId) return;
    setUploadingAttachment(true);
    setNotice("");
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch(`/api/backend/companies/${encodeURIComponent(companyId)}/files`, { method: "POST", credentials: "include", body: form });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "Não foi possível anexar o arquivo à empresa.");
      await refreshAttachments(companyId);
      if (payload.id) setSelectedAttachmentRefs((current) => [...new Set([...current, `company-file:${payload.id}`])]);
      setNotice("Arquivo protegido e selecionado para este e-mail.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível anexar o arquivo.");
    } finally {
      setUploadingAttachment(false);
    }
  }

  function applyTemplate(id: string) {
    setTemplateId(id);
    const template = templates.find((item) => item.id === id);
    if (!template) return;
    setSubject(template.subject || "");
    setBodyHtml(template.body_html || template.body_text || "");
  }

  async function saveDraft() {
    if (!recipient.trim() || !bodyHtml.trim()) return setNotice("Informe destinatário e mensagem antes de salvar.");
    setBusy(true);
    setNotice("");
    try {
      const created = await request<Draft>("/compose", {
        method: "POST",
        body: JSON.stringify({
          companyId: companyId || null,
          channel,
          recipient,
          subject: channel === "email" ? subject : "",
          bodyHtml,
          attachmentRefs: channel === "email" ? selectedAttachmentRefs : [],
          consentConfirmed,
          idempotencyKey: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`
        })
      });
      setDraft(created);
      setActiveThreadId(created.thread_id);
      setNotice("Rascunho protegido na outbox. O envio ainda não ocorreu.");
      await refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível salvar o rascunho.");
    } finally {
      setBusy(false);
    }
  }

  async function saveAsTemplate() {
    if (!bodyHtml.trim()) return setNotice("Escreva a mensagem antes de criar um modelo.");
    const name = window.prompt("Nome do novo modelo", subject || `Modelo ${channel === "email" ? "de e-mail" : "de WhatsApp"}`)?.trim();
    if (!name) return;
    setBusy(true);
    try {
      const template = await request<Template>("/templates", { method: "POST", body: JSON.stringify({ name, channel, subject: channel === "email" ? subject : "", bodyHtml }) });
      setTemplates((current) => [template, ...current]);
      setTemplateId(template.id);
      setNotice("Modelo salvo e disponível para reutilização.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível salvar o modelo.");
    } finally {
      setBusy(false);
    }
  }

  async function approveDraft() {
    if (!draft || !window.confirm(channel === "email" ? "Confirmar o envio real deste e-mail?" : "Abrir o WhatsApp com a mensagem pronta? O envio deverá ser confirmado depois.")) return;
    setBusy(true);
    try {
      const result = await request<{ mode: string; url?: string; message?: string }>(`/outbox/${encodeURIComponent(draft.id)}/approve`, { method: "POST", body: JSON.stringify({ confirmed: true }) });
      if (result.mode === "assisted" && result.url) {
        setAssistedPending({ outboxId: draft.id, url: result.url });
        window.open(result.url, "_blank", "noopener,noreferrer");
        setNotice(result.message || "WhatsApp aberto. Confirme abaixo se o envio foi realizado.");
      } else {
        setDraft(null);
        setNotice("E-mail enviado e registrado no histórico imutável.");
        await refresh();
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "O envio não foi concluído; o rascunho foi preservado.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmAssisted(sent: boolean) {
    if (!assistedPending) return;
    setBusy(true);
    try {
      await request(`/outbox/${encodeURIComponent(assistedPending.outboxId)}/confirm-assisted`, { method: "POST", body: JSON.stringify({ sent }) });
      setNotice(sent ? "Envio manual confirmado e registrado." : "Envio marcado como não realizado.");
      setAssistedPending(null);
      setDraft(null);
      await refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível registrar a confirmação.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5 p-4 md:p-8">
      <header className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-5 md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--brand-primary)]">CRM · central segura</p><h1 className="mt-2 font-heading text-2xl font-black md:text-3xl">Comunicações Unificadas</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">E-mail, WhatsApp assistido, modelos e histórico por empresa. Toda saída passa por rascunho, confirmação e registro auditável.</p></div>
          <button type="button" onClick={refresh} disabled={busy} className="briefing-action"><RefreshCw className={busy ? "animate-spin" : ""} /> Atualizar</button>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <ProviderCard title="E-mail SMTP" icon={Mail} state={status.email?.status || "verificando"} detail={status.email?.account_label || status.email?.last_error} />
          <ProviderCard title="Gmail" icon={Mail} state={status.gmail?.status || "verificando"} detail={status.gmail?.account_label || "Conecte as credenciais para habilitar."} />
          <ProviderCard title="WhatsApp" icon={MessageCircle} state={status.whatsapp?.status || "assisted"} detail={status.whatsapp?.account_label || "Modo assistido via wa.me"} />
        </div>
      </header>

      {notice && <div role="status" className="rounded-xl border border-[var(--nodere-gold)] bg-[var(--brand-glow-dim)] px-4 py-3 text-sm text-[var(--text-primary)]">{notice}</div>}

      <main className="grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.6fr)]">
        <section className="min-w-0 rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-heading text-lg font-black">Nova mensagem</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">O botão principal salva primeiro; o envio exige uma segunda confirmação explícita.</p></div><ShieldCheck className="text-[var(--brand-primary)]" /></div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm font-bold text-[var(--text-secondary)]">Canal<select value={channel} onChange={(event) => { setChannel(event.target.value as Channel); setDraft(null); }} className="min-h-11 w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-input)] px-3"><option value="email">E-mail</option><option value="whatsapp">WhatsApp assistido</option></select></label>
            <label className="space-y-1 text-sm font-bold text-[var(--text-secondary)]">Empresa<select value={companyId} onChange={(event) => setCompanyId(event.target.value)} className="min-h-11 w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-input)] px-3"><option value="">Sem vínculo</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label>
            <label className="space-y-1 text-sm font-bold text-[var(--text-secondary)]">Destinatário<input value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder={channel === "email" ? "contato@empresa.com" : "+55 11 99999-9999"} className="min-h-11 w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-input)] px-3" /></label>
            <label className="space-y-1 text-sm font-bold text-[var(--text-secondary)]">Modelo<select value={templateId} onChange={(event) => applyTemplate(event.target.value)} className="min-h-11 w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-input)] px-3"><option value="">Sem modelo</option>{availableTemplates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select></label>
            {channel === "email" && <label className="space-y-1 text-sm font-bold text-[var(--text-secondary)] md:col-span-2">Assunto<input value={subject} onChange={(event) => setSubject(event.target.value)} className="min-h-11 w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-input)] px-3" /></label>}
          </div>
          <div className="mt-4"><RichTextEditor value={bodyHtml} onChange={setBodyHtml} minHeight={210} allowImages={false} placeholder="Escreva a mensagem comercial..." /></div>
          {channel === "email" && (
            <section className="mt-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><h3 className="flex items-center gap-2 text-sm font-black"><Paperclip /> Anexos protegidos</h3><p className="mt-1 text-xs text-[var(--text-muted)]">PDFs, propostas, contratos, documentos e imagens já vinculados à empresa. Limite total: 20 MB.</p></div>
                <label className="briefing-action cursor-pointer"><FileUp /> {uploadingAttachment ? "Enviando..." : "Anexar arquivo local"}<input hidden type="file" disabled={!companyId || uploadingAttachment} accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; void uploadAttachment(file); }} /></label>
              </div>
              {!companyId && <p className="mt-3 text-xs text-amber-400">Selecione uma empresa para usar anexos.</p>}
              {companyId && !attachments.length && <p className="mt-3 text-xs text-[var(--text-muted)]">Nenhum arquivo disponível. Use “Anexar arquivo local” ou adicione documentos no briefing comercial.</p>}
              {!!attachments.length && <div className="mt-3 grid gap-2 md:grid-cols-2">{attachments.map((attachment) => <label key={attachment.ref} className="flex cursor-pointer items-start gap-3 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] p-3 text-sm"><input type="checkbox" className="mt-1" checked={selectedAttachmentRefs.includes(attachment.ref)} onChange={(event) => setSelectedAttachmentRefs((current) => event.target.checked ? [...new Set([...current, attachment.ref])].slice(0, 10) : current.filter((ref) => ref !== attachment.ref))} /><span className="min-w-0"><strong className="block truncate text-[var(--text-primary)]">{attachment.name}</strong><small className="text-[var(--text-muted)]">{attachment.context} · {fileSizeLabel(attachment.sizeBytes)}</small></span></label>)}</div>}
            </section>
          )}
          <label className="mt-4 flex items-start gap-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] p-3 text-sm text-[var(--text-secondary)]"><input type="checkbox" checked={consentConfirmed} onChange={(event) => setConsentConfirmed(event.target.checked)} className="mt-0.5 h-4 w-4" /><span>Confirmo que este contato possui base legítima/consentimento e que respeitarei horário, finalidade e preferência do destinatário.</span></label>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={saveDraft} disabled={busy || !consentConfirmed} className="briefing-action briefing-action--primary"><Save /> Salvar na outbox</button>
            <button type="button" onClick={approveDraft} disabled={busy || !draft} className="briefing-action"><Send /> {channel === "email" ? "Confirmar e enviar" : "Abrir WhatsApp"}</button>
            <button type="button" onClick={saveAsTemplate} disabled={busy || !bodyHtml.trim()} className="briefing-action">Salvar como modelo</button>
            {draft && <span className="inline-flex items-center gap-2 text-xs font-bold text-[var(--text-muted)]"><Clock3 /> Rascunho {draft.status}</span>}
          </div>
          {assistedPending && <div className="mt-4 rounded-xl border border-[var(--nodere-gold)] bg-[var(--brand-glow-dim)] p-4"><p className="text-sm font-bold">O WhatsApp foi aberto. A mensagem foi realmente enviada?</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => confirmAssisted(true)} className="briefing-action briefing-action--primary"><CheckCircle2 /> Sim, foi enviada</button><button type="button" onClick={() => confirmAssisted(false)} className="briefing-action">Não foi enviada</button><a href={assistedPending.url} target="_blank" rel="noreferrer" className="briefing-action"><ExternalLink /> Abrir novamente</a></div></div>}
        </section>

        <aside className="min-w-0 rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-5">
          <h2 className="flex items-center gap-2 font-heading text-lg font-black"><History /> Histórico imutável</h2>
          <select aria-label="Selecionar conversa" value={activeThreadId} onChange={(event) => setActiveThreadId(event.target.value)} className="mt-4 min-h-11 w-full rounded-lg border border-[var(--border-soft)] bg-[var(--bg-input)] px-3 text-sm"><option value="">Nenhuma conversa</option>{threads.map((thread) => <option key={thread.id} value={thread.id}>{thread.nodere_companies?.name || thread.subject || thread.channel} · {thread.status}</option>)}</select>
          <div className="mt-4 space-y-3">{events.map((event) => <article key={event.id} className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] p-3"><div className="flex items-center justify-between gap-3 text-xs text-[var(--text-muted)]"><strong className="uppercase tracking-wide text-[var(--brand-primary)]">{eventLabel(event.event_type)}</strong><time>{dateLabel(event.occurred_at)}</time></div>{event.subject && <h3 className="mt-2 text-sm font-black">{event.subject}</h3>}<div className="mt-2 max-h-56 overflow-auto text-sm text-[var(--text-secondary)]">{event.body_html ? <RichTextPreview value={event.body_html} /> : event.body_text || "Evento operacional sem conteúdo."}</div></article>)}{activeThreadId && !events.length && <p className="text-sm text-[var(--text-muted)]">Nenhum evento registrado.</p>}</div>
          <Link href="/integrations" className="briefing-action mt-4 w-full">Gerenciar integrações</Link>
        </aside>
      </main>
    </div>
  );
}

function ProviderCard({ title, icon: Icon, state, detail }: { title: string; icon: typeof Mail; state: string; detail?: string }) {
  const ready = ["configured", "connected", "active", "assisted"].includes(state);
  return <article className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] p-4"><div className="flex items-center justify-between"><span className="font-heading text-sm font-black">{title}</span><Icon className={ready ? "text-[var(--brand-primary)]" : "text-[var(--text-muted)]"} /></div><p className={`mt-2 text-xs font-black uppercase tracking-wide ${ready ? "text-emerald-400" : "text-amber-400"}`}>{statusLabel(state)}</p><p className="mt-1 text-xs text-[var(--text-muted)]">{detail || (ready ? "Disponível" : "Configuração pendente")}</p></article>;
}

async function request<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/backend/communications-center${path}`, { ...options, credentials: "include", headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || payload.error || "A operação de comunicação falhou.");
  return payload as T;
}

function statusLabel(value: string) { return ({ configured: "Configurado", connected: "Conectado", active: "Ativo", assisted: "Assistido", not_configured: "Pendente", verifying: "Verificando" } as Record<string, string>)[value] || value; }
function eventLabel(value: string) { return value.replaceAll("_", " "); }
function dateLabel(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(date); }
function fileSizeLabel(value: number) { return value >= 1024 * 1024 ? `${(value / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(value / 1024))} KB`; }
