"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarClock, Copy, Download, Eye, FileText, ImageIcon, MessageCircle, Pencil, Plus, RotateCcw, Save, Sparkles, Trash2, Upload } from "lucide-react";
import { Company } from "@/lib/types";
import { getApiBaseUrl } from "@/lib/apiBase";
import { createCalendarEvent, updateCompany as saveCompanyData } from "@/lib/api";
import { downloadNoderePdf } from "@/lib/pdf";
import { RichTextEditor, RichTextPreview } from "@/components/RichTextEditor";
import { CompanyMiniCalendar } from "@/app/calendar/CalendarClient";

const API_URL = getApiBaseUrl();

type Note = { id: string; companyId: string; body: string; type?: string; owner?: string; createdAt: string; updatedAt?: string };
type Task = { id: string; companyId: string; title: string; description?: string; dueAt?: string; priority?: string; channel?: string; status: string; createdAt: string };
type DocumentItem = { id: string; companyId: string; type: string; title: string; content: string; fileName?: string; createdAt: string };
type CompanyFile = { id: string; companyId: string; filename: string; fileUrl: string; fileType?: string; fileSize?: number; createdAt: string; storagePath?: string };
type Contact = { id: string; name: string; role?: string; email?: string; phone?: string; whatsapp?: string; linkedin_url?: string; notes?: string; created_at?: string };
type Communication = { id: string; type: string; direction: string; subject?: string; body?: string; sent_by?: string; sent_at: string; status?: string; metadata?: { nextAction?: string; responsible?: string } };
type ContractItem = { id: string; catalog_items?: { name?: string; code?: string; type?: string }; quantity?: number; contracted_price?: number; status?: string; notes?: string; created_at?: string };
type ProposalVersion = { id: string; lead_id: string; version_number: number; content?: string; service_type?: string; generated_by?: "user" | "ai"; created_at: string };
type Tab = "dados" | "observacoes" | "agenda" | "decisores" | "historico" | "contratos" | "ia" | "documentos" | "whatsapp" | "enriquecimento";

function isValidBrazilMobileWhatsapp(value?: string) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return false;
  const local = digits.startsWith("55") ? digits.slice(2) : digits;
  return local.length === 11 && local[2] === "9";
}

function whatsappDigits(value?: string) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("55") ? digits : `55${digits}`;
}

function normalizeCalendarPriority(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes("alta") || normalized.includes("urgente")) return "alta";
  if (normalized.includes("baixa")) return "baixa";
  return "media";
}

function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("nodere_admin_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function linkedinSearchUrl(name: string) {
  const query = String(name || "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\b(?:www\.)?[\w-]+\.(?:com|com\.br|net|org|io|app)\b/gi, "")
    .replace(/\.(com|com\.br|net|org|io|br)(\s|$)/gi, " ")
    .trim();
  return `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(query)}`;
}

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers);
  headers.set("Content-Type", "application/json");
  const auth = authHeaders();
  if (auth.Authorization) headers.set("Authorization", auth.Authorization);
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || payload.error || `API HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function LeadOperations({ company }: { company: Company }) {
  const companyPath = useMemo(() => `/companies/${encodeURIComponent(company.id)}`, [company.id]);
  const [lead, setLead] = useState(company);
  const [tab, setTab] = useState<Tab>("dados");
  const [notes, setNotes] = useState<Note[]>(company.notes || []);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [companyFiles, setCompanyFiles] = useState<CompanyFile[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [proposalVersions, setProposalVersions] = useState<ProposalVersion[]>([]);
  const [previewVersion, setPreviewVersion] = useState<ProposalVersion | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [taskDescription, setTaskDescription] = useState("");
  const [contactNotes, setContactNotes] = useState("");
  const [communicationBody, setCommunicationBody] = useState("");
  const [dealNotes, setDealNotes] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [instruction, setInstruction] = useState("");
  const [generationType, setGenerationType] = useState("Proposta comercial");
  const [loading, setLoading] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [enrichmentMessages, setEnrichmentMessages] = useState<string[]>([]);

  const whatsappText = useMemo(() => {
    return editor || `Olá, tudo bem? Analisei a presença digital da ${lead.name} e identifiquei oportunidades para gerar mais contatos pelo Google. Posso te mostrar um diagnóstico rápido?`;
  }, [lead.name, editor]);

  useEffect(() => {
    api<Note[]>(`${companyPath}/notes`).then((items) => setNotes(Array.isArray(items) ? items : [])).catch(() => {});
    api<Task[]>(`${companyPath}/tasks`).then((items) => setTasks(Array.isArray(items) ? items : [])).catch(() => {});
    api<DocumentItem[]>(`${companyPath}/documents`).then((items) => setDocuments(Array.isArray(items) ? items : [])).catch(() => {});
    api<CompanyFile[]>(`${companyPath}/files`).then((items) => setCompanyFiles(Array.isArray(items) ? items : [])).catch(() => {});
    api<Contact[]>(`${companyPath}/contacts`).then((items) => setContacts(Array.isArray(items) ? items : [])).catch(() => {});
    api<Communication[]>(`${companyPath}/communications`).then((items) => setCommunications(Array.isArray(items) ? items : [])).catch(() => {});
    api<ContractItem[]>(`${companyPath}/contracts`).then((items) => setContracts(Array.isArray(items) ? items : [])).catch(() => {});
    api<ProposalVersion[]>(`/proposals/leads/${encodeURIComponent(company.id)}`).then((items) => setProposalVersions(Array.isArray(items) ? items : [])).catch(() => {});
  }, [company.id, companyPath]);

  function showSuccess(text: string) {
    setMessage(text);
    setError(null);
    setTimeout(() => setMessage(null), 3000);
  }

  function showError(err: unknown) {
    setError(err instanceof Error ? err.message : "Ação não concluída.");
  }

  async function tryCreateCalendarEvent(payload: Parameters<typeof createCalendarEvent>[0]) {
    try {
      await createCalendarEvent(payload);
    } catch (err) {
      console.warn("[lead-operations] calendar event skipped", {
        companyId: company.id,
        message: err instanceof Error ? err.message : String(err)
      });
    }
  }


  async function uploadLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const form = new FormData();
    form.append("logo", file);
    setUploadingLogo(true);
    try {
      const response = await fetch(`${API_URL}${companyPath}/logo`, { method: "POST", headers: authHeaders(), body: form });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || `API HTTP ${response.status}`);
      const updated = payload.company || { ...lead, logoUrl: payload.logoUrl };
      setLead(updated);
      showSuccess("Logo da empresa atualizado.");
    } catch (err) {
      showError(err);
    } finally {
      setUploadingLogo(false);
    }
  }

  async function uploadCompanyFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    setUploadingFile(true);
    try {
      const response = await fetch(`${API_URL}${companyPath}/files`, { method: "POST", headers: authHeaders(), body: form });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || `API HTTP ${response.status}`);
      setCompanyFiles((items) => [payload, ...items]);
      showSuccess("Arquivo anexado à ficha do cliente.");
    } catch (err) {
      showError(err);
    } finally {
      setUploadingFile(false);
    }
  }

  async function deleteCompanyFile(fileId: string) {
    try {
      const response = await fetch(`${API_URL}${companyPath}/files/${encodeURIComponent(fileId)}`, { method: "DELETE", headers: authHeaders() });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || `API HTTP ${response.status}`);
      setCompanyFiles((items) => items.filter((item) => item.id !== fileId));
      showSuccess("Arquivo removido.");
    } catch (err) {
      showError(err);
    }
  }
  async function saveLeadData(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const updates: Partial<Company> = {
      name: String(form.get("name") || "").trim(),
      legalName: String(form.get("legalName") || "").trim(),
      cnpj: String(form.get("cnpj") || "").trim(),
      category: String(form.get("category") || "").trim(),
      city: String(form.get("city") || "").trim(),
      state: String(form.get("state") || "").trim().toUpperCase(),
      address: String(form.get("address") || "").trim(),
      phone: String(form.get("phone") || "").trim(),
      whatsapp: String(form.get("whatsapp") || "").trim(),
      website: String(form.get("website") || "").trim(),
      instagram: String(form.get("instagram") || "").trim(),
      facebook: String(form.get("facebook") || "").trim(),
      linkedin: String(form.get("linkedin") || "").trim(),
      youtube: String(form.get("youtube") || "").trim(),
      score: Number(form.get("score") || lead.score || 0),
      opportunityLevel: String(form.get("opportunityLevel") || lead.opportunityLevel || "Media") as Company["opportunityLevel"],
      companySize: String(form.get("companySize") || "").trim(),
      revenueRange: String(form.get("revenueRange") || "").trim()
    };
    if (!updates.name) return showError(new Error("Nome da empresa é obrigatório."));
    const fixedLine = updates.whatsapp?.replace(/\D/g, "");
    if (fixedLine && fixedLine.length >= 10 && !/^\d{2}9/.test(fixedLine.slice(-11))) {
      return showError(new Error("WhatsApp deve ser celular. Telefone fixo deve ficar em Telefone."));
    }
    try {
      const updated = await saveCompanyData(company.id, updates);
      setLead(updated);
      showSuccess("Dados da empresa salvos no banco.");
    } catch (err) {
      showError(err);
    }
  }

  async function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = event.currentTarget;
    const form = new FormData(target);
    const body = String(form.get("body") || "").trim();
    if (!body) return;
    const nextAction = String(form.get("nextAction") || "").trim();
    const owner = String(form.get("owner") || "").trim();
    const performedAt = String(form.get("performedAt") || "").trim();
    const enrichedBody = [
      performedAt ? `**Data e hora:** ${new Date(performedAt).toLocaleString("pt-BR")}` : "",
      owner ? `**Responsável:** ${owner}` : "",
      nextAction ? `**Próxima ação:** ${nextAction}` : "",
      body
    ].filter(Boolean).join("\n\n");
    try {
      const note = await api<Note>(`${companyPath}/notes`, {
        method: "POST",
        body: JSON.stringify({ body: enrichedBody, type: form.get("type") || "Observação" })
      });
      setNotes((items) => [note, ...items]);
      target?.reset();
      setNoteBody("");
      showSuccess("Observação salva.");
    } catch (err) {
      showError(err);
    }
  }

  async function saveEditedNote() {
    const body = noteBody.trim();
    if (!editingNoteId || !body) return;
    try {
      const note = await api<Note>(`${companyPath}/notes/${encodeURIComponent(editingNoteId)}`, {
        method: "PATCH",
        body: JSON.stringify({ body })
      });
      setNotes((items) => items.map((item) => item.id === editingNoteId ? note : item));
      setEditingNoteId(null);
      setNoteBody("");
      showSuccess("Observação atualizada.");
    } catch (err) {
      showError(err);
    }
  }

  function startEditNote(note: Note) {
    setEditingNoteId(note.id);
    setNoteBody(note.body);
  }

  function cancelEditNote() {
    setEditingNoteId(null);
    setNoteBody("");
  }

  async function deleteNote(noteId: string) {
    try {
      await fetch(`${API_URL}${companyPath}/notes/${encodeURIComponent(noteId)}`, { method: "DELETE", headers: authHeaders() });
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
      const task = await api<Task>(`${companyPath}/tasks`, {
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
      const dueAt = String(form.get("dueAt") || "");
      if (dueAt) {
        const startAt = new Date(dueAt);
        const endAt = new Date(startAt);
        endAt.setMinutes(endAt.getMinutes() + 30);
        await tryCreateCalendarEvent({
          companyId: company.id,
          title: String(form.get("title") || "Follow-up comercial"),
          type: "followup",
          priority: normalizeCalendarPriority(String(form.get("priority") || "media")),
          channel: String(form.get("channel") || "WhatsApp"),
          status: "pendente",
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          notes: taskDescription,
          reminderEnabled: true,
          reminderMinutes: 30,
          reminderAt: new Date(startAt.getTime() - 30 * 60 * 1000).toISOString(),
          metadata: { source: "lead_task", taskId: task.id }
        });
      }
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Follow-up criado no NODERE", { body: `${task.title} · ${company.name}` });
      } else if ("Notification" in window && Notification.permission === "default") {
        void Notification.requestPermission();
      }
      target?.reset();
      setTaskDescription("");
      showSuccess("Tarefa criada.");
    } catch (err) {
      showError(err);
    }
  }

  async function addContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = event.currentTarget;
    const form = new FormData(target);
    const influenceLevel = String(form.get("influenceLevel") || "").trim();
    const notes = String(form.get("notes") || "").trim();
    try {
      const contact = await api<Contact>(`${companyPath}/contacts`, {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          role: form.get("role"),
          email: form.get("email"),
          phone: form.get("phone"),
          whatsapp: form.get("whatsapp"),
          linkedinUrl: form.get("linkedinUrl"),
          notes: [influenceLevel ? `**Nível de influência:** ${influenceLevel}` : "", notes].filter(Boolean).join("\n\n")
        })
      });
      setContacts((items) => [contact, ...items]);
      target.reset();
      setContactNotes("");
      showSuccess("Decisor salvo.");
    } catch (err) {
      showError(err);
    }
  }

  async function addNegotiation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = event.currentTarget;
    const form = new FormData(target);
    const title = `Negociação - ${String(form.get("service") || "Produto/serviço")}`;
    const content = [
      `**Valor da negociação:** ${String(form.get("value") || "Não informado")}`,
      `**Produto/serviço de interesse:** ${String(form.get("service") || "Não informado")}`,
      `**Etapa da negociação:** ${String(form.get("stage") || "Não informada")}`,
      `**Probabilidade de fechamento:** ${String(form.get("probability") || "0")}%`,
      `**Data prevista de fechamento:** ${String(form.get("expectedClose") || "Não informada")}`,
      `**Motivo de perda:** ${String(form.get("lossReason") || "Não aplicável")}`,
      `**Próxima ação comercial:** ${String(form.get("nextAction") || "Não informada")}`,
      "",
      dealNotes || "Sem observações."
    ].join("\n");
    try {
      const document = await api<DocumentItem>(`${companyPath}/documents`, {
        method: "POST",
        body: JSON.stringify({ type: "negociacao", title, content })
      });
      setDocuments((items) => [document, ...items]);
      setDealNotes("");
      target.reset();
      showSuccess("Negociação registrada.");
    } catch (err) {
      showError(err);
    }
  }

  async function addCommunication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = event.currentTarget;
    const form = new FormData(target);
    try {
      const comm = await api<Communication>(`${companyPath}/communications`, {
        method: "POST",
        body: JSON.stringify({
          type: form.get("type"),
          direction: form.get("direction"),
          subject: form.get("subject"),
          body: form.get("body"),
          sentAt: form.get("sentAt") || new Date().toISOString(),
          responsible: form.get("responsible"),
          nextAction: form.get("nextAction")
        })
      });
      setCommunications((items) => [comm, ...items]);
      target.reset();
      setCommunicationBody("");
      showSuccess("Interação registrada.");
    } catch (err) {
      showError(err);
    }
  }

  async function sendEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = event.currentTarget;
    const form = new FormData(target);
    try {
      const response = await api<{ communication: Communication; messageId: string }>(`${companyPath}/email`, {
        method: "POST",
        body: JSON.stringify({
          to: form.get("to"),
          subject: form.get("subject"),
          body: form.get("body")
        })
      });
      setCommunications((items) => [response.communication, ...items]);
      target.reset();
      setEmailBody("");
      showSuccess("E-mail enviado e registrado no histórico.");
    } catch (err) {
      showError(err);
    }
  }

  async function completeTask(task: Task) {
    try {
      const updated = await api<Task>(`${companyPath}/tasks/${encodeURIComponent(task.id)}`, {
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
      const response = await api<{ company: Company; enrichment: { messages: string[]; enrichmentSources: string[] } }>(`${companyPath}/enrich-external`, {
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


  async function saveProposalVersion(type: string, content: string) {
    const version = await api<ProposalVersion>("/proposals/versions", {
      method: "POST",
      body: JSON.stringify({
        lead_id: company.id,
        content,
        service_type: type,
        generated_by: generationType.toLowerCase().includes("ia") ? "ai" : "user"
      })
    });
    setProposalVersions((items) => [version, ...items]);
    return version;
  }

  async function openProposalVersion(versionNumber: number) {
    try {
      const version = await api<ProposalVersion>(`/proposals/leads/${encodeURIComponent(company.id)}/${encodeURIComponent(String(versionNumber))}`);
      setPreviewVersion(version);
    } catch (err) {
      showError(err);
    }
  }

  async function restoreProposalVersion(versionNumber: number) {
    try {
      const version = await api<ProposalVersion>(`/proposals/leads/${encodeURIComponent(company.id)}/${encodeURIComponent(String(versionNumber))}`);
      setEditor(version.content || "");
      setTab("ia");
      showSuccess(`Versão ${version.version_number} restaurada no editor.`);
    } catch (err) {
      showError(err);
    }
  }

  async function downloadProposalVersion(versionNumber: number) {
    try {
      const version = await api<ProposalVersion>(`/proposals/leads/${encodeURIComponent(company.id)}/${encodeURIComponent(String(versionNumber))}`);
      await downloadPdf(`Versão ${version.version_number} - ${version.service_type || "Proposta"}`, version.content || "", `nodere-${company.name}-v${version.version_number}.pdf`);
    } catch (err) {
      showError(err);
    }
  }
  async function saveDocument(type: string) {
    if (!editor.trim()) return showError(new Error("Gere ou escreva um texto antes de salvar."));
    try {
      const title = `${type === "contrato" ? "Contrato" : "Proposta"} - ${company.name}`;
      const fileName = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`;
      const document = await api<DocumentItem>(`${companyPath}/documents`, {
        method: "POST",
        body: JSON.stringify({ type, title, content: editor, fileName })
      });
      setDocuments((items) => [document, ...items]);
      if (type === "proposta" || type === "contrato") await saveProposalVersion(type, editor);
      if (type === "proposta" || type === "contrato") {
        const startAt = new Date();
        startAt.setHours(startAt.getHours() + 1);
        const endAt = new Date(startAt);
        endAt.setMinutes(endAt.getMinutes() + 30);
        await tryCreateCalendarEvent({
          companyId: company.id,
          title: `${type === "contrato" ? "Revisar contrato" : "Enviar proposta"} - ${company.name}`,
          type: type === "contrato" ? "pos_venda" : "proposta",
          priority: "media",
          channel: "Interno",
          status: "pendente",
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          notes: `Evento criado automaticamente ao salvar ${type}.`,
          reminderEnabled: true,
          reminderMinutes: 30,
          reminderAt: new Date(startAt.getTime() - 30 * 60 * 1000).toISOString(),
          metadata: { source: "lead_document", documentId: document.id, documentType: type }
        });
      }
      await downloadPdf(title, editor, fileName);
      showSuccess("Documento salvo e PDF baixado.");
    } catch (err) {
      showError(err);
    }
  }

  async function downloadPdf(title: string, content: string, fileName?: string) {
    await downloadNoderePdf({
      title,
      subtitle: `${lead.name} · ${lead.category || "Sem segmento"}`,
      body: content,
      fileName: fileName || `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`
    });
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text).then(() => showSuccess("Texto copiado."));
  }

  const tabs: [Tab, string][] = [
    ["dados", "Visão Geral"],
    ["observacoes", "Observações"],
    ["agenda", "Agenda"],
    ["decisores", "Contatos"],
    ["historico", "Histórico"],
    ["contratos", "Negociações"],
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

      {tab === "dados" && (
        <form onSubmit={saveLeadData} className="mt-5 space-y-5">
          <div className="rounded-lg border border-line bg-ink p-4">
            <h4 className="font-semibold text-white">Identificação</h4>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Field name="name" label="Nome fantasia" required defaultValue={lead.name} />
              <Field name="legalName" label="Razão social" defaultValue={lead.legalName} />
              <Field name="cnpj" label="CNPJ" defaultValue={lead.cnpj} placeholder="00.000.000/0001-00" />
              <Field name="category" label="Segmento" defaultValue={lead.category} />
              <Field name="companySize" label="Porte" defaultValue={lead.companySize} placeholder="MEI, ME, EPP, Médio, Grande" />
              <Field name="revenueRange" label="Faixa de receita" defaultValue={lead.revenueRange} />
              <label className="block">
                <span className="text-xs font-semibold text-slate-400">Score comercial</span>
                <input name="score" type="number" min={0} max={100} defaultValue={lead.score} className="mt-1 w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-white outline-none focus:border-electric" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-400">Oportunidade</span>
                <select name="opportunityLevel" defaultValue={lead.opportunityLevel} className="mt-1 w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-white outline-none focus:border-electric">
                  <option value="Alta">Alta</option>
                  <option value="Media">Média</option>
                  <option value="Baixa">Baixa</option>
                </select>
              </label>
            </div>
          </div>

          <div className="rounded-lg border border-line bg-ink p-4">
            <h4 className="font-semibold text-white">Contato e localização</h4>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Field name="phone" label="Telefone" defaultValue={lead.phone} />
              <Field name="whatsapp" label="WhatsApp celular" defaultValue={lead.whatsapp} />
              <Field name="website" label="Site" defaultValue={lead.website} placeholder="https://empresa.com.br" />
              <Field name="address" label="Endereço" defaultValue={lead.address} />
              <Field name="city" label="Cidade" defaultValue={lead.city} />
              <Field name="state" label="Estado" defaultValue={lead.state} />
            </div>
          </div>

          <div className="rounded-lg border border-line bg-ink p-4">
            <h4 className="font-semibold text-white">Redes sociais</h4>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Field name="instagram" label="Instagram" defaultValue={lead.instagram} />
              <Field name="facebook" label="Facebook" defaultValue={lead.facebook} />
              <Field name="linkedin" label="LinkedIn" defaultValue={lead.linkedin} />
              <Field name="youtube" label="YouTube" defaultValue={lead.youtube} />
            </div>
          </div>

          <button className="btn-action px-5 py-3 text-sm shadow-glow">
            <Save className="h-4 w-4" />
            Salvar dados da empresa
          </button>
        </form>
      )}

      {tab === "observacoes" && (
        <div className="mt-5 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <form onSubmit={addNote} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <select name="type" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm">
                {["Observação", "Ligação", "WhatsApp", "E-mail", "Reunião", "Proposta", "Interno"].map((item) => <option key={item}>{item}</option>)}
              </select>
              <input name="performedAt" type="datetime-local" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
              <input name="owner" placeholder="Responsável pelo registro" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
              <input name="nextAction" placeholder="Próxima ação" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
            </div>
            <input type="hidden" name="body" value={noteBody} />
            <RichTextEditor value={noteBody} onChange={setNoteBody} minHeight={220} placeholder="Registre a atividade realizada e observações detalhadas..." />
            <div className="flex flex-wrap gap-2">
              {editingNoteId ? (
                <>
                  <button type="button" onClick={() => void saveEditedNote()} className="btn-action px-4 py-2 text-sm"><Save className="h-4 w-4" />Atualizar observação</button>
                  <button type="button" onClick={cancelEditNote} className="inline-flex items-center gap-2 rounded-lg border border-line bg-panel px-4 py-2 text-sm font-semibold text-[var(--text-primary)]"><RotateCcw className="h-4 w-4" />Cancelar edição</button>
                </>
              ) : (
                <button className="btn-action px-4 py-2 text-sm"><Save className="h-4 w-4" />Salvar observação</button>
              )}
            </div>
          </form>
          <div className="space-y-3">
            {notes.length === 0 && <p className="rounded-lg border border-line bg-ink p-4 text-sm text-slate-400">Nenhuma observação salva ainda.</p>}
            {notes.map((note) => (
              <div key={note.id} className="rounded-lg border border-line bg-ink p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-cyan">{note.type || "Observação"} · {new Date(note.createdAt).toLocaleString("pt-BR")}</p>
                    <div className="mt-3"><RichTextPreview value={note.body} /></div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => startEditNote(note)} className="rounded-md border border-line p-2 text-slate-400 hover:text-cyan" aria-label="Editar observação"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => deleteNote(note.id)} className="rounded-md border border-line p-2 text-slate-400 hover:text-red-300" aria-label="Excluir observação"><Trash2 className="h-4 w-4" /></button>
                  </div>
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
            <input type="hidden" name="description" value={taskDescription} />
            <RichTextEditor value={taskDescription} onChange={setTaskDescription} minHeight={150} placeholder="Descrição" />
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
            <button className="btn-action px-4 py-2 text-sm"><CalendarClock className="h-4 w-4" />Criar follow-up</button>
          </form>
          <div className="space-y-3">
            <CompanyMiniCalendar companyId={company.id} />
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

      {tab === "decisores" && (
        <div className="mt-5 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <form onSubmit={addContact} className="space-y-3">
            <input name="name" required placeholder="Nome do contato" className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
            <input name="role" placeholder="Cargo/função" className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="email" placeholder="Email" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
              <input name="phone" placeholder="Telefone" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
              <input name="whatsapp" placeholder="WhatsApp celular" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
              <input name="linkedinUrl" placeholder="LinkedIn URL" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
              <select name="influenceLevel" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm">
                <option value="">Nível de influência</option>
                <option value="Decisor">Decisor</option>
                <option value="Influenciador">Influenciador</option>
                <option value="Operacional">Operacional</option>
              </select>
            </div>
            <input type="hidden" name="notes" value={contactNotes} />
            <RichTextEditor value={contactNotes} onChange={setContactNotes} minHeight={150} placeholder="Observações do contato, influência, abordagem e relacionamento..." />
            <button className="btn-action px-4 py-2 text-sm"><Plus className="h-4 w-4" />Adicionar contato</button>
          </form>
          <div className="space-y-3">
            {contacts.length === 0 && <p className="rounded-lg border border-line bg-ink p-4 text-sm text-slate-400">Nenhum contato cadastrado.</p>}
            {contacts.map((contact) => (
              <article key={contact.id} className="rounded-lg border border-line bg-ink p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="font-semibold text-white">{contact.name}</p>
                    <p className="mt-1 text-sm text-slate-400">{contact.role || "Cargo não informado"}</p>
                  </div>
                  <div className="grid gap-1 text-xs text-slate-300 md:text-right">
                    {contact.email && <span>E-mail: {contact.email}</span>}
                    {contact.phone && <span>Telefone: {contact.phone}</span>}
                    {contact.whatsapp && <span>WhatsApp: {contact.whatsapp}</span>}
                    {contact.linkedin_url && <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">LinkedIn</a>}
                  </div>
                </div>
                {contact.notes && (
                  <div className="mt-3 rounded-lg border border-line bg-panel/70 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Observações do contato</p>
                    <RichTextPreview value={contact.notes} />
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      )}

      {tab === "historico" && (
        <div className="mt-5 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-4">
            <form onSubmit={addCommunication} className="space-y-3 rounded-lg border border-line bg-panel/70 p-4">
              <p className="text-sm font-semibold text-white">Registrar interação manual</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <select name="type" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm">
                  {["whatsapp", "email", "call", "meeting", "note", "internal", "linkedin", "instagram"].map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <select name="direction" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm">
                  <option value="outbound">Saída</option>
                  <option value="inbound">Entrada</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
              <input name="subject" placeholder="Assunto" className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
              <div className="grid gap-3 sm:grid-cols-2">
                <input name="sentAt" type="datetime-local" className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
                <input name="responsible" placeholder="Responsável pelo registro" className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
              </div>
              <input name="nextAction" placeholder="Próxima ação" className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
              <input type="hidden" name="body" value={communicationBody} />
              <RichTextEditor value={communicationBody} onChange={setCommunicationBody} minHeight={170} placeholder="Conteúdo da interação" />
              <button className="btn-action px-4 py-2 text-sm"><Save className="h-4 w-4" />Registrar interação</button>
            </form>
            <form onSubmit={sendEmail} className="space-y-3 rounded-lg border border-cyan/30 bg-cyan/5 p-4">
              <p className="text-sm font-semibold text-white">Enviar e-mail real via SMTP</p>
              <input name="to" type="email" required defaultValue={(lead as any).emailPrincipal || ""} placeholder="cliente@empresa.com.br" className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
              <input name="subject" required placeholder="Assunto do e-mail" className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
              <input type="hidden" name="body" value={emailBody || editor} />
              <RichTextEditor value={emailBody || editor} onChange={setEmailBody} minHeight={170} placeholder="Mensagem" />
              <button className="inline-flex items-center gap-2 rounded-lg bg-cyan px-4 py-2 text-sm font-semibold text-ink"><MessageCircle className="h-4 w-4" />Enviar e registrar</button>
              <p className="text-xs text-slate-400">Se o envio real ainda não estiver ativo, o sistema retorna um aviso claro e nada é enviado.</p>
            </form>
          </div>
          <div className="space-y-3">
            {communications.length === 0 && <p className="rounded-lg border border-line bg-ink p-4 text-sm text-slate-400">Nenhuma comunicação registrada.</p>}
            {communications.map((comm) => (
              <article key={comm.id} className="rounded-lg border border-line bg-ink p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-cyan/15 px-2 py-1 text-xs font-bold text-cyan">{comm.type}</span>
                  <span className="rounded-full bg-white/5 px-2 py-1 text-xs text-slate-300">{comm.direction}</span>
                  <span className="text-xs text-slate-500">{new Date(comm.sent_at).toLocaleString("pt-BR")}{comm.sent_by ? ` · ${comm.sent_by}` : ""}</span>
                </div>
                {comm.subject && <p className="mt-3 font-semibold text-white">{comm.subject}</p>}
                {comm.body && (
                  <div className="mt-3 rounded-lg border border-line bg-panel/70 p-3">
                    <RichTextPreview value={comm.body} />
                  </div>
                )}
                {comm.metadata?.nextAction && <p className="mt-3 rounded-lg border border-cyan/20 bg-cyan/5 px-3 py-2 text-sm text-slate-300"><strong className="text-white">Próxima ação:</strong> {comm.metadata.nextAction}</p>}
              </article>
            ))}
          </div>
        </div>
      )}

      {tab === "contratos" && (
        <div className="mt-5 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <form onSubmit={addNegotiation} className="space-y-3 rounded-lg border border-line bg-panel/70 p-4">
            <p className="text-sm font-semibold text-white">Criar nova negociação</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="value" placeholder="Valor da negociação" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
              <input name="service" placeholder="Produto/serviço de interesse" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
              <input name="stage" placeholder="Etapa da negociação" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
              <input name="probability" type="number" min={0} max={100} placeholder="Probabilidade (%)" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
              <input name="expectedClose" type="date" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
              <input name="lossReason" placeholder="Motivo de perda, se houver" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
              <input name="nextAction" placeholder="Próxima ação comercial" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm sm:col-span-2" />
            </div>
            <RichTextEditor value={dealNotes} onChange={setDealNotes} minHeight={170} placeholder="Observações da negociação, próximos passos, objeções e contexto..." />
            <button className="btn-action px-4 py-2 text-sm"><Plus className="h-4 w-4" />Criar nova negociação</button>
          </form>
          <div className="space-y-3">
            {documents.filter((item) => item.type === "negociacao").map((document) => (
              <article key={document.id} className="rounded-lg border border-line bg-ink p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold text-white">{document.title}</p>
                  <span className="text-xs text-slate-400">{new Date(document.createdAt).toLocaleString("pt-BR")}</span>
                </div>
                <div className="mt-3 text-sm text-slate-300">
                  <RichTextPreview value={document.content} />
                </div>
              </article>
            ))}
            {documents.filter((item) => item.type === "negociacao").length === 0 && <p className="rounded-lg border border-line bg-ink p-4 text-sm text-slate-400">Nenhuma negociação registrada ainda.</p>}
            <div className="rounded-lg border border-line bg-panel/70 p-4">
              <p className="text-sm font-semibold text-white">Serviços contratados</p>
              {contracts.length === 0 && <p className="mt-3 rounded-lg border border-line bg-ink p-4 text-sm text-slate-400">Nenhum produto ou serviço contratado vinculado. Use o catálogo e a API /companies/:id/contracts para vincular itens.</p>}
              {contracts.map((contract) => (
                <article key={contract.id} className="mt-3 rounded-lg border border-line bg-ink p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{contract.catalog_items?.name || "Item do catálogo"}</p>
                      <p className="mt-1 text-xs text-slate-400">{contract.catalog_items?.code || "Sem código"} · {contract.status || "active"}</p>
                    </div>
                    <p className="text-lg font-black text-cyan">{Number(contract.contracted_price || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                  </div>
                  {contract.notes && <p className="mt-3 text-sm text-slate-300">{contract.notes}</p>}
                </article>
              ))}
            </div>
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
          <RichTextEditor value={editor} onChange={setEditor} minHeight={360} placeholder="O texto gerado ou editado aparece aqui. Você pode alterar antes de salvar, copiar, virar PDF ou usar no WhatsApp." />
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
              Consulta Apollo.io para decisores e LinkedIn somente pelo nome da empresa. Consulta Econodata quando `ECONODATA_API_URL` e `ECONODATA_API_KEY` estiverem configurados no backend. O sistema não inventa CNPJ nem decisores.
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
              <Info label={lead.linkedin ? "LinkedIn direto" : "LinkedIn sugerido"} value={lead.linkedin || linkedinSearchUrl(lead.name)} isLink hint={lead.linkedin ? "Fonte externa/site" : "Busca no LinkedIn somente pelo nome da empresa. Confirme a empresa correta antes de usar."} />
              <Info label="Fontes" value={lead.enrichmentSources?.join(", ")} />
            </dl>
            <div className="mt-5">
              <p className="text-sm font-semibold text-white">Decisores</p>
              <div className="mt-3 space-y-2">
                {lead.decisionMakers?.length ? lead.decisionMakers.map((person, index) => (
                  <div key={`${person.email || person.linkedin || person.name}-${index}`} className="rounded-lg border border-line bg-panel/80 p-3 text-sm">
                    <p className="font-medium text-white">{person.name || "Decisor sem nome"}</p>
                    <p className="mt-1 text-xs text-slate-400">{person.title || "Cargo não informado"} · {person.source || "fonte externa"}</p>
                    {person.linkedin && <a href={person.linkedin} target="_blank" rel="noopener noreferrer" className="mt-2 block text-xs text-cyan hover:underline">Abrir LinkedIn</a>}
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
              <button onClick={() => void downloadPdf(document.title, document.content, document.fileName)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-line px-4 py-2 text-sm text-white"><Download className="h-4 w-4" />Baixar PDF</button>
            </div>
          ))}
        </div>
      )}

      {tab === "whatsapp" && (
        <div className="mt-5 space-y-4">
          <RichTextEditor value={whatsappText} onChange={setEditor} minHeight={220} placeholder="Mensagem para WhatsApp" />
          <div className="flex flex-wrap gap-2">
            <button onClick={() => copy(whatsappText)} className="inline-flex items-center gap-2 rounded-lg border border-line bg-ink px-4 py-2 text-sm text-white"><Copy className="h-4 w-4" />Copiar mensagem</button>
            {isValidBrazilMobileWhatsapp(lead.whatsapp) ? (
              <a target="_blank" href={`https://wa.me/${whatsappDigits(lead.whatsapp)}?text=${encodeURIComponent(whatsappText)}`} className="inline-flex items-center gap-2 rounded-lg bg-success px-4 py-2 text-sm font-semibold text-ink"><MessageCircle className="h-4 w-4" />Abrir WhatsApp</a>
            ) : (
              <span className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-2 text-sm text-amber-100">Informe um WhatsApp celular válido. Telefone fixo fica somente no campo Telefone.</span>
            )}
            <button onClick={() => saveDocument("template_whatsapp")} className="btn-action px-4 py-2 text-sm"><Plus className="h-4 w-4" />Salvar como template</button>
          </div>
        </div>
      )}

      {previewVersion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[86vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-line bg-panel shadow-glow">
            <div className="flex items-center justify-between border-b border-line p-4">
              <div>
                <p className="font-semibold text-white">Versão {previewVersion.version_number}</p>
                <p className="text-xs text-slate-400">{previewVersion.service_type || "Proposta"} · {new Date(previewVersion.created_at).toLocaleString("pt-BR")}</p>
              </div>
              <button onClick={() => setPreviewVersion(null)} className="rounded-lg border border-line px-3 py-2 text-sm text-white">Fechar</button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-5">
              <RichTextPreview value={previewVersion.content || ""} />
            </div>
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

function Field({ name, label, defaultValue, placeholder, required }: { name: string; label: string; defaultValue?: string | number; placeholder?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-400">{label}</span>
      <input
        name={name}
        required={required}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-white outline-none focus:border-electric"
      />
    </label>
  );
}






