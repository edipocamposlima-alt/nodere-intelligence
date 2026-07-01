"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarClock, Copy, Download, Eye, FileText, ImageIcon, MessageCircle, Pencil, Plus, RotateCcw, Save, Sparkles, Trash2, Upload } from "lucide-react";
import { Company } from "@/lib/types";
import { getApiBaseUrl } from "@/lib/apiBase";
import { CommercialInsight, createCalendarEvent, generateCommercialInsights, updateCompany as saveCompanyData } from "@/lib/api";
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

const inputClass = "mt-1 w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-white outline-none focus:border-electric disabled:cursor-not-allowed disabled:opacity-60";
const selectClass = inputClass;
const cardClass = "rounded-lg border border-line bg-ink p-4";
const labelClass = "text-xs font-semibold text-slate-400";

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
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editingNegotiationId, setEditingNegotiationId] = useState<string | null>(null);
  const [contactDraft, setContactDraft] = useState({ name: "", role: "", department: "", phone: "", whatsapp: "", email: "", linkedinUrl: "", influenceLevel: "operacional", primaryDecisionMaker: "nao" });
  const [negotiationDraft, setNegotiationDraft] = useState({ title: "", service: "", value: "", stage: "Primeiro contato", temperature: "Morno", probability: "50", origin: "CRM", expectedClose: "", lossReason: "", nextAction: "" });
  const [emailBody, setEmailBody] = useState("");
  const [instruction, setInstruction] = useState("");
  const [generationType, setGenerationType] = useState("Proposta comercial");
  const [commercialInsight, setCommercialInsight] = useState<CommercialInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [enrichmentMessages, setEnrichmentMessages] = useState<string[]>([]);
  const [currentRole, setCurrentRole] = useState("viewer");
  const canEdit = ["owner", "admin", "operator"].includes(currentRole);

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

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth/me", { credentials: "include", cache: "no-store", signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => setCurrentRole(String(payload?.user?.role || "viewer").toLowerCase()))
      .catch(() => setCurrentRole("viewer"));
    return () => controller.abort();
  }, []);

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
    if (!canEdit) return showError(new Error("Seu perfil possui acesso somente leitura nesta ficha."));
    const target = event.currentTarget;
    const notes = contactNotes.trim();
    if (!contactDraft.name.trim()) return showError(new Error("Informe o nome do contato."));
    const details = [
      contactDraft.department ? `**Departamento:** ${contactDraft.department}` : "",
      contactDraft.influenceLevel ? `**Nível de influência:** ${contactDraft.influenceLevel}` : "",
      `**Principal decisor:** ${contactDraft.primaryDecisionMaker === "sim" ? "Sim" : "Não"}`,
      notes
    ].filter(Boolean).join("\n\n");
    const payload = {
      name: contactDraft.name.trim(),
      role: contactDraft.role.trim(),
      email: contactDraft.email.trim(),
      phone: contactDraft.phone.trim(),
      whatsapp: contactDraft.whatsapp.trim(),
      linkedinUrl: contactDraft.linkedinUrl.trim(),
      notes: details
    };
    try {
      const contact = await api<Contact>(`${companyPath}/contacts${editingContactId ? `/${encodeURIComponent(editingContactId)}` : ""}`, {
        method: editingContactId ? "PATCH" : "POST",
        body: JSON.stringify(payload)
      });
      setContacts((items) => editingContactId ? items.map((item) => item.id === editingContactId ? contact : item) : [contact, ...items]);
      target.reset();
      setContactDraft({ name: "", role: "", department: "", phone: "", whatsapp: "", email: "", linkedinUrl: "", influenceLevel: "operacional", primaryDecisionMaker: "nao" });
      setContactNotes("");
      setEditingContactId(null);
      showSuccess(editingContactId ? "Contato atualizado." : "Contato salvo.");
    } catch (err) {
      showError(err);
    }
  }

  function startEditContact(contact: Contact) {
    setEditingContactId(contact.id);
    setContactDraft({
      name: contact.name || "",
      role: contact.role || "",
      department: "",
      phone: contact.phone || "",
      whatsapp: contact.whatsapp || "",
      email: contact.email || "",
      linkedinUrl: contact.linkedin_url || "",
      influenceLevel: contact.notes?.match(/\*\*Nível de influência:\*\*\s*([^\n]+)/)?.[1]?.trim().toLowerCase() || "operacional",
      primaryDecisionMaker: contact.notes?.includes("**Principal decisor:** Sim") ? "sim" : "nao"
    });
    setContactNotes(contact.notes || "");
  }

  function cancelEditContact() {
    setEditingContactId(null);
    setContactDraft({ name: "", role: "", department: "", phone: "", whatsapp: "", email: "", linkedinUrl: "", influenceLevel: "operacional", primaryDecisionMaker: "nao" });
    setContactNotes("");
  }

  async function deleteContact(contactId: string) {
    if (!canEdit) return showError(new Error("Seu perfil possui acesso somente leitura nesta ficha."));
    try {
      await api<{ ok: boolean }>(`${companyPath}/contacts/${encodeURIComponent(contactId)}`, { method: "DELETE" });
      setContacts((items) => items.filter((item) => item.id !== contactId));
      showSuccess("Contato removido.");
    } catch (err) {
      showError(err);
    }
  }

  async function addNegotiation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canEdit) return showError(new Error("Seu perfil possui acesso somente leitura nesta ficha."));
    const target = event.currentTarget;
    if (!negotiationDraft.title.trim() && !negotiationDraft.service.trim()) return showError(new Error("Informe o título ou o produto/serviço da negociação."));
    const content = [
      `**Título da negociação:** ${negotiationDraft.title || "Não informado"}`,
      `**Produto/serviço de interesse:** ${negotiationDraft.service || "Não informado"}`,
      `**Valor estimado:** ${negotiationDraft.value || "Não informado"}`,
      `**Etapa da negociação:** ${negotiationDraft.stage || "Não informada"}`,
      `**Temperatura:** ${negotiationDraft.temperature || "Não informada"}`,
      `**Probabilidade de fechamento:** ${negotiationDraft.probability || "0"}%`,
      `**Origem da oportunidade:** ${negotiationDraft.origin || "Não informada"}`,
      `**Data prevista de fechamento:** ${negotiationDraft.expectedClose || "Não informada"}`,
      `**Motivo de perda:** ${negotiationDraft.lossReason || "Não aplicável"}`,
      `**Próxima ação comercial:** ${negotiationDraft.nextAction || "Não informada"}`,
      "",
      dealNotes || "Sem observações."
    ].join("\n");
    const title = negotiationDraft.title.trim() || `Negociação - ${negotiationDraft.service.trim() || "Produto/serviço"}`;
    try {
      const document = await api<DocumentItem>(`${companyPath}/documents${editingNegotiationId ? `/${encodeURIComponent(editingNegotiationId)}` : ""}`, {
        method: editingNegotiationId ? "PATCH" : "POST",
        body: JSON.stringify({ type: "negociacao", title, content })
      });
      setDocuments((items) => editingNegotiationId ? items.map((item) => item.id === editingNegotiationId ? document : item) : [document, ...items]);
      setDealNotes("");
      setNegotiationDraft({ title: "", service: "", value: "", stage: "Primeiro contato", temperature: "Morno", probability: "50", origin: "CRM", expectedClose: "", lossReason: "", nextAction: "" });
      setEditingNegotiationId(null);
      target.reset();
      showSuccess(editingNegotiationId ? "Negociação atualizada." : "Negociação registrada.");
    } catch (err) {
      showError(err);
    }
  }

  function startEditNegotiation(document: DocumentItem) {
    setEditingNegotiationId(document.id);
    setNegotiationDraft((current) => ({ ...current, title: document.title.replace(/^Negociação - /, "") }));
    setDealNotes(document.content || "");
  }

  function cancelEditNegotiation() {
    setEditingNegotiationId(null);
    setNegotiationDraft({ title: "", service: "", value: "", stage: "Primeiro contato", temperature: "Morno", probability: "50", origin: "CRM", expectedClose: "", lossReason: "", nextAction: "" });
    setDealNotes("");
  }

  async function deleteNegotiation(documentId: string) {
    if (!canEdit) return showError(new Error("Seu perfil possui acesso somente leitura nesta ficha."));
    try {
      await api<{ ok: boolean }>(`${companyPath}/documents/${encodeURIComponent(documentId)}`, { method: "DELETE" });
      setDocuments((items) => items.filter((item) => item.id !== documentId));
      showSuccess("Negociação removida.");
    } catch (err) {
      showError(err);
    }
  }

  async function addCommunication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canEdit) return showError(new Error("Seu perfil possui acesso somente leitura nesta ficha."));
    const target = event.currentTarget;
    const form = new FormData(target);
    const subject = String(form.get("subject") || "").trim();
    const body = String(form.get("body") || "").trim();
    if (!subject && !body) return showError(new Error("Informe um resumo ou observação detalhada da interação."));
    try {
      const comm = await api<Communication>(`${companyPath}/communications`, {
        method: "POST",
        body: JSON.stringify({
          type: form.get("type"),
          direction: form.get("direction"),
          subject,
          body,
          sentAt: form.get("sentAt") || new Date().toISOString(),
          responsible: form.get("responsible"),
          nextAction: [form.get("nextAction"), form.get("nextActionAt") ? `em ${form.get("nextActionAt")}` : ""].filter(Boolean).join(" ")
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

  async function deleteCommunication(commId: string) {
    if (!canEdit) return showError(new Error("Seu perfil possui acesso somente leitura nesta ficha."));
    try {
      await api<{ ok: boolean }>(`${companyPath}/communications/${encodeURIComponent(commId)}`, { method: "DELETE" });
      setCommunications((items) => items.filter((item) => item.id !== commId));
      showSuccess("Interação removida.");
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

  async function generateCommercialInsight() {
    setLoading(true);
    setError(null);
    try {
      const response = await generateCommercialInsights({ lead_id: lead.id, persist: true });
      setCommercialInsight(response.insight);
      setEditor([
        `Resumo automático\n${response.insight.summary}`,
        `Análise de presença digital\n${response.insight.digitalPresenceAnalysis}`,
        `Classificação\n${response.insight.opportunityClassification} · ${response.insight.temperature} · Score ${response.insight.score}/100`,
        `Abordagem recomendada\n${response.insight.recommendedApproach}`,
        `Primeira abordagem\n${response.insight.firstApproach}`,
        `Follow-up\n${response.insight.followUp}`,
        `Sugestão de proposta\n${response.insight.proposalSuggestion}`,
        response.insight.nextSteps.length ? `Próximos passos\n- ${response.insight.nextSteps.join("\n- ")}` : ""
      ].filter(Boolean).join("\n\n"));
      api<Communication[]>(`${companyPath}/communications`).then((items) => setCommunications(Array.isArray(items) ? items : [])).catch(() => {});
      showSuccess(response.warning ? "Insight gerado com fallback controlado e registrado no histórico." : "Insight comercial gerado e registrado no histórico.");
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
      {!canEdit && (
        <p className="mt-4 rounded-md border border-line bg-panel px-3 py-2 text-sm text-slate-300">
          Perfil viewer: esta ficha está em modo somente leitura. Criação, edição e exclusão permanecem bloqueadas.
        </p>
      )}

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
          <form onSubmit={addContact} className={`${cardClass} space-y-4`}>
            <div>
              <h4 className="font-semibold text-white">{editingContactId ? "Editar contato" : "Adicionar novo contato"}</h4>
              <p className="mt-1 text-xs text-slate-400">Cadastre decisores, influenciadores e contatos operacionais vinculados à empresa.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <TextInput label="Nome do contato" required disabled={!canEdit} value={contactDraft.name} onChange={(value) => setContactDraft((current) => ({ ...current, name: value }))} />
              <TextInput label="Cargo/função" disabled={!canEdit} value={contactDraft.role} onChange={(value) => setContactDraft((current) => ({ ...current, role: value }))} />
              <TextInput label="Departamento" disabled={!canEdit} value={contactDraft.department} onChange={(value) => setContactDraft((current) => ({ ...current, department: value }))} />
              <TextInput label="Telefone" disabled={!canEdit} value={contactDraft.phone} onChange={(value) => setContactDraft((current) => ({ ...current, phone: value }))} />
              <TextInput label="WhatsApp" disabled={!canEdit} value={contactDraft.whatsapp} onChange={(value) => setContactDraft((current) => ({ ...current, whatsapp: value }))} />
              <TextInput label="E-mail" type="email" disabled={!canEdit} value={contactDraft.email} onChange={(value) => setContactDraft((current) => ({ ...current, email: value }))} />
              <TextInput label="LinkedIn" disabled={!canEdit} value={contactDraft.linkedinUrl} onChange={(value) => setContactDraft((current) => ({ ...current, linkedinUrl: value }))} />
              <label className="block">
                <span className={labelClass}>Nível de influência</span>
                <select disabled={!canEdit} value={contactDraft.influenceLevel} onChange={(event) => setContactDraft((current) => ({ ...current, influenceLevel: event.target.value }))} className={selectClass}>
                  <option value="decisor">Decisor</option>
                  <option value="influenciador">Influenciador</option>
                  <option value="operacional">Operacional</option>
                </select>
              </label>
              <label className="block md:col-span-2">
                <span className={labelClass}>Principal decisor</span>
                <select disabled={!canEdit} value={contactDraft.primaryDecisionMaker} onChange={(event) => setContactDraft((current) => ({ ...current, primaryDecisionMaker: event.target.value }))} className={selectClass}>
                  <option value="nao">Não</option>
                  <option value="sim">Sim</option>
                </select>
              </label>
            </div>
            <input type="hidden" name="notes" value={contactNotes} />
            <div>
              <span className={labelClass}>Observações</span>
              <RichTextEditor value={contactNotes} onChange={setContactNotes} minHeight={170} placeholder="Observações do contato, influência, abordagem e relacionamento..." />
            </div>
            <div className="flex flex-wrap gap-2">
              <button disabled={!canEdit} className="btn-action px-4 py-2 text-sm disabled:opacity-60"><Plus className="h-4 w-4" />{editingContactId ? "Salvar contato" : "Adicionar contato"}</button>
              {editingContactId && <button type="button" onClick={cancelEditContact} className="inline-flex items-center gap-2 rounded-lg border border-line bg-panel px-4 py-2 text-sm font-semibold text-[var(--text-primary)]"><RotateCcw className="h-4 w-4" />Cancelar</button>}
            </div>
          </form>
          <div className="space-y-3">
            {contacts.length === 0 && <p className="rounded-lg border border-line bg-ink p-4 text-sm text-slate-400">Nenhum contato cadastrado.</p>}
            {contacts.map((contact) => (
              <article key={contact.id} className="rounded-lg border border-line bg-ink p-4">
                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
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
                <div className="mt-3 flex flex-wrap gap-2">
                  <button disabled={!canEdit} onClick={() => startEditContact(contact)} className="inline-flex items-center gap-2 rounded-lg border border-line bg-panel px-3 py-2 text-xs font-semibold text-[var(--text-primary)] disabled:opacity-50"><Pencil className="h-3.5 w-3.5" />Editar</button>
                  <button disabled={!canEdit} onClick={() => void deleteContact(contact.id)} className="inline-flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs font-semibold text-red-200 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" />Excluir</button>
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
            <form onSubmit={addCommunication} className={`${cardClass} space-y-4`}>
              <div>
                <h4 className="font-semibold text-white">Registrar interação comercial</h4>
                <p className="mt-1 text-xs text-slate-400">Inclua ligação, WhatsApp, e-mail, reunião, proposta ou observação com próxima ação.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>Tipo de interação</span>
                  <select name="type" disabled={!canEdit} className={selectClass}>
                    <option value="call">Ligação</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">E-mail</option>
                    <option value="meeting">Reunião</option>
                    <option value="proposal">Proposta</option>
                    <option value="note">Observação</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="instagram">Instagram</option>
                    <option value="internal">Interno</option>
                  </select>
                </label>
                <label className="block">
                  <span className={labelClass}>Canal utilizado</span>
                  <select name="direction" disabled={!canEdit} className={selectClass}>
                    <option value="outbound">Saída</option>
                    <option value="inbound">Entrada</option>
                    <option value="manual">Manual</option>
                  </select>
                </label>
                <TextInput label="Resumo do contato" disabled={!canEdit} name="subject" />
                <TextInput label="Data da interação" disabled={!canEdit} name="sentAt" type="datetime-local" />
                <TextInput label="Responsável" disabled={!canEdit} name="responsible" />
                <TextInput label="Próxima ação" disabled={!canEdit} name="nextAction" />
              </div>
              <label className="block">
                <span className={labelClass}>Data da próxima ação</span>
                <input name="nextActionAt" disabled={!canEdit} type="datetime-local" className={inputClass} />
              </label>
              <input type="hidden" name="body" value={communicationBody} />
              <div>
                <span className={labelClass}>Observações detalhadas</span>
                <RichTextEditor value={communicationBody} onChange={setCommunicationBody} minHeight={190} placeholder="Descreva o contato, objeções, combinado e contexto comercial..." />
              </div>
              {companyFiles.length > 0 && <p className="text-xs text-slate-400">Anexos disponíveis na aba Propostas e contratos: {companyFiles.length} arquivo(s).</p>}
              <button disabled={!canEdit} className="btn-action px-4 py-2 text-sm disabled:opacity-60"><Save className="h-4 w-4" />Registrar interação</button>
            </form>
            <form onSubmit={sendEmail} className="space-y-3 rounded-lg border border-cyan/30 bg-cyan/5 p-4">
              <p className="text-sm font-semibold text-white">Enviar e-mail real via SMTP</p>
              <input name="to" type="email" required disabled={!canEdit} defaultValue={(lead as any).emailPrincipal || ""} placeholder="cliente@empresa.com.br" className={inputClass} />
              <input name="subject" required disabled={!canEdit} placeholder="Assunto do e-mail" className={inputClass} />
              <input type="hidden" name="body" value={emailBody || editor} />
              <RichTextEditor value={emailBody || editor} onChange={setEmailBody} minHeight={170} placeholder="Mensagem" />
              <button disabled={!canEdit} className="inline-flex items-center gap-2 rounded-lg bg-cyan px-4 py-2 text-sm font-semibold text-ink disabled:opacity-60"><MessageCircle className="h-4 w-4" />Enviar e registrar</button>
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
                <div className="mt-3 flex flex-wrap gap-2">
                  <button disabled={!canEdit} onClick={() => void deleteCommunication(comm.id)} className="inline-flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs font-semibold text-red-200 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" />Excluir</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {tab === "contratos" && (
        <div className="mt-5 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <form onSubmit={addNegotiation} className={`${cardClass} space-y-4`}>
            <div>
              <h4 className="font-semibold text-white">{editingNegotiationId ? "Editar negociação" : "Criar nova negociação"}</h4>
              <p className="mt-1 text-xs text-slate-400">Registre oportunidade, etapa, valor, probabilidade e próximos passos comerciais.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <TextInput label="Título da negociação" disabled={!canEdit} value={negotiationDraft.title} onChange={(value) => setNegotiationDraft((current) => ({ ...current, title: value }))} />
              <TextInput label="Produto/serviço de interesse" disabled={!canEdit} value={negotiationDraft.service} onChange={(value) => setNegotiationDraft((current) => ({ ...current, service: value }))} />
              <TextInput label="Valor estimado" disabled={!canEdit} value={negotiationDraft.value} onChange={(value) => setNegotiationDraft((current) => ({ ...current, value }))} />
              <label className="block">
                <span className={labelClass}>Etapa da negociação</span>
                <select disabled={!canEdit} value={negotiationDraft.stage} onChange={(event) => setNegotiationDraft((current) => ({ ...current, stage: event.target.value }))} className={selectClass}>
                  <option>Primeiro contato</option>
                  <option>Qualificação</option>
                  <option>Diagnóstico</option>
                  <option>Proposta enviada</option>
                  <option>Negociação</option>
                  <option>Ganha</option>
                  <option>Perdida</option>
                </select>
              </label>
              <label className="block">
                <span className={labelClass}>Temperatura</span>
                <select disabled={!canEdit} value={negotiationDraft.temperature} onChange={(event) => setNegotiationDraft((current) => ({ ...current, temperature: event.target.value }))} className={selectClass}>
                  <option>Frio</option>
                  <option>Morno</option>
                  <option>Quente</option>
                </select>
              </label>
              <TextInput label="Probabilidade de fechamento (%)" type="number" disabled={!canEdit} value={negotiationDraft.probability} onChange={(value) => setNegotiationDraft((current) => ({ ...current, probability: value }))} />
              <TextInput label="Origem da oportunidade" disabled={!canEdit} value={negotiationDraft.origin} onChange={(value) => setNegotiationDraft((current) => ({ ...current, origin: value }))} />
              <TextInput label="Data prevista de fechamento" type="date" disabled={!canEdit} value={negotiationDraft.expectedClose} onChange={(value) => setNegotiationDraft((current) => ({ ...current, expectedClose: value }))} />
              <TextInput label="Motivo de perda" disabled={!canEdit} value={negotiationDraft.lossReason} onChange={(value) => setNegotiationDraft((current) => ({ ...current, lossReason: value }))} />
              <TextInput label="Próxima ação" disabled={!canEdit} value={negotiationDraft.nextAction} onChange={(value) => setNegotiationDraft((current) => ({ ...current, nextAction: value }))} />
            </div>
            <div>
              <span className={labelClass}>Observações da negociação</span>
              <RichTextEditor value={dealNotes} onChange={setDealNotes} minHeight={190} placeholder="Observações da negociação, próximos passos, objeções e contexto..." />
            </div>
            <div className="flex flex-wrap gap-2">
              <button disabled={!canEdit} className="btn-action px-4 py-2 text-sm disabled:opacity-60"><Plus className="h-4 w-4" />{editingNegotiationId ? "Salvar negociação" : "Criar nova negociação"}</button>
              {editingNegotiationId && <button type="button" onClick={cancelEditNegotiation} className="inline-flex items-center gap-2 rounded-lg border border-line bg-panel px-4 py-2 text-sm font-semibold text-[var(--text-primary)]"><RotateCcw className="h-4 w-4" />Cancelar</button>}
            </div>
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
                <div className="mt-3 flex flex-wrap gap-2">
                  <button disabled={!canEdit} onClick={() => startEditNegotiation(document)} className="inline-flex items-center gap-2 rounded-lg border border-line bg-panel px-3 py-2 text-xs font-semibold text-[var(--text-primary)] disabled:opacity-50"><Pencil className="h-3.5 w-3.5" />Editar</button>
                  <button disabled={!canEdit} onClick={() => void deleteNegotiation(document.id)} className="inline-flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs font-semibold text-red-200 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" />Excluir</button>
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
            <div className="flex flex-wrap gap-2">
              <button onClick={generateWithAi} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg bg-electric px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"><Sparkles className="h-4 w-4" />{loading ? "Gerando" : "Gerar com IA"}</button>
              <button onClick={generateCommercialInsight} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg border border-violet-400/40 bg-violet-500/15 px-4 py-2 text-sm font-semibold text-violet-100 disabled:opacity-60"><Sparkles className="h-4 w-4" />Insight comercial</button>
            </div>
          </div>
          {commercialInsight && (
            <section className="grid gap-3 rounded-lg border border-violet-400/25 bg-violet-500/10 p-4 md:grid-cols-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Temperatura</p>
                <p className="mt-1 text-lg font-semibold text-white">{commercialInsight.temperature}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Classificação</p>
                <p className="mt-1 text-sm font-semibold text-white">{commercialInsight.opportunityClassification}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Próximo passo</p>
                <p className="mt-1 text-sm text-slate-200">{commercialInsight.nextSteps[0]}</p>
              </div>
            </section>
          )}
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
          <div className="max-h-[86dvh] w-full max-w-3xl overflow-hidden rounded-2xl border border-line bg-panel shadow-glow">
            <div className="flex items-center justify-between border-b border-line p-4">
              <div>
                <p className="font-semibold text-white">Versão {previewVersion.version_number}</p>
                <p className="text-xs text-slate-400">{previewVersion.service_type || "Proposta"} · {new Date(previewVersion.created_at).toLocaleString("pt-BR")}</p>
              </div>
              <button onClick={() => setPreviewVersion(null)} className="rounded-lg border border-line px-3 py-2 text-sm text-white">Fechar</button>
            </div>
            <div className="max-h-[70dvh] overflow-y-auto p-5">
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
      <span className={labelClass}>{label}</span>
      <input
        name={name}
        required={required}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className={inputClass}
      />
    </label>
  );
}

function TextInput({
  label,
  name,
  value,
  onChange,
  type = "text",
  required,
  disabled
}: {
  label: string;
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
  type?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const controlled = value !== undefined;
  return (
    <label className="block">
      <span className={labelClass}>{label}{required ? " *" : ""}</span>
      <input
        name={name}
        type={type}
        required={required}
        disabled={disabled}
        value={controlled ? value : undefined}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        className={inputClass}
      />
    </label>
  );
}






