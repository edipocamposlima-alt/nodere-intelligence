"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarClock, Copy, Download, FileText, MessageCircle, Pencil, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import { Company } from "@/lib/types";
import { getApiBaseUrl } from "@/lib/apiBase";

const API_URL = getApiBaseUrl();

type Note = { id: string; companyId: string; body: string; type?: string; owner?: string; createdAt: string; updatedAt?: string };
type Task = { id: string; companyId: string; title: string; description?: string; dueAt?: string; priority?: string; channel?: string; status: string; createdAt: string };
type DocumentItem = { id: string; companyId: string; type: string; title: string; content: string; fileName?: string; createdAt: string };
type Tab = "observacoes" | "agenda" | "ia" | "documentos" | "whatsapp" | "enriquecimento";

function pdfEscape(value: string) {
  return value.replace(/[\\()]/g, "\\$&").replace(/[^\x20-\x7EÀ-ÿ]/g, " ");
}

function linkedinSearchUrl(name: string) {
  return `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(name)}`;
}

function buildSimplePdf(title: string, body: string) {
  const lines = [title, "", ...body.split(/\r?\n/)].flatMap((line) => {
    const clean = line.trim();
    if (clean.length <= 86) return [clean];
    return clean.match(/.{1,86}(\s|$)/g)?.map((chunk) => chunk.trim()) ?? [clean];
  }).slice(0, 48);

  const logo = [
    "0.04 0.09 0.18 rg 0 0 595 842 re f",
    "0.12 0.44 0.86 rg 50 785 44 44 re f",
    "1 1 1 rg BT /F2 24 Tf 63 798 Td (N) Tj ET",
    "1 1 1 rg BT /F2 24 Tf 108 806 Td (NODERE) Tj ET",
    "0.25 0.84 1 rg BT /F1 8 Tf 110 792 Td (INTELLIGENCE) Tj ET",
    "0.12 0.44 0.86 rg 50 770 495 1 re f"
  ].join("\n");
  const text = lines.map((line, index) => `BT /F1 10 Tf 50 ${735 - index * 14} Td (${pdfEscape(line)}) Tj ET`).join("\n");
  const stream = `q\n${logo}\n0.9 0.94 1 rg\n${text}\nQ`;
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj",
    `6 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer << /Root 1 0 R /Size ${objects.length + 1} >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) }
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || payload.error || `API HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function LeadOperations({ company }: { company: Company }) {
  const [lead, setLead] = useState(company);
  const [tab, setTab] = useState<Tab>("observacoes");
  const [notes, setNotes] = useState<Note[]>(company.notes || []);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState("");
  const [instruction, setInstruction] = useState("");
  const [generationType, setGenerationType] = useState("Proposta comercial");
  const [loading, setLoading] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [enrichmentMessages, setEnrichmentMessages] = useState<string[]>([]);

  const whatsappText = useMemo(() => {
    return editor || `Olá, tudo bem? Analisei a presença digital da ${lead.name} e identifiquei oportunidades para gerar mais contatos pelo Google. Posso te mostrar um diagnóstico rápido?`;
  }, [lead.name, editor]);

  useEffect(() => {
    api<Note[]>(`/companies/${company.id}/notes`).then(setNotes).catch(() => {});
    api<Task[]>(`/companies/${company.id}/tasks`).then(setTasks).catch(() => {});
    api<DocumentItem[]>(`/companies/${company.id}/documents`).then(setDocuments).catch(() => {});
  }, [company.id]);

  function showSuccess(text: string) {
    setMessage(text);
    setError(null);
    setTimeout(() => setMessage(null), 3000);
  }

  function showError(err: unknown) {
    setError(err instanceof Error ? err.message : "Ação não concluída.");
  }

  async function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = event.currentTarget;
    const form = new FormData(target);
    const body = String(form.get("body") || "").trim();
    if (!body) return;
    try {
      const note = await api<Note>(`/companies/${company.id}/notes`, {
        method: "POST",
        body: JSON.stringify({ body, type: form.get("type") || "Observação" })
      });
      setNotes((items) => [note, ...items]);
      target?.reset();
      showSuccess("Observação salva.");
    } catch (err) {
      showError(err);
    }
  }

  async function deleteNote(noteId: string) {
    try {
      await fetch(`${API_URL}/companies/${company.id}/notes/${noteId}`, { method: "DELETE" });
      setNotes((items) => items.filter((item) => item.id !== noteId));
      showSuccess("Observação removida.");
    } catch (err) {
      showError(err);
    }
  }

  async function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = event.currentTarget;
    const form = new FormData(target);
    try {
      const task = await api<Task>(`/companies/${company.id}/tasks`, {
        method: "POST",
        body: JSON.stringify({
          title: form.get("title"),
          description: form.get("description"),
          dueAt: form.get("dueAt"),
          priority: form.get("priority"),
          channel: form.get("channel")
        })
      });
      setTasks((items) => [task, ...items]);
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Follow-up criado no NODERE", { body: `${task.title} · ${company.name}` });
      } else if ("Notification" in window && Notification.permission === "default") {
        void Notification.requestPermission();
      }
      target?.reset();
      showSuccess("Tarefa criada.");
    } catch (err) {
      showError(err);
    }
  }

  async function completeTask(task: Task) {
    try {
      const updated = await api<Task>(`/companies/${company.id}/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: task.status === "done" ? "open" : "done" })
      });
      setTasks((items) => items.map((item) => item.id === task.id ? updated : item));
    } catch (err) {
      showError(err);
    }
  }

  async function generateWithAi() {
    setLoading(true);
    setError(null);
    try {
      const response = await api<{ diagnosis?: { summary?: string; whatsappMessage?: string; nextSteps?: string[] }; whatsappMessage?: string; commercialSummary?: string; nextSteps?: string[] }>(
        "/openai/analyze",
        {
          method: "POST",
          body: JSON.stringify({
            lead,
            prompt: `Gere ${generationType} para este lead. Use tom consultivo, comercial e objetivo.${instruction ? ` Instrução adicional: ${instruction}` : ""}`
          })
        }
      );
      const summary = response.commercialSummary || response.diagnosis?.summary || "";
      const whats = response.whatsappMessage || response.diagnosis?.whatsappMessage || "";
      const steps = response.nextSteps || response.diagnosis?.nextSteps || [];
      setEditor([summary, whats, steps.length ? `Próximos passos:\n- ${steps.join("\n- ")}` : ""].filter(Boolean).join("\n\n"));
      showSuccess("Texto gerado pela IA.");
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  }

  async function enrichExternal() {
    setEnriching(true);
    setError(null);
    try {
      const response = await api<{ company: Company; enrichment: { messages: string[]; enrichmentSources: string[] } }>(`/companies/${company.id}/enrich-external`, {
        method: "POST"
      });
      setLead(response.company);
      setEnrichmentMessages(response.enrichment.messages || []);
      showSuccess(response.enrichment.enrichmentSources?.length ? "Enriquecimento executado." : "Enriquecimento verificado. Configure Apollo/Econodata para dados avançados.");
    } catch (err) {
      showError(err);
    } finally {
      setEnriching(false);
    }
  }

  async function saveDocument(type: string) {
    if (!editor.trim()) return showError(new Error("Gere ou escreva um texto antes de salvar."));
    try {
      const title = `${type === "contrato" ? "Contrato" : "Proposta"} - ${company.name}`;
      const fileName = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`;
      const document = await api<DocumentItem>(`/companies/${company.id}/documents`, {
        method: "POST",
        body: JSON.stringify({ type, title, content: editor, fileName })
      });
      setDocuments((items) => [document, ...items]);
      downloadPdf(title, editor, fileName);
      showSuccess("Documento salvo e PDF baixado.");
    } catch (err) {
      showError(err);
    }
  }

  function downloadPdf(title: string, content: string, fileName?: string) {
    const blob = buildSimplePdf(title, content);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName || `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text).then(() => showSuccess("Texto copiado."));
  }

  const tabs: [Tab, string][] = [
    ["observacoes", "Observações"],
    ["agenda", "Agenda"],
    ["enriquecimento", "Apollo/Econodata"],
    ["ia", "IA / Editor"],
    ["documentos", "Propostas e contratos"],
    ["whatsapp", "WhatsApp"]
  ];

  return (
    <section className="rounded-lg border border-line bg-panel/90 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold text-white">Operação comercial</h3>
          <p className="mt-1 text-sm text-slate-400">Observações, follow-up, IA, documentos e WhatsApp vinculados a este cliente.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tabs.map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${tab === id ? "bg-electric text-white" : "border border-line bg-ink text-slate-300 hover:text-white"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {message && <p className="mt-4 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-emerald-200">{message}</p>}
      {error && <p className="mt-4 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-red-200">{error}</p>}

      {tab === "observacoes" && (
        <div className="mt-5 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <form onSubmit={addNote} className="space-y-3">
            <select name="type" className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm">
              {["Observação", "Ligação", "WhatsApp", "Email", "Reunião", "Objeção", "Interno"].map((item) => <option key={item}>{item}</option>)}
            </select>
            <textarea name="body" rows={8} placeholder="Escreva uma observação real do atendimento..." className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-electric" />
            <button className="inline-flex items-center gap-2 rounded-lg bg-electric px-4 py-2 text-sm font-semibold text-white"><Save className="h-4 w-4" />Salvar observação</button>
          </form>
          <div className="space-y-3">
            {notes.length === 0 && <p className="rounded-lg border border-line bg-ink p-4 text-sm text-slate-400">Nenhuma observação salva ainda.</p>}
            {notes.map((note) => (
              <div key={note.id} className="rounded-lg border border-line bg-ink p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-cyan">{note.type || "Observação"} · {new Date(note.createdAt).toLocaleString("pt-BR")}</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">{note.body}</p>
                  </div>
                  <button onClick={() => deleteNote(note.id)} className="rounded-md border border-line p-2 text-slate-400 hover:text-red-300" aria-label="Excluir observação"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "agenda" && (
        <div className="mt-5 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <form onSubmit={addTask} className="space-y-3">
            <input name="title" required placeholder="Título da tarefa" className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
            <textarea name="description" rows={4} placeholder="Descrição" className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="space-y-1 text-xs text-slate-400 sm:col-span-3 xl:col-span-1">
                Data e hora do lembrete
                <input name="dueAt" type="datetime-local" className="h-12 w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
              </label>
              <label className="space-y-1 text-xs text-slate-400">
                Prioridade
                <select name="priority" className="h-12 w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm"><option>Média</option><option>Alta</option><option>Urgente</option><option>Baixa</option></select>
              </label>
              <label className="space-y-1 text-xs text-slate-400">
                Canal
                <select name="channel" className="h-12 w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm"><option>WhatsApp</option><option>Ligação</option><option>Email</option><option>Reunião</option></select>
              </label>
            </div>
            <button className="inline-flex items-center gap-2 rounded-lg bg-electric px-4 py-2 text-sm font-semibold text-white"><CalendarClock className="h-4 w-4" />Criar follow-up</button>
          </form>
          <div className="space-y-3">
            {tasks.length === 0 && <p className="rounded-lg border border-line bg-ink p-4 text-sm text-slate-400">Nenhum follow-up agendado.</p>}
            {tasks.map((task) => (
              <button key={task.id} onClick={() => completeTask(task)} className="block w-full rounded-lg border border-line bg-ink p-4 text-left hover:border-electric/60">
                <p className={`text-sm font-semibold ${task.status === "done" ? "text-emerald-300 line-through" : "text-white"}`}>{task.title}</p>
                <p className="mt-1 text-xs text-slate-400">{task.channel} · {task.priority} · {task.dueAt ? new Date(task.dueAt).toLocaleString("pt-BR") : "sem data"}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === "ia" && (
        <div className="mt-5 space-y-4">
          <div className="grid gap-3 md:grid-cols-[260px_1fr_auto]">
            <select value={generationType} onChange={(event) => setGenerationType(event.target.value)} className="rounded-lg border border-line bg-ink px-3 py-2 text-sm">
              {["Resumo comercial", "Mensagem WhatsApp", "E-mail comercial", "Proposta comercial", "Contrato simples", "Objeções e respostas", "Diagnóstico"].map((item) => <option key={item}>{item}</option>)}
            </select>
            <input value={instruction} placeholder="Instrução adicional para a IA" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm" onChange={(event) => setInstruction(event.target.value)} />
            <button onClick={generateWithAi} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg bg-electric px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"><Sparkles className="h-4 w-4" />{loading ? "Gerando" : "Gerar com IA"}</button>
          </div>
          <textarea value={editor} onChange={(event) => setEditor(event.target.value)} rows={14} placeholder="O texto gerado ou editado aparece aqui. Você pode alterar antes de salvar, copiar, virar PDF ou usar no WhatsApp." className="w-full rounded-lg border border-line bg-ink px-4 py-3 text-sm leading-6 outline-none focus:border-electric" />
          <div className="flex flex-wrap gap-2">
            <button onClick={() => copy(editor)} className="inline-flex items-center gap-2 rounded-lg border border-line bg-ink px-4 py-2 text-sm text-white"><Copy className="h-4 w-4" />Copiar</button>
            <button onClick={() => setEditor("")} className="inline-flex items-center gap-2 rounded-lg border border-line bg-ink px-4 py-2 text-sm text-white"><Trash2 className="h-4 w-4" />Limpar</button>
            <button onClick={() => saveDocument("proposta")} className="inline-flex items-center gap-2 rounded-lg bg-success px-4 py-2 text-sm font-semibold text-ink"><FileText className="h-4 w-4" />Salvar proposta PDF</button>
            <button onClick={() => saveDocument("contrato")} className="inline-flex items-center gap-2 rounded-lg bg-warning px-4 py-2 text-sm font-semibold text-ink"><Pencil className="h-4 w-4" />Salvar contrato PDF</button>
          </div>
        </div>
      )}

      {tab === "enriquecimento" && (
        <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-line bg-ink p-4">
            <h4 className="font-semibold text-white">Enriquecimento externo</h4>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Consulta Apollo.io para decisores e LinkedIn por domínio/site. Consulta Econodata quando `ECONODATA_API_URL` e `ECONODATA_API_KEY` estiverem configurados no backend. O sistema não inventa CNPJ nem decisores.
            </p>
            <button
              onClick={enrichExternal}
              disabled={enriching}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-electric px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              <Sparkles className="h-4 w-4" />
              {enriching ? "Conectando..." : "Conectar Apollo, Econodata e LinkedIn"}
            </button>
            <div className="mt-4 space-y-2">
              {(enrichmentMessages.length ? enrichmentMessages : ["Clique para executar o enriquecimento externo deste lead."]).map((item) => (
                <p key={item} className="rounded-md border border-line bg-panel/80 px-3 py-2 text-xs text-slate-300">{item}</p>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-line bg-ink p-4">
            <h4 className="font-semibold text-white">Dados enriquecidos</h4>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <Info label="Razão social" value={lead.legalName} />
              <Info label="CNPJ" value={lead.cnpj} />
              <Info label="Porte" value={lead.companySize} />
              <Info label="Receita" value={lead.revenueRange} />
              <Info label={lead.linkedin ? "LinkedIn direto" : "LinkedIn sugerido"} value={lead.linkedin || linkedinSearchUrl(lead.name)} isLink hint={lead.linkedin ? "Fonte externa/site" : "Busca no LinkedIn. Confirme a empresa correta antes de usar."} />
              <Info label="Fontes" value={lead.enrichmentSources?.join(", ")} />
            </dl>
            <div className="mt-5">
              <p className="text-sm font-semibold text-white">Decisores</p>
              <div className="mt-3 space-y-2">
                {lead.decisionMakers?.length ? lead.decisionMakers.map((person, index) => (
                  <div key={`${person.email || person.linkedin || person.name}-${index}`} className="rounded-lg border border-line bg-panel/80 p-3 text-sm">
                    <p className="font-medium text-white">{person.name || "Decisor sem nome"}</p>
                    <p className="mt-1 text-xs text-slate-400">{person.title || "Cargo não informado"} · {person.source || "fonte externa"}</p>
                    {person.linkedin && <a href={person.linkedin} target="_blank" className="mt-2 block text-xs text-cyan hover:underline">Abrir LinkedIn</a>}
                    {person.email && <p className="mt-1 text-xs text-slate-300">{person.email}</p>}
                  </div>
                )) : (
                  <p className="rounded-lg border border-dashed border-line p-3 text-sm text-slate-500">Nenhum decisor retornado ainda.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "documentos" && (
        <div className="mt-5 space-y-3">
          {documents.length === 0 && <p className="rounded-lg border border-line bg-ink p-4 text-sm text-slate-400">Nenhuma proposta, contrato ou anexo salvo ainda.</p>}
          {documents.map((document) => (
            <div key={document.id} className="flex flex-col gap-3 rounded-lg border border-line bg-ink p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-white">{document.title}</p>
                <p className="mt-1 text-xs text-slate-400">{document.type} · {new Date(document.createdAt).toLocaleString("pt-BR")}</p>
              </div>
              <button onClick={() => downloadPdf(document.title, document.content, document.fileName)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-line px-4 py-2 text-sm text-white"><Download className="h-4 w-4" />Baixar PDF</button>
            </div>
          ))}
        </div>
      )}

      {tab === "whatsapp" && (
        <div className="mt-5 space-y-4">
          <textarea value={whatsappText} onChange={(event) => setEditor(event.target.value)} rows={8} className="w-full rounded-lg border border-line bg-ink px-4 py-3 text-sm leading-6" />
          <div className="flex flex-wrap gap-2">
            <button onClick={() => copy(whatsappText)} className="inline-flex items-center gap-2 rounded-lg border border-line bg-ink px-4 py-2 text-sm text-white"><Copy className="h-4 w-4" />Copiar mensagem</button>
            {lead.whatsapp || lead.phone ? (
              <a target="_blank" href={`https://wa.me/${String(lead.whatsapp || lead.phone).replace(/\D/g, "")}?text=${encodeURIComponent(whatsappText)}`} className="inline-flex items-center gap-2 rounded-lg bg-success px-4 py-2 text-sm font-semibold text-ink"><MessageCircle className="h-4 w-4" />Abrir WhatsApp</a>
            ) : (
              <span className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-2 text-sm text-amber-100">Este lead não possui telefone/WhatsApp.</span>
            )}
            <button onClick={() => saveDocument("template_whatsapp")} className="inline-flex items-center gap-2 rounded-lg bg-electric px-4 py-2 text-sm font-semibold text-white"><Plus className="h-4 w-4" />Salvar como template</button>
          </div>
        </div>
      )}
    </section>
  );
}

function Info({ label, value, isLink, hint }: { label: string; value?: string; isLink?: boolean; hint?: string }) {
  return (
    <div className="rounded-lg border border-line bg-panel/80 p-3">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm text-white">
        {value ? (
          isLink ? <a href={value} target="_blank" className="text-cyan hover:underline">{value}</a> : value
        ) : "Não localizado"}
      </dd>
      {hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}
