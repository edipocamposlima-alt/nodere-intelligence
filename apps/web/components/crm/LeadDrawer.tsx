"use client";

import { useEffect, useMemo, useState } from "react";
import { Brain, Building2, CalendarDays, Mail, MessageCircle, Phone, Plus, Save, Users, X } from "lucide-react";
import type { Company } from "@/lib/types";
import { CRM_STAGES } from "@/lib/crm-stages";
import { addLeadActivity, addLeadContact, addLeadDeal, createLead, getLeadActivities, getLeadContacts, getLeadDeals } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { ScoreBadge } from "@/components/ui/ScoreBadge";

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
  const isNew = !lead?.id;

  useEffect(() => {
    if (!open) return;
    setActiveTab("overview");
    setDraft(draftFromLead(lead));
    setMessage("");
  }, [lead, open]);

  useEffect(() => {
    if (!open || !lead?.id) return;
    getLeadActivities(lead.id).then(setActivities).catch(() => setActivities([]));
    getLeadContacts(lead.id).then(setContacts).catch(() => setContacts([]));
    getLeadDeals(lead.id).then(setDeals).catch(() => setDeals([]));
  }, [lead?.id, open]);

  const estimatedValue = useMemo(() => deals.reduce((sum, deal) => {
    const value = Number(deal.total_price ?? deal.contracted_price ?? 0);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0), [deals]);

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

  async function registerActivity(type: string) {
    if (!lead?.id) {
      setMessage("Salve o lead antes de registrar histórico.");
      return;
    }
    const content = window.prompt("Descreva a atividade:");
    if (!content?.trim()) return;
    const activity = await addLeadActivity(lead.id, { type, body: content, title: type });
    setActivities((current) => [activity, ...current]);
  }

  async function registerContact() {
    if (!lead?.id) {
      setMessage("Salve o lead antes de adicionar contatos.");
      return;
    }
    const name = window.prompt("Nome do contato/decisor:");
    if (!name?.trim()) return;
    const role = window.prompt("Cargo/função:") || "";
    const contact = await addLeadContact(lead.id, { name, role });
    setContacts((current) => [contact, ...current]);
  }

  async function registerDeal() {
    if (!lead?.id) {
      setMessage("Salve o lead antes de registrar negociações.");
      return;
    }
    const itemName = window.prompt("Serviço/produto negociado:");
    if (!itemName?.trim()) return;
    const value = Number(window.prompt("Valor total estimado:", "0") || 0);
    const deal = await addLeadDeal(lead.id, { itemName, totalPrice: value, unitPrice: value, status: "negotiating" });
    setDeals((current) => [deal, ...current]);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="ml-auto flex h-full w-full max-w-5xl flex-col overflow-hidden border-l border-border-soft bg-bg-main shadow-modal lg:w-[72vw]">
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
                <label className="flex flex-col gap-1.5 md:col-span-2">
                  <span className="text-sm font-medium text-text-secondary">Próxima ação / observações</span>
                  <textarea value={draft.notes} onChange={(event) => setField("notes", event.target.value)} rows={5} className="rounded-input border border-border-default bg-bg-input px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-primary" />
                </label>
              </section>
              <aside className="space-y-3 rounded-card border border-border-soft bg-bg-card p-4">
                <ScoreBadge score={lead?.score || 0} variant="digital" />
                <div className="rounded-lg border border-border-soft p-3">
                  <p className="text-xs text-text-muted">Valor em negociação</p>
                  <p className="mt-1 text-2xl font-black text-text-primary">{estimatedValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                </div>
                <Badge variant={draft.temperature === "Quente" ? "danger" : draft.temperature === "Morno" ? "warning" : "info"}>{draft.temperature}</Badge>
              </aside>
            </div>
          )}

          {activeTab === "history" && (
            <section className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {["note", "call", "whatsapp", "email", "meeting"].map((type) => <Button key={type} variant="secondary" onClick={() => void registerActivity(type)}>{type}</Button>)}
              </div>
              {activities.length === 0 && <p className="rounded-card border border-border-soft bg-bg-card p-4 text-sm text-text-muted">Nenhuma atividade registrada.</p>}
              {activities.map((activity, index) => (
                <div key={String(activity.id || index)} className="rounded-card border border-border-soft bg-bg-card p-4">
                  <p className="text-sm font-bold text-text-primary">{String(activity.title || activity.type || "Atividade")}</p>
                  <p className="mt-1 text-sm text-text-secondary">{String(activity.body || activity.content || activity.subject || "")}</p>
                </div>
              ))}
            </section>
          )}

          {activeTab === "contacts" && (
            <section className="space-y-4">
              <Button onClick={() => void registerContact()} icon={<Plus className="h-4 w-4" />}>Adicionar contato</Button>
              {contacts.length === 0 && <p className="rounded-card border border-border-soft bg-bg-card p-4 text-sm text-text-muted">Nenhum decisor cadastrado.</p>}
              {contacts.map((contact, index) => (
                <div key={String(contact.id || index)} className="rounded-card border border-border-soft bg-bg-card p-4">
                  <p className="font-bold text-text-primary">{String(contact.name || "Contato")}</p>
                  <p className="text-sm text-text-muted">{String(contact.role || contact.email || contact.phone || "")}</p>
                </div>
              ))}
            </section>
          )}

          {activeTab === "deals" && (
            <section className="space-y-4">
              <Button onClick={() => void registerDeal()} icon={<Plus className="h-4 w-4" />}>Registrar negociação</Button>
              {deals.length === 0 && <p className="rounded-card border border-border-soft bg-bg-card p-4 text-sm text-text-muted">Nenhuma negociação registrada.</p>}
              {deals.map((deal, index) => {
                const catalog = typeof deal.catalog_items === "object" && deal.catalog_items !== null ? deal.catalog_items as Record<string, unknown> : {};
                return (
                  <div key={String(deal.id || index)} className="rounded-card border border-border-soft bg-bg-card p-4">
                    <p className="font-bold text-text-primary">{String(deal.item_name || catalog.name || "Item negociado")}</p>
                    <p className="text-sm text-text-muted">{Number(deal.total_price ?? deal.contracted_price ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} · {String(deal.status || "negotiating")}</p>
                  </div>
                );
              })}
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

        <footer className="flex items-center justify-between border-t border-border-soft bg-bg-card px-5 py-4">
          <p className="text-sm text-text-muted">{message}</p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button onClick={() => void saveLead()} loading={saving}>{isNew ? "Salvar lead" : "Criar cópia/atualizar"}</Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
