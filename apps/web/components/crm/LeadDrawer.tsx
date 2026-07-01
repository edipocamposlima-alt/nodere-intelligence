"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Brain, Building2, CalendarDays, Mail, MessageCircle, Pencil, Phone, Plus, Save, Trash2, Users, X } from "lucide-react";
import type { Company } from "@/lib/types";
import { CRM_STAGES } from "@/lib/crm-stages";
import { InboxMessage, addLeadActivity, addLeadContact, addLeadDeal, createLead, deleteLeadActivity, deleteLeadContact, deleteLeadDeal, getInboxMessagesByCompany, getLeadActivities, getLeadContacts, getLeadDeals, updateLeadActivity, updateLeadContact, updateLeadDeal } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/Input";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { RichTextEditor, RichTextPreview } from "@/components/RichTextEditor";

const tabs = [
  { id: "overview", label: "Visão Geral", icon: Building2 },
  { id: "history", label: "Histórico", icon: CalendarDays },
  { id: "contacts", label: "Contatos", icon: Users },
  { id: "deals", label: "Negociações", icon: Save },
  { id: "ai", label: "IA", icon: Brain }
] as const;

type TabId = typeof tabs[number]["id"];

type LeadDraft = {
  name: string;
  legalName: string;
  cnpj: string;
  category: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  status: string;
  temperature: string;
  serviceInterest: string;
  notes: string;
};

const emptyDraft: LeadDraft = {
  name: "",
  legalName: "",
  cnpj: "",
  category: "",
  city: "",
  state: "",
  address: "",
  phone: "",
  whatsapp: "",
  email: "",
  website: "",
  status: "Novo Lead",
  temperature: "Morno",
  serviceInterest: "",
  notes: ""
};

type ActivityDraft = { type: string; occurredAt: string; responsible: string; channel: string; summary: string; nextAction: string; nextActionAt: string; status: string; details: string; attachments: string[] };
type ContactDraft = { name: string; role: string; department: string; phone: string; whatsapp: string; email: string; linkedinUrl: string; contactType: string; influenceLevel: "decisor" | "influenciador" | "operacional"; isPrimary: boolean; isFinancial: boolean; isTechnical: boolean; notes: string };
type DealDraft = { name: string; value: string; itemName: string; status: string; temperature: string; probability: string; origin: string; expectedClose: string; lastContact: string; lostReason: string; nextAction: string; proposalId: string; contractId: string; responsible: string; notes: string };

function currentLocalDateTime() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

const emptyActivity = (): ActivityDraft => ({ type: "call", occurredAt: currentLocalDateTime(), responsible: "", channel: "Telefone", summary: "", nextAction: "", nextActionAt: "", status: "concluido", details: "", attachments: [] });
const emptyContact = (): ContactDraft => ({ name: "", role: "", department: "", phone: "", whatsapp: "", email: "", linkedinUrl: "", contactType: "comercial", influenceLevel: "operacional", isPrimary: false, isFinancial: false, isTechnical: false, notes: "" });
const emptyDeal = (): DealDraft => ({ name: "", value: "", itemName: "", status: "negotiating", temperature: "Morno", probability: "50", origin: "CRM", expectedClose: "", lastContact: "", lostReason: "", nextAction: "", proposalId: "", contractId: "", responsible: "", notes: "" });

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function dealNotes(draft: DealDraft) {
  return draft.notes || "";
}

const activityLabels: Record<string, string> = {
  call: "Ligação",
  whatsapp: "WhatsApp",
  email: "E-mail",
  meeting: "Reunião",
  visit: "Visita",
  proposal: "Proposta enviada",
  follow_up: "Follow-up",
  customer_return: "Retorno do cliente",
  loss: "Perda",
  closing: "Fechamento",
  note: "Observação"
};

const dealStatusLabels: Record<string, string> = {
  negotiating: "Em negociação",
  proposal: "Proposta enviada",
  won: "Ganha",
  lost: "Perdida",
  paused: "Pausada"
};

function activitySort(a: Record<string, unknown>, b: Record<string, unknown>) {
  return new Date(String(b.sent_at || b.createdAt || 0)).getTime() - new Date(String(a.sent_at || a.createdAt || 0)).getTime();
}

function parseDealDetails(value: unknown): Partial<DealDraft> {
  try {
    const parsed = JSON.parse(String(value || "{}"));
    return parsed && typeof parsed === "object" ? parsed as Partial<DealDraft> : {};
  } catch {
    return {};
  }
}

function safeExternalUrl(value: unknown) {
  try {
    const url = new URL(String(value));
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function draftFromLead(lead?: Company | null): LeadDraft {
  if (!lead) return emptyDraft;
  return {
    name: lead.name || "",
    legalName: lead.legalName || "",
    cnpj: lead.cnpj || "",
    category: lead.category || "",
    city: lead.city || "",
    state: lead.state || "",
    address: lead.address || "",
    phone: lead.phone || "",
    whatsapp: lead.whatsapp || "",
    email: "",
    website: lead.website || "",
    status: lead.status || "Novo Lead",
    temperature: lead.opportunityLevel === "Alta" ? "Quente" : lead.opportunityLevel === "Baixa" ? "Frio" : "Morno",
    serviceInterest: "",
    notes: lead.notes?.map((note) => note.body).join("\n") || ""
  };
}

interface LeadDrawerProps {
  lead?: Company | null;
  open: boolean;
  onClose: () => void;
  onCreated?: (lead: Company) => void;
}

export function LeadDrawer({ lead, open, onClose, onCreated }: LeadDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [draft, setDraft] = useState<LeadDraft>(draftFromLead(lead));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [activities, setActivities] = useState<Array<Record<string, unknown>>>([]);
  const [contacts, setContacts] = useState<Array<Record<string, unknown>>>([]);
  const [deals, setDeals] = useState<Array<Record<string, unknown>>>([]);
  const [whatsappTimeline, setWhatsappTimeline] = useState<InboxMessage[]>([]);
  const [relationErrors, setRelationErrors] = useState({ history: "", contacts: "", deals: "" });
  const [activityDraft, setActivityDraft] = useState<ActivityDraft>(emptyActivity);
  const [contactDraft, setContactDraft] = useState<ContactDraft>(emptyContact);
  const [dealDraft, setDealDraft] = useState<DealDraft>(emptyDeal);
  const [editingContactId, setEditingContactId] = useState("");
  const [editingDealId, setEditingDealId] = useState("");
  const [editingActivityId, setEditingActivityId] = useState("");
  const [activityFilter, setActivityFilter] = useState({ type: "", responsible: "", status: "", date: "" });
  const [dealFilter, setDealFilter] = useState({ status: "", temperature: "", responsible: "", minValue: "", date: "" });
  const [currentRole, setCurrentRole] = useState("viewer");
  const isNew = !lead?.id;
  const canEdit = ["owner", "admin", "operator"].includes(currentRole);

  useEffect(() => {
    if (!open) return;
    setActiveTab("overview");
    setDraft(draftFromLead(lead));
    setMessage("");
    setActivityDraft(emptyActivity());
    setContactDraft(emptyContact());
    setDealDraft(emptyDeal());
    setEditingContactId("");
    setEditingDealId("");
    setEditingActivityId("");
    setRelationErrors({ history: "", contacts: "", deals: "" });
  }, [lead, open]);

  useEffect(() => {
    if (!open || !lead?.id) return;
    getLeadActivities(lead.id)
      .then((items) => {
        setActivities(items);
        setRelationErrors((current) => ({ ...current, history: "" }));
      })
      .catch((error: unknown) => {
        setActivities([]);
        setRelationErrors((current) => ({ ...current, history: error instanceof Error ? error.message : "Não foi possível carregar o histórico." }));
      });
    getLeadContacts(lead.id)
      .then((items) => {
        setContacts(items);
        setRelationErrors((current) => ({ ...current, contacts: "" }));
      })
      .catch((error: unknown) => {
        setContacts([]);
        setRelationErrors((current) => ({ ...current, contacts: error instanceof Error ? error.message : "Não foi possível carregar os contatos." }));
      });
    getLeadDeals(lead.id)
      .then((items) => {
        setDeals(items);
        setRelationErrors((current) => ({ ...current, deals: "" }));
      })
      .catch((error: unknown) => {
        setDeals([]);
        setRelationErrors((current) => ({ ...current, deals: error instanceof Error ? error.message : "Não foi possível carregar as negociações." }));
      });
    getInboxMessagesByCompany(lead.id)
      .then((payload) => setWhatsappTimeline(payload.messages.filter((item) => item.type === "whatsapp")))
      .catch(() => setWhatsappTimeline([]));
  }, [lead?.id, open]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    fetch("/api/auth/me", { credentials: "include", cache: "no-store", signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => setCurrentRole(String(payload?.user?.role || "viewer")))
      .catch(() => setCurrentRole("viewer"));
    return () => controller.abort();
  }, [open]);

  const estimatedValue = useMemo(() => deals.reduce((sum, deal) => {
    const value = Number(deal.total_price ?? deal.contracted_price ?? 0);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0), [deals]);

  const filteredActivities = useMemo(() => activities.filter((activity) => {
    const metadata = asRecord(activity.metadata);
    const sentAt = String(activity.sent_at || activity.createdAt || "").slice(0, 10);
    return (!activityFilter.type || activity.type === activityFilter.type)
      && (!activityFilter.responsible || String(activity.sent_by || metadata.responsible || "").toLowerCase().includes(activityFilter.responsible.toLowerCase()))
      && (!activityFilter.status || String(metadata.status || activity.status || "") === activityFilter.status)
      && (!activityFilter.date || sentAt === activityFilter.date);
  }).sort(activitySort), [activities, activityFilter]);

  const filteredDeals = useMemo(() => deals.filter((deal) => {
    const details = parseDealDetails(deal.description);
    const value = Number(deal.total_price ?? deal.contracted_price ?? 0);
    return (!dealFilter.status || deal.status === dealFilter.status)
      && (!dealFilter.temperature || details.temperature === dealFilter.temperature)
      && (!dealFilter.responsible || String(details.responsible || "").toLowerCase().includes(dealFilter.responsible.toLowerCase()))
      && (!dealFilter.minValue || value >= Number(dealFilter.minValue))
      && (!dealFilter.date || String(deal.ended_at || "").slice(0, 10) === dealFilter.date);
  }), [deals, dealFilter]);

  if (!open) return null;

  function setField<K extends keyof LeadDraft>(key: K, value: LeadDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function saveLead() {
    if (!draft.name.trim()) {
      setMessage("Informe o nome da empresa.");
      return;
    }
    setSaving(true);
    setMessage("Salvando lead...");
    try {
      const saved = await createLead(draft);
      setMessage("Lead salvo no CRM.");
      onCreated?.(saved);
      setTimeout(onClose, 650);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar o lead.");
    } finally {
      setSaving(false);
    }
  }

  async function registerActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!lead?.id) {
      setMessage("Salve o lead antes de registrar histórico.");
      return;
    }
    if (!activityDraft.details.trim()) {
      setMessage("Descreva a atividade realizada.");
      return;
    }
    try {
      const payload = {
        type: activityDraft.type,
        title: activityDraft.summary || activityLabels[activityDraft.type] || "Interação comercial",
        body: activityDraft.details,
        occurredAt: activityDraft.occurredAt ? new Date(activityDraft.occurredAt).toISOString() : undefined,
        responsible: activityDraft.responsible,
        nextAction: activityDraft.nextAction,
        metadata: {
          channel: activityDraft.channel,
          summary: activityDraft.summary,
          nextActionAt: activityDraft.nextActionAt ? new Date(activityDraft.nextActionAt).toISOString() : "",
          status: activityDraft.status,
          attachments: activityDraft.attachments
        }
      };
      const activity = editingActivityId
        ? await updateLeadActivity(lead.id, editingActivityId, payload)
        : await addLeadActivity(lead.id, payload);
      setActivities((current) => editingActivityId ? current.map((item) => item.id === editingActivityId ? activity : item) : [activity, ...current]);
      setActivityDraft(emptyActivity());
      setEditingActivityId("");
      setMessage(editingActivityId ? "Histórico atualizado." : "Atividade registrada no histórico.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível registrar a atividade.");
    }
  }

  async function registerContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!lead?.id) {
      setMessage("Salve o lead antes de adicionar contatos.");
      return;
    }
    if (!contactDraft.name.trim()) {
      setMessage("Informe o nome do contato.");
      return;
    }
    try {
      const payload = { ...contactDraft, isDecisionMaker: contactDraft.influenceLevel === "decisor" };
      const contact = editingContactId
        ? await updateLeadContact(lead.id, editingContactId, payload)
        : await addLeadContact(lead.id, payload);
      setContacts((current) => editingContactId ? current.map((item) => item.id === editingContactId ? contact : item) : [contact, ...current]);
      setContactDraft(emptyContact());
      setEditingContactId("");
      setMessage(editingContactId ? "Contato atualizado." : "Contato adicionado.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar o contato.");
    }
  }

  async function registerDeal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!lead?.id) {
      setMessage("Salve o lead antes de registrar negociações.");
      return;
    }
    if (!dealDraft.itemName.trim()) {
      setMessage("Informe o produto ou serviço de interesse.");
      return;
    }
    try {
      const value = Number(String(dealDraft.value || "0").replace(/\./g, "").replace(",", "."));
      const payload = {
        itemName: dealDraft.itemName,
        totalPrice: Number.isFinite(value) ? value : 0,
        unitPrice: Number.isFinite(value) ? value : 0,
        status: dealDraft.status,
        endedAt: dealDraft.expectedClose || undefined,
        description: JSON.stringify({
          name: dealDraft.name,
          temperature: dealDraft.temperature,
          probability: dealDraft.probability,
          origin: dealDraft.origin,
          expectedClose: dealDraft.expectedClose,
          lastContact: dealDraft.lastContact,
          lostReason: dealDraft.lostReason,
          nextAction: dealDraft.nextAction,
          proposalId: dealDraft.proposalId,
          contractId: dealDraft.contractId,
          responsible: dealDraft.responsible
        }),
        notes: dealNotes(dealDraft)
      };
      const deal = editingDealId
        ? await updateLeadDeal(lead.id, editingDealId, payload)
        : await addLeadDeal(lead.id, payload);
      setDeals((current) => editingDealId ? current.map((item) => item.id === editingDealId ? deal : item) : [deal, ...current]);
      setDealDraft(emptyDeal());
      setEditingDealId("");
      setMessage(editingDealId ? "Negociação atualizada." : "Negociação criada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar a negociação.");
    }
  }

  function editContact(contact: Record<string, unknown>) {
    const customFields = asRecord(contact.custom_fields);
    setEditingContactId(String(contact.id || ""));
    setContactDraft({
      name: String(contact.name || ""),
      role: String(contact.role || ""),
      department: String(customFields.department || ""),
      phone: String(contact.phone || ""),
      whatsapp: String(contact.whatsapp || ""),
      email: String(contact.email || ""),
      linkedinUrl: String(contact.linkedin_url || ""),
      contactType: String(customFields.contactType || "comercial"),
      influenceLevel: (String(customFields.influenceLevel || (contact.is_decision_maker ? "decisor" : "operacional")) as ContactDraft["influenceLevel"]),
      isPrimary: Boolean(customFields.isPrimary),
      isFinancial: Boolean(customFields.isFinancial),
      isTechnical: Boolean(customFields.isTechnical),
      notes: String(contact.notes || "")
    });
  }

  async function removeContact(contactId: string) {
    if (!lead?.id || !window.confirm("Excluir este contato?")) return;
    try {
      await deleteLeadContact(lead.id, contactId);
      setContacts((current) => current.filter((item) => item.id !== contactId));
      if (editingContactId === contactId) {
        setEditingContactId("");
        setContactDraft(emptyContact());
      }
      setMessage("Contato excluído.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível excluir o contato.");
    }
  }

  function editDeal(deal: Record<string, unknown>) {
    const catalog = asRecord(deal.catalog_items);
    const details = parseDealDetails(deal.description);
    setEditingDealId(String(deal.id || ""));
    setDealDraft({
      name: String(details.name || deal.item_name || catalog.name || ""),
      value: String(deal.total_price ?? deal.contracted_price ?? ""),
      itemName: String(deal.item_name || catalog.name || ""),
      status: String(deal.status || "negotiating"),
      temperature: String(details.temperature || "Morno"),
      probability: String(details.probability || "50"),
      origin: String(details.origin || "CRM"),
      expectedClose: String(details.expectedClose || deal.ended_at || "").slice(0, 10),
      lastContact: String(details.lastContact || "").slice(0, 10),
      lostReason: String(details.lostReason || ""),
      nextAction: String(details.nextAction || ""),
      proposalId: String(details.proposalId || ""),
      contractId: String(details.contractId || ""),
      responsible: String(details.responsible || ""),
      notes: String(deal.notes || "")
    });
  }

  function editActivity(activity: Record<string, unknown>) {
    const metadata = asRecord(activity.metadata);
    const sentAt = new Date(String(activity.sent_at || Date.now()));
    sentAt.setMinutes(sentAt.getMinutes() - sentAt.getTimezoneOffset());
    setEditingActivityId(String(activity.id || ""));
    setActivityDraft({
      type: String(activity.type || "note"),
      occurredAt: sentAt.toISOString().slice(0, 16),
      responsible: String(activity.sent_by || metadata.responsible || ""),
      channel: String(metadata.channel || "Manual"),
      summary: String(metadata.summary || activity.subject || ""),
      nextAction: String(metadata.nextAction || ""),
      nextActionAt: String(metadata.nextActionAt || "").slice(0, 16),
      status: String(metadata.status || activity.status || "concluido"),
      details: String(activity.body || ""),
      attachments: Array.isArray(metadata.attachments) ? metadata.attachments.map(String) : []
    });
  }

  async function removeActivity(activityId: string) {
    if (!lead?.id || !window.confirm("Excluir este registro do histórico?")) return;
    try {
      await deleteLeadActivity(lead.id, activityId);
      setActivities((current) => current.filter((item) => item.id !== activityId));
      if (editingActivityId === activityId) {
        setEditingActivityId("");
        setActivityDraft(emptyActivity());
      }
      setMessage("Registro excluído do histórico.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível excluir o registro.");
    }
  }

  async function removeDeal(dealId: string) {
    if (!lead?.id || !window.confirm("Excluir esta negociação?")) return;
    try {
      await deleteLeadDeal(lead.id, dealId);
      setDeals((current) => current.filter((item) => item.id !== dealId));
      if (editingDealId === dealId) {
        setEditingDealId("");
        setDealDraft(emptyDeal());
      }
      setMessage("Negociação excluída.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível excluir a negociação.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="ml-auto flex h-[100dvh] max-h-[100dvh] w-full max-w-5xl flex-col overflow-hidden border-l border-border-soft bg-bg-main shadow-modal lg:w-[72vw]">
        <header className="flex items-start justify-between gap-4 border-b border-border-soft bg-bg-card px-5 py-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-glow">{isNew ? "Novo Lead" : "Ficha comercial"}</p>
            <h2 className="mt-1 text-2xl font-black text-text-primary">{draft.name || "Lead sem nome"}</h2>
            <p className="mt-1 text-sm text-text-muted">{draft.city || "Cidade não informada"}{draft.state ? `/${draft.state}` : ""}</p>
          </div>
          <button onClick={onClose} className="rounded-lg border border-border-soft p-2 text-text-muted hover:bg-bg-hover hover:text-text-primary" aria-label="Fechar ficha">
            <X className="h-5 w-5" />
          </button>
        </header>

        <nav className="flex gap-2 overflow-x-auto border-b border-border-soft bg-bg-card px-4 py-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-button px-3 py-2 text-sm font-semibold transition ${activeTab === tab.id ? "bg-brand-primary text-white" : "border border-border-soft text-text-secondary hover:bg-bg-hover"}`}
              >
                <Icon className="h-4 w-4" /> {tab.label}
              </button>
            );
          })}
        </nav>

        <main className="min-h-0 flex-1 overflow-y-auto p-5">
          {activeTab === "overview" && (
            <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
              <section className="grid gap-4 md:grid-cols-2">
                <Input label="Nome da empresa" value={draft.name} onChange={(event) => setField("name", event.target.value)} required />
                <Input label="Razão social" value={draft.legalName} onChange={(event) => setField("legalName", event.target.value)} />
                <Input label="CNPJ" value={draft.cnpj} onChange={(event) => setField("cnpj", event.target.value)} />
                <Input label="Segmento" value={draft.category} onChange={(event) => setField("category", event.target.value)} />
                <Input label="Cidade" value={draft.city} onChange={(event) => setField("city", event.target.value)} />
                <Input label="UF" value={draft.state} onChange={(event) => setField("state", event.target.value)} />
                <Input label="Telefone" value={draft.phone} onChange={(event) => setField("phone", event.target.value)} icon={<Phone className="h-4 w-4" />} />
                <Input label="WhatsApp" value={draft.whatsapp} onChange={(event) => setField("whatsapp", event.target.value)} icon={<MessageCircle className="h-4 w-4" />} />
                <Input label="E-mail" value={draft.email} onChange={(event) => setField("email", event.target.value)} icon={<Mail className="h-4 w-4" />} />
                <Input label="Site" value={draft.website} onChange={(event) => setField("website", event.target.value)} />
                <label className="flex flex-col gap-1.5 md:col-span-2">
                  <span className="text-sm font-medium text-text-secondary">Endereço completo</span>
                  <input value={draft.address} onChange={(event) => setField("address", event.target.value)} className="h-10 rounded-input border border-border-default bg-bg-input px-3 text-sm text-text-primary outline-none focus:border-brand-primary" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-text-secondary">Etapa</span>
                  <select value={draft.status} onChange={(event) => setField("status", event.target.value)} className="h-10 rounded-input border border-border-default bg-bg-input px-3 text-sm text-text-primary outline-none focus:border-brand-primary">
                    {CRM_STAGES.map((stage) => <option key={stage.id} value={stage.id}>{stage.label}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-text-secondary">Temperatura</span>
                  <select value={draft.temperature} onChange={(event) => setField("temperature", event.target.value)} className="h-10 rounded-input border border-border-default bg-bg-input px-3 text-sm text-text-primary outline-none focus:border-brand-primary">
                    <option>Frio</option>
                    <option>Morno</option>
                    <option>Quente</option>
                  </select>
                </label>
                <div className="md:col-span-2">
                  <span className="mb-1.5 block text-sm font-medium text-text-secondary">Próxima ação / observações</span>
                  <RichTextEditor value={draft.notes} onChange={(notes) => setField("notes", notes)} minHeight={170} placeholder="Próxima ação, contexto e observações comerciais..." />
                </div>
              </section>
              <aside className="space-y-3 rounded-card border border-border-soft bg-bg-card p-4">
                <ScoreBadge score={lead?.score || 0} variant="digital" />
                <div className="rounded-lg border border-border-soft p-3">
                  <p className="text-xs text-text-muted">Valor em negociação</p>
                  <p className="mt-1 text-2xl font-black text-text-primary">{estimatedValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                </div>
                <StatusBadge value={draft.temperature} />
              </aside>
            </div>
          )}

          {activeTab === "history" && (
            <section className={`grid gap-5 ${canEdit ? "xl:grid-cols-[minmax(320px,0.9fr)_minmax(360px,1.1fr)]" : "grid-cols-1"}`}>
              <form onSubmit={registerActivity} className={`${canEdit && !relationErrors.history ? "" : "hidden "}space-y-4 rounded-card border border-border-soft bg-bg-card p-4`}>
                <div className="flex items-start justify-between gap-3">
                  <div><h3 className="font-bold text-text-primary">{editingActivityId ? "Editar histórico" : "Registrar atividade"}</h3>
                  <p className="mt-1 text-sm text-text-muted">Documente a interação e a próxima ação comercial.</p>
                  </div>
                  {editingActivityId && <Button type="button" size="sm" variant="ghost" onClick={() => { setEditingActivityId(""); setActivityDraft(emptyActivity()); }}>Cancelar</Button>}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-text-secondary">Tipo de interação</span>
                    <select value={activityDraft.type} onChange={(event) => setActivityDraft((current) => ({ ...current, type: event.target.value }))} className="h-10 rounded-input border border-border-default bg-bg-input px-3 text-sm text-text-primary">
                      {Object.entries(activityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                  <Input label="Data e hora" type="datetime-local" value={activityDraft.occurredAt} onChange={(event) => setActivityDraft((current) => ({ ...current, occurredAt: event.target.value }))} />
                  <Input label="Responsável pelo registro" value={activityDraft.responsible} onChange={(event) => setActivityDraft((current) => ({ ...current, responsible: event.target.value }))} placeholder="Nome do responsável" />
                  <Input label="Canal utilizado" value={activityDraft.channel} onChange={(event) => setActivityDraft((current) => ({ ...current, channel: event.target.value }))} placeholder="Telefone, WhatsApp, presencial..." />
                  <Input label="Resumo do contato" value={activityDraft.summary} onChange={(event) => setActivityDraft((current) => ({ ...current, summary: event.target.value }))} placeholder="Assunto principal" />
                  <Input label="Próxima ação" value={activityDraft.nextAction} onChange={(event) => setActivityDraft((current) => ({ ...current, nextAction: event.target.value }))} placeholder="Ex.: enviar proposta" />
                  <Input label="Data da próxima ação" type="datetime-local" value={activityDraft.nextActionAt} onChange={(event) => setActivityDraft((current) => ({ ...current, nextActionAt: event.target.value }))} />
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-text-secondary">Status</span>
                    <select value={activityDraft.status} onChange={(event) => setActivityDraft((current) => ({ ...current, status: event.target.value }))} className="h-10 rounded-input border border-border-default bg-bg-input px-3 text-sm text-text-primary">
                      <option value="pendente">Pendente</option><option value="concluido">Concluído</option><option value="aguardando">Aguardando retorno</option><option value="cancelado">Cancelado</option>
                    </select>
                  </label>
                  <Input label="Anexos (URLs separadas por vírgula)" value={activityDraft.attachments.join(", ")} onChange={(event) => setActivityDraft((current) => ({ ...current, attachments: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) }))} placeholder="https://..." />
                </div>
                <div>
                  <span className="mb-1.5 block text-sm font-medium text-text-secondary">Observações detalhadas</span>
                  <RichTextEditor value={activityDraft.details} onChange={(details) => setActivityDraft((current) => ({ ...current, details }))} minHeight={170} placeholder="Registre o que aconteceu, objeções, decisões e contexto..." />
                </div>
                <Button type="submit" icon={<Save className="h-4 w-4" />}>{editingActivityId ? "Salvar alterações" : "Salvar no histórico"}</Button>
              </form>
              <div className="space-y-3">
                {relationErrors.history && <p role="alert" className="rounded-card border border-[var(--warning)]/40 bg-[var(--warning)]/10 p-4 text-sm text-text-primary">{relationErrors.history}</p>}
                <div>
                  <h3 className="font-bold text-text-primary">Histórico da empresa</h3>
                  <p className="mt-1 text-sm text-text-muted">Registros em ordem cronológica, do mais recente para o mais antigo.</p>
                </div>
                <div className="grid gap-2 rounded-card border border-border-soft bg-bg-card p-3 sm:grid-cols-2 xl:grid-cols-4">
                  <select aria-label="Filtrar histórico por tipo" value={activityFilter.type} onChange={(event) => setActivityFilter((current) => ({ ...current, type: event.target.value }))} className="h-10 rounded-input border border-border-default bg-bg-input px-3 text-sm text-text-primary"><option value="">Todos os tipos</option>{Object.entries(activityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
                  <input aria-label="Filtrar histórico por responsável" value={activityFilter.responsible} onChange={(event) => setActivityFilter((current) => ({ ...current, responsible: event.target.value }))} className="h-10 rounded-input border border-border-default bg-bg-input px-3 text-sm text-text-primary" placeholder="Responsável" />
                  <select aria-label="Filtrar histórico por status" value={activityFilter.status} onChange={(event) => setActivityFilter((current) => ({ ...current, status: event.target.value }))} className="h-10 rounded-input border border-border-default bg-bg-input px-3 text-sm text-text-primary"><option value="">Todos os status</option><option value="pendente">Pendente</option><option value="concluido">Concluído</option><option value="aguardando">Aguardando</option><option value="cancelado">Cancelado</option></select>
                  <input aria-label="Filtrar histórico por data" type="date" value={activityFilter.date} onChange={(event) => setActivityFilter((current) => ({ ...current, date: event.target.value }))} className="h-10 rounded-input border border-border-default bg-bg-input px-3 text-sm text-text-primary" />
                </div>
                {filteredActivities.length === 0 && <p className="rounded-card border border-border-soft bg-bg-card p-4 text-sm text-text-muted">Nenhuma atividade encontrada.</p>}
                {whatsappTimeline.length > 0 && (
                  <div className="rounded-card border border-brand-primary/25 bg-brand-primary/5 p-4">
                    <p className="font-bold text-text-primary">Timeline WhatsApp</p>
                    <p className="mt-1 text-sm text-text-muted">Mensagens enviadas e recebidas vinculadas a este lead.</p>
                    <div className="mt-3 space-y-2">
                      {whatsappTimeline.map((item) => (
                        <article key={item.id} className="rounded-lg border border-border-soft bg-bg-card px-3 py-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <Badge variant={item.direction === "inbound" ? "warning" : "success"}>{item.direction === "inbound" ? "Recebida" : item.direction === "outbound" ? "Enviada" : "Manual"}</Badge>
                            <span className="text-xs text-text-muted">{item.sent_at ? new Date(item.sent_at).toLocaleString("pt-BR") : "sem data"}</span>
                          </div>
                          <div className="mt-2 text-sm text-text-secondary">
                            <RichTextPreview value={item.body || "Sem conteúdo."} />
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )}
                {filteredActivities.map((activity, index) => {
                  const metadata = asRecord(activity.metadata);
                  return (
                    <article key={String(activity.id || index)} className="rounded-card border border-border-soft bg-bg-card p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-text-primary">{activityLabels[String(activity.type || "")] || String(activity.subject || activity.title || "Atividade")}</p>
                          <p className="mt-1 text-xs text-text-muted">{new Date(String(activity.sent_at || activity.createdAt || Date.now())).toLocaleString("pt-BR")}{String(activity.sent_by || metadata.responsible || "") ? ` · ${String(activity.sent_by || metadata.responsible)}` : ""}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="info">{String(metadata.status || activity.status || "concluido")}</Badge>
                          {canEdit && <><button type="button" onClick={() => editActivity(activity)} className="rounded-md border border-border-soft p-2 text-text-muted hover:text-brand-glow" aria-label="Editar histórico"><Pencil className="h-4 w-4" /></button>
                          <button type="button" onClick={() => void removeActivity(String(activity.id))} className="rounded-md border border-border-soft p-2 text-text-muted hover:text-red-400" aria-label="Excluir histórico"><Trash2 className="h-4 w-4" /></button></>}
                        </div>
                      </div>
                      {String(activity.body || activity.content || "") && <div className="mt-3"><RichTextPreview value={String(activity.body || activity.content || "")} /></div>}
                      {String(metadata.nextAction || "") && <p className="mt-3 rounded-lg border border-brand-primary/25 bg-brand-primary/5 px-3 py-2 text-sm text-text-secondary"><strong className="text-text-primary">Próxima ação:</strong> {String(metadata.nextAction)}</p>}
                      {Array.isArray(metadata.attachments) && metadata.attachments.some(safeExternalUrl) && <div className="mt-3 flex flex-wrap gap-2">{metadata.attachments.map(safeExternalUrl).filter(Boolean).map((href, itemIndex) => <a key={`${href}-${itemIndex}`} href={href} target="_blank" rel="noreferrer" className="text-xs font-semibold text-brand-glow underline">Anexo {itemIndex + 1}</a>)}</div>}
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {activeTab === "contacts" && (
            <section className={`grid gap-5 ${canEdit ? "xl:grid-cols-[minmax(320px,0.9fr)_minmax(360px,1.1fr)]" : "grid-cols-1"}`}>
              <form onSubmit={registerContact} className={`${canEdit && !relationErrors.contacts ? "" : "hidden "}space-y-4 rounded-card border border-border-soft bg-bg-card p-4`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-text-primary">{editingContactId ? "Editar contato" : "Adicionar novo contato"}</h3>
                    <p className="mt-1 text-sm text-text-muted">Centralize os dados das pessoas envolvidas na decisão.</p>
                  </div>
                  {editingContactId && <Button type="button" size="sm" variant="ghost" onClick={() => { setEditingContactId(""); setContactDraft(emptyContact()); }}>Cancelar</Button>}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input label="Nome do contato" required value={contactDraft.name} onChange={(event) => setContactDraft((current) => ({ ...current, name: event.target.value }))} />
                  <Input label="Cargo/função" value={contactDraft.role} onChange={(event) => setContactDraft((current) => ({ ...current, role: event.target.value }))} />
                  <Input label="Departamento" value={contactDraft.department} onChange={(event) => setContactDraft((current) => ({ ...current, department: event.target.value }))} />
                  <label className="flex flex-col gap-1.5"><span className="text-sm font-medium text-text-secondary">Tipo de contato</span><select value={contactDraft.contactType} onChange={(event) => setContactDraft((current) => ({ ...current, contactType: event.target.value }))} className="h-10 rounded-input border border-border-default bg-bg-input px-3 text-sm text-text-primary"><option value="comercial">Comercial</option><option value="financeiro">Financeiro</option><option value="tecnico">Técnico</option><option value="diretoria">Diretoria</option><option value="operacional">Operacional</option></select></label>
                  <Input label="Telefone" value={contactDraft.phone} onChange={(event) => setContactDraft((current) => ({ ...current, phone: event.target.value }))} icon={<Phone className="h-4 w-4" />} />
                  <Input label="WhatsApp" value={contactDraft.whatsapp} onChange={(event) => setContactDraft((current) => ({ ...current, whatsapp: event.target.value }))} icon={<MessageCircle className="h-4 w-4" />} />
                  <Input label="E-mail" type="email" value={contactDraft.email} onChange={(event) => setContactDraft((current) => ({ ...current, email: event.target.value }))} icon={<Mail className="h-4 w-4" />} />
                  <Input label="LinkedIn" type="url" value={contactDraft.linkedinUrl} onChange={(event) => setContactDraft((current) => ({ ...current, linkedinUrl: event.target.value }))} placeholder="https://linkedin.com/in/..." />
                  <label className="flex flex-col gap-1.5 sm:col-span-2">
                    <span className="text-sm font-medium text-text-secondary">Nível de influência</span>
                    <select value={contactDraft.influenceLevel} onChange={(event) => setContactDraft((current) => ({ ...current, influenceLevel: event.target.value as ContactDraft["influenceLevel"] }))} className="h-10 rounded-input border border-border-default bg-bg-input px-3 text-sm text-text-primary">
                      <option value="decisor">Decisor</option>
                      <option value="influenciador">Influenciador</option>
                      <option value="operacional">Operacional</option>
                    </select>
                  </label>
                  <div className="grid gap-2 sm:col-span-2 sm:grid-cols-3">
                    <label className="flex items-center gap-2 rounded-lg border border-border-soft bg-bg-input px-3 py-2 text-sm text-text-secondary"><input type="checkbox" checked={contactDraft.isPrimary} onChange={(event) => setContactDraft((current) => ({ ...current, isPrimary: event.target.checked }))} />Contato principal</label>
                    <label className="flex items-center gap-2 rounded-lg border border-border-soft bg-bg-input px-3 py-2 text-sm text-text-secondary"><input type="checkbox" checked={contactDraft.isFinancial} onChange={(event) => setContactDraft((current) => ({ ...current, isFinancial: event.target.checked }))} />Responsável financeiro</label>
                    <label className="flex items-center gap-2 rounded-lg border border-border-soft bg-bg-input px-3 py-2 text-sm text-text-secondary"><input type="checkbox" checked={contactDraft.isTechnical} onChange={(event) => setContactDraft((current) => ({ ...current, isTechnical: event.target.checked }))} />Responsável técnico</label>
                  </div>
                </div>
                <div>
                  <span className="mb-1.5 block text-sm font-medium text-text-secondary">Observações</span>
                  <RichTextEditor value={contactDraft.notes} onChange={(notes) => setContactDraft((current) => ({ ...current, notes }))} minHeight={150} placeholder="Preferências, influência, abordagem e contexto..." />
                </div>
                <Button type="submit" icon={editingContactId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}>{editingContactId ? "Salvar alterações" : "Adicionar contato"}</Button>
              </form>
              <div className="space-y-3">
                {relationErrors.contacts && <p role="alert" className="rounded-card border border-[var(--warning)]/40 bg-[var(--warning)]/10 p-4 text-sm text-text-primary">{relationErrors.contacts}</p>}
                <div>
                  <h3 className="font-bold text-text-primary">Contatos cadastrados</h3>
                  <p className="mt-1 text-sm text-text-muted">Decisores, influenciadores e pessoas da operação.</p>
                </div>
                {contacts.length === 0 && <p className="rounded-card border border-border-soft bg-bg-card p-4 text-sm text-text-muted">Nenhum contato cadastrado.</p>}
                {contacts.map((contact, index) => {
                  const customFields = asRecord(contact.custom_fields);
                  const influence = String(customFields.influenceLevel || (contact.is_decision_maker ? "decisor" : "operacional"));
                  return (
                    <article key={String(contact.id || index)} className="rounded-card border border-border-soft bg-bg-card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-text-primary">{String(contact.name || "Contato")}</p>
                          <p className="mt-1 text-sm text-text-muted">{String(contact.role || "Cargo não informado")}</p>
                        </div>
                        {canEdit && <div className="flex gap-1">
                          <button type="button" onClick={() => editContact(contact)} className="rounded-lg p-2 text-text-muted hover:bg-bg-hover hover:text-text-primary" title="Editar contato"><Pencil className="h-4 w-4" /></button>
                          <button type="button" onClick={() => void removeContact(String(contact.id))} className="rounded-lg p-2 text-text-muted hover:bg-[var(--danger)]/10 hover:text-[var(--danger)]" title="Excluir contato"><Trash2 className="h-4 w-4" /></button>
                        </div>}
                      </div>
                      <Badge className="mt-3" variant={influence === "decisor" ? "success" : influence === "influenciador" ? "warning" : "default"}>{influence.charAt(0).toUpperCase() + influence.slice(1)}</Badge>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {Boolean(customFields.isPrimary) && <Badge variant="success">Contato principal</Badge>}
                        {Boolean(customFields.isFinancial) && <Badge variant="default">Financeiro</Badge>}
                        {Boolean(customFields.isTechnical) && <Badge variant="default">Técnico</Badge>}
                        {Boolean(customFields.department) && <Badge variant="default">{String(customFields.department)}</Badge>}
                      </div>
                      <div className="mt-3 grid gap-1 text-sm text-text-secondary sm:grid-cols-2">
                        {Boolean(contact.phone) && <span>Telefone: {String(contact.phone)}</span>}
                        {Boolean(contact.whatsapp) && <span>WhatsApp: {String(contact.whatsapp)}</span>}
                        {Boolean(contact.email) && <span>E-mail: {String(contact.email)}</span>}
                        {Boolean(contact.linkedin_url) && <a href={String(contact.linkedin_url)} target="_blank" rel="noreferrer" className="text-brand-primary hover:underline">LinkedIn</a>}
                      </div>
                      {String(contact.notes || "") && <div className="mt-3"><RichTextPreview value={String(contact.notes)} /></div>}
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {activeTab === "deals" && (
            <section className={`grid gap-5 ${canEdit ? "xl:grid-cols-[minmax(320px,0.9fr)_minmax(360px,1.1fr)]" : "grid-cols-1"}`}>
              <form onSubmit={registerDeal} className={`${canEdit && !relationErrors.deals ? "" : "hidden "}space-y-4 rounded-card border border-border-soft bg-bg-card p-4`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-text-primary">{editingDealId ? "Editar negociação" : "Criar nova negociação"}</h3>
                    <p className="mt-1 text-sm text-text-muted">Acompanhe valor, avanço e previsão de fechamento.</p>
                  </div>
                  {editingDealId && <Button type="button" size="sm" variant="ghost" onClick={() => { setEditingDealId(""); setDealDraft(emptyDeal()); }}>Cancelar</Button>}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input label="Nome da negociação" required value={dealDraft.name} onChange={(event) => setDealDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Ex.: Implantação CRM 2026" />
                  <Input label="Valor da negociação" inputMode="decimal" value={dealDraft.value} onChange={(event) => setDealDraft((current) => ({ ...current, value: event.target.value }))} placeholder="0,00" />
                  <Input label="Produto/serviço de interesse" required value={dealDraft.itemName} onChange={(event) => setDealDraft((current) => ({ ...current, itemName: event.target.value }))} />
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-text-secondary">Etapa da negociação</span>
                    <select value={dealDraft.status} onChange={(event) => setDealDraft((current) => ({ ...current, status: event.target.value }))} className="h-10 rounded-input border border-border-default bg-bg-input px-3 text-sm text-text-primary">
                      {Object.entries(dealStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5"><span className="text-sm font-medium text-text-secondary">Temperatura</span><select value={dealDraft.temperature} onChange={(event) => setDealDraft((current) => ({ ...current, temperature: event.target.value }))} className="h-10 rounded-input border border-border-default bg-bg-input px-3 text-sm text-text-primary"><option>Frio</option><option>Morno</option><option>Quente</option></select></label>
                  <Input label="Probabilidade de fechamento (%)" type="number" min={0} max={100} value={dealDraft.probability} onChange={(event) => setDealDraft((current) => ({ ...current, probability: event.target.value }))} />
                  <Input label="Origem da oportunidade" value={dealDraft.origin} onChange={(event) => setDealDraft((current) => ({ ...current, origin: event.target.value }))} />
                  <Input label="Data prevista de fechamento" type="date" value={dealDraft.expectedClose} onChange={(event) => setDealDraft((current) => ({ ...current, expectedClose: event.target.value }))} />
                  <Input label="Último contato" type="date" value={dealDraft.lastContact} onChange={(event) => setDealDraft((current) => ({ ...current, lastContact: event.target.value }))} />
                  <Input label="Responsável" value={dealDraft.responsible} onChange={(event) => setDealDraft((current) => ({ ...current, responsible: event.target.value }))} />
                  <Input label="Motivo de perda" value={dealDraft.lostReason} onChange={(event) => setDealDraft((current) => ({ ...current, lostReason: event.target.value }))} disabled={dealDraft.status !== "lost"} placeholder={dealDraft.status === "lost" ? "Informe o motivo" : "Disponível na etapa Perdida"} />
                  <Input label="Próxima ação comercial" value={dealDraft.nextAction} onChange={(event) => setDealDraft((current) => ({ ...current, nextAction: event.target.value }))} className="sm:col-span-2" />
                  <Input label="Proposta vinculada" value={dealDraft.proposalId} onChange={(event) => setDealDraft((current) => ({ ...current, proposalId: event.target.value }))} placeholder="ID ou referência da proposta" />
                  <Input label="Contrato vinculado" value={dealDraft.contractId} onChange={(event) => setDealDraft((current) => ({ ...current, contractId: event.target.value }))} placeholder="ID ou referência do contrato" />
                </div>
                <div>
                  <span className="mb-1.5 block text-sm font-medium text-text-secondary">Observações</span>
                  <RichTextEditor value={dealDraft.notes} onChange={(notes) => setDealDraft((current) => ({ ...current, notes }))} minHeight={160} placeholder="Objeções, condições, envolvidos e próximos passos..." />
                </div>
                <Button type="submit" icon={editingDealId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}>{editingDealId ? "Salvar negociação" : "Criar nova negociação"}</Button>
              </form>
              <div className="space-y-3">
                {relationErrors.deals && <p role="alert" className="rounded-card border border-[var(--warning)]/40 bg-[var(--warning)]/10 p-4 text-sm text-text-primary">{relationErrors.deals}</p>}
                <div>
                  <h3 className="font-bold text-text-primary">Negociações da empresa</h3>
                  <p className="mt-1 text-sm text-text-muted">Valores e oportunidades comerciais em acompanhamento.</p>
                </div>
                <div className="grid gap-2 rounded-card border border-border-soft bg-bg-card p-3 sm:grid-cols-2 xl:grid-cols-3">
                  <select aria-label="Filtrar negociação por etapa" value={dealFilter.status} onChange={(event) => setDealFilter((current) => ({ ...current, status: event.target.value }))} className="h-10 rounded-input border border-border-default bg-bg-input px-3 text-sm text-text-primary"><option value="">Todas as etapas</option>{Object.entries(dealStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
                  <select aria-label="Filtrar negociação por temperatura" value={dealFilter.temperature} onChange={(event) => setDealFilter((current) => ({ ...current, temperature: event.target.value }))} className="h-10 rounded-input border border-border-default bg-bg-input px-3 text-sm text-text-primary"><option value="">Todas as temperaturas</option><option>Frio</option><option>Morno</option><option>Quente</option></select>
                  <input aria-label="Filtrar negociação por responsável" value={dealFilter.responsible} onChange={(event) => setDealFilter((current) => ({ ...current, responsible: event.target.value }))} className="h-10 rounded-input border border-border-default bg-bg-input px-3 text-sm text-text-primary" placeholder="Responsável" />
                  <input aria-label="Valor mínimo" type="number" min="0" value={dealFilter.minValue} onChange={(event) => setDealFilter((current) => ({ ...current, minValue: event.target.value }))} className="h-10 rounded-input border border-border-default bg-bg-input px-3 text-sm text-text-primary" placeholder="Valor mínimo" />
                  <input aria-label="Data prevista" type="date" value={dealFilter.date} onChange={(event) => setDealFilter((current) => ({ ...current, date: event.target.value }))} className="h-10 rounded-input border border-border-default bg-bg-input px-3 text-sm text-text-primary" />
                </div>
                {filteredDeals.length === 0 && <p className="rounded-card border border-border-soft bg-bg-card p-4 text-sm text-text-muted">Nenhuma negociação encontrada.</p>}
                {filteredDeals.map((deal, index) => {
                  const catalog = asRecord(deal.catalog_items);
                  const details = parseDealDetails(deal.description);
                  return (
                    <article key={String(deal.id || index)} className="rounded-card border border-border-soft bg-bg-card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-text-primary">{String(details.name || deal.item_name || catalog.name || "Negociação")}</p>
                          <p className="mt-1 text-sm text-text-muted">{String(deal.item_name || catalog.name || "Produto/serviço não informado")}</p>
                          <p className="mt-1 text-xl font-black text-brand-primary">{Number(deal.total_price ?? deal.contracted_price ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                        </div>
                        {canEdit && <div className="flex gap-1">
                          <button type="button" onClick={() => editDeal(deal)} className="rounded-lg p-2 text-text-muted hover:bg-bg-hover hover:text-text-primary" title="Editar negociação"><Pencil className="h-4 w-4" /></button>
                          <button type="button" onClick={() => void removeDeal(String(deal.id))} className="rounded-lg p-2 text-text-muted hover:bg-[var(--danger)]/10 hover:text-[var(--danger)]" title="Excluir negociação"><Trash2 className="h-4 w-4" /></button>
                        </div>}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant={String(deal.status) === "won" ? "success" : String(deal.status) === "lost" ? "danger" : "info"}>{dealStatusLabels[String(deal.status)] || String(deal.status || "Em negociação")}</Badge>
                        {Boolean(details.temperature) && <StatusBadge value={String(details.temperature)} />}
                        {Boolean(details.probability) && <Badge variant="default">{String(details.probability)}%</Badge>}
                        {Boolean(deal.ended_at) && <Badge variant="default">Previsão: {new Date(`${String(deal.ended_at).slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR")}</Badge>}
                      </div>
                      {Boolean(details.nextAction) && <p className="mt-3 text-sm text-text-secondary"><strong className="text-text-primary">Próxima ação:</strong> {String(details.nextAction)}</p>}
                      {Boolean(details.responsible) && <p className="mt-1 text-xs text-text-muted">Responsável: {String(details.responsible)}</p>}
                      {String(deal.notes || "") && <div className="mt-3"><RichTextPreview value={String(deal.notes)} /></div>}
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {activeTab === "ai" && (
            <section className="grid gap-4 md:grid-cols-2">
              {["Diagnóstico digital", "Mensagem de WhatsApp", "Roteiro de ligação", "Resumo para proposta"].map((item) => (
                <div key={item} className="rounded-card border border-[var(--ai-border)] bg-[var(--ai-bg)] p-4">
                  <p className="font-bold text-[var(--ai-text)]">{item}</p>
                  <p className="mt-2 text-sm text-text-secondary">Configure a IA nas Integrações para ativar este recurso.</p>
                  <Button className="mt-4" variant="ai">Gerar</Button>
                </div>
              ))}
            </section>
          )}
        </main>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border-soft bg-bg-card px-5 py-4">
          <p className="text-sm text-text-muted">{message}</p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            {canEdit && <Button onClick={() => void saveLead()} loading={saving}>{isNew ? "Salvar lead" : "Criar cópia/atualizar"}</Button>}
          </div>
        </footer>
      </div>
    </div>
  );
}
