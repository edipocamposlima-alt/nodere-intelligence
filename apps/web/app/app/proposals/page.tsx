"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, FileText, RefreshCw, Save } from "lucide-react";
import { RichTextEditor } from "@/components/RichTextEditor";
import {
  CatalogItem,
  createProposal,
  downloadContractPdf,
  downloadProposalPdf,
  getCatalogItems,
  getCompanies,
  getProposalTemplates,
  getProposals,
  NodereProposal,
  ProposalItemPayload
} from "@/lib/api";
import type { Company } from "@/lib/types";

type SelectedItemState = {
  quantity: number;
  applied_price: number;
  discount_type: "none" | "percent" | "amount";
  discount_percent: number;
  discount_amount: number;
  discount_reason: string;
  customer_item_note: string;
  internal_item_note: string;
};

type ProposalTemplate = {
  id: string;
  name: string;
  service_type: string;
  content: string;
  variables?: string[];
};

function money(value: number) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function slug(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function unitLabel(value?: string | null) {
  const labels: Record<string, string> = {
    unit: "Unidade",
    hour: "Hora",
    monthly: "Mensalidade",
    package: "Pacote",
    project: "Projeto",
    daily: "Diária",
    other: "Outro"
  };
  return labels[String(value || "")] || value || "Unidade";
}

function catalogPrice(item: CatalogItem) {
  return Number(item.promotional_price ?? item.price ?? 0);
}

function defaultSelection(): SelectedItemState {
  return {
    quantity: 1,
    applied_price: 0,
    discount_type: "none",
    discount_percent: 0,
    discount_amount: 0,
    discount_reason: "",
    customer_item_note: "",
    internal_item_note: ""
  };
}

function plainText(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function templateDraft(template: ProposalTemplate, company?: Company) {
  const variables: Record<string, string> = {
    company: company?.name || "empresa selecionada",
    city: company?.city || "cidade não informada",
    segment: company?.category || "segmento não informado",
    score: String(company?.nodereScore ?? company?.score ?? "não calculado"),
    phone: company?.phone || "não informado",
    website: company?.website || "não informado",
    google_rating: String(company?.rating ?? "não informada")
  };
  return Object.entries(variables).reduce(
    (content, [key, value]) => content.replace(new RegExp(`{{\\s*${key}\\s*}}`, "gi"), value),
    template.content
  );
}

export default function AppProposalsPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [templates, setTemplates] = useState<ProposalTemplate[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<string, SelectedItemState>>({});
  const [proposals, setProposals] = useState<NodereProposal[]>([]);
  const [message, setMessage] = useState("Carregando propostas...");
  const [loading, setLoading] = useState(false);
  const [leadId, setLeadId] = useState("");
  const [documentType, setDocumentType] = useState<"proposal" | "contract">("proposal");
  const [title, setTitle] = useState("Proposta comercial NODERE");
  const [serviceType, setServiceType] = useState("Google Ads + CRM");
  const [customerNotes, setCustomerNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [documentGroupId, setDocumentGroupId] = useState("");
  const [changeReason, setChangeReason] = useState("");

  const selectedCompany = companies.find((item) => item.id === leadId);
  const activeCatalogItems = useMemo(() => catalogItems.filter((item) => item.status === "active"), [catalogItems]);
  const selectedRows = useMemo(() => {
    return activeCatalogItems
      .filter((item) => selectedItems[item.id])
      .map((item) => ({ catalog: item, selection: selectedItems[item.id] }));
  }, [activeCatalogItems, selectedItems]);

  const totals = useMemo(() => {
    return selectedRows.reduce(
      (acc, row) => {
        const appliedPrice = Number(row.selection.applied_price || catalogPrice(row.catalog));
        const gross = appliedPrice * Number(row.selection.quantity || 0);
        const discount = row.selection.discount_type === "percent"
          ? gross * (Number(row.selection.discount_percent || 0) / 100)
          : row.selection.discount_type === "amount"
            ? Number(row.selection.discount_amount || 0)
            : 0;
        acc.subtotal += gross;
        acc.discount += Math.min(discount, gross);
        acc.total += Math.max(0, gross - Math.min(discount, gross));
        acc.cost += Number(row.catalog.cost || 0) * Number(row.selection.quantity || 0);
        return acc;
      },
      { subtotal: 0, discount: 0, total: 0, cost: 0 }
    );
  }, [selectedRows]);

  const grossMargin = totals.total > 0 ? ((totals.total - totals.cost) / totals.total) * 100 : 0;

  async function loadData() {
    setLoading(true);
    try {
      const [companyRows, proposalRows, catalogRows, templateRows] = await Promise.all([getCompanies(), getProposals(), getCatalogItems(), getProposalTemplates()]);
      const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
      const requestedLeadId = params.get("lead_id") || "";
      const requestedType = params.get("type");
      setCompanies(companyRows);
      setProposals(proposalRows);
      setCatalogItems(catalogRows);
      setTemplates(templateRows);
      setLeadId((current) => current || (requestedLeadId && companyRows.some((company) => company.id === requestedLeadId) ? requestedLeadId : companyRows[0]?.id || ""));
      if (requestedType === "contract" || requestedType === "proposal") setDocumentType(requestedType);
      setMessage(proposalRows.length ? "Propostas carregadas." : "Nenhuma proposta persistente criada ainda.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível carregar propostas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function toggleItem(itemId: string, checked: boolean) {
    setSelectedItems((current) => {
      if (!checked) {
        const next = { ...current };
        delete next[itemId];
        return next;
      }
      const catalog = activeCatalogItems.find((item) => item.id === itemId);
      return { ...current, [itemId]: current[itemId] || { ...defaultSelection(), applied_price: catalog ? catalogPrice(catalog) : 0 } };
    });
  }

  function updateItem(itemId: string, patch: Partial<SelectedItemState>) {
    setSelectedItems((current) => ({
      ...current,
      [itemId]: { ...(current[itemId] || defaultSelection()), ...patch }
    }));
  }

  function validateSelection() {
    if (!leadId) return "Selecione um lead/empresa antes de salvar a proposta.";
    if (title.trim().length < 2) return "Informe um título válido para o documento.";
    if (!selectedRows.length) return "Selecione pelo menos um produto/serviço ativo do catálogo.";
    if (validUntil && validUntil < new Date().toISOString().slice(0, 10)) return "A validade não pode estar no passado.";
    if (documentGroupId && !changeReason.trim()) return "Informe o motivo da nova versão para preservar a rastreabilidade.";
    for (const row of selectedRows) {
      const appliedPrice = Number(row.selection.applied_price || catalogPrice(row.catalog));
      const gross = appliedPrice * Number(row.selection.quantity || 0);
      if (appliedPrice < 0) return `Informe valor aplicado válido para ${row.catalog.name}.`;
      if (Number(row.selection.quantity || 0) <= 0) return `Informe quantidade válida para ${row.catalog.name}.`;
      if (row.selection.discount_type === "percent" && Number(row.selection.discount_amount || 0) > 0) return "Use desconto por percentual OU por valor.";
      if (row.selection.discount_type === "amount" && Number(row.selection.discount_percent || 0) > 0) return "Use desconto por percentual OU por valor.";
      const discount = row.selection.discount_type === "percent"
        ? gross * (Number(row.selection.discount_percent || 0) / 100)
        : row.selection.discount_type === "amount"
          ? Number(row.selection.discount_amount || 0)
          : 0;
      if (discount > gross) return `Desconto maior que o total do item ${row.catalog.name}.`;
      const maxDiscount = Number(row.catalog.max_discount_pct ?? 100);
      if (gross > 0 && (discount / gross) * 100 > maxDiscount) return `Desconto de ${row.catalog.name} excede o limite de ${maxDiscount.toLocaleString("pt-BR")}% definido no catálogo.`;
      if (discount > 0 && !row.selection.discount_reason.trim()) return `Informe o motivo do desconto para ${row.catalog.name}.`;
    }
    return "";
  }

  function buildPayloadItems(): ProposalItemPayload[] {
    return selectedRows.map(({ catalog, selection }) => ({
      catalog_item_id: catalog.id,
      quantity: Number(selection.quantity || 1),
      unit_price_override: Number(selection.applied_price || catalogPrice(catalog)),
      discount_type: selection.discount_type,
      discount_percent: selection.discount_type === "percent" ? Number(selection.discount_percent || 0) : null,
      discount_amount: selection.discount_type === "amount" ? Number(selection.discount_amount || 0) : null,
      discount_reason: selection.discount_type !== "none" ? selection.discount_reason.trim() : null,
      customer_item_note: selection.customer_item_note.trim() || null,
      internal_item_note: selection.internal_item_note.trim() || null
    }));
  }

  async function handleCreate() {
    const validation = validateSelection();
    if (validation) {
      setMessage(validation);
      return;
    }
    setLoading(true);
    try {
      const created = await createProposal({
        lead_id: leadId,
        title,
        document_type: documentType,
        service_type: serviceType,
        customer_notes: customerNotes.trim() || null,
        internal_notes: internalNotes.trim() || null,
        items: buildPayloadItems(),
        valid_until: validUntil || null,
        document_group_id: documentGroupId || null,
        change_reason: changeReason.trim() || null
      });
      if (documentType === "contract") {
        await downloadContractPdf(created.id, `contrato-${slug(created.title || created.id)}.pdf`);
      } else {
        await downloadProposalPdf(created.id, `proposta-${slug(created.title || created.id)}.pdf`);
      }
      setProposals((current) => [created, ...current]);
      setSelectedItems({});
      setCustomerNotes("");
      setInternalNotes("");
      setDocumentGroupId("");
      setChangeReason("");
      setMessage(`${documentType === "contract" ? "Contrato" : "Proposta"} salvo(a) para ${selectedCompany?.name || "lead selecionado"} com snapshot comercial e PDF gerado.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao salvar proposta.");
    } finally {
      setLoading(false);
    }
  }

  function applyTemplate() {
    const template = templates.find((item) => item.id === templateId);
    if (!template) {
      setMessage("Selecione um modelo de escopo para aplicar ao rascunho.");
      return;
    }
    setCustomerNotes(templateDraft(template, selectedCompany));
    setServiceType(template.service_type || serviceType);
    setMessage("Modelo aplicado somente ao rascunho. Nenhuma proposta, contrato, PDF ou mudança de etapa foi criada.");
  }

  function startNewVersion(proposal: NodereProposal) {
    const metadata = proposal.metadata || {};
    setLeadId(proposal.lead_id);
    setTitle(proposal.title);
    setServiceType(proposal.service_type || "");
    setCustomerNotes(String(metadata.customer_notes || proposal.content || ""));
    setInternalNotes(String(metadata.internal_notes || ""));
    setValidUntil(proposal.valid_until ? proposal.valid_until.slice(0, 10) : "");
    setDocumentType(metadata.document_type === "contract" ? "contract" : "proposal");
    setDocumentGroupId(String(metadata.document_group_id || ""));
    setChangeReason("");
    setSelectedItems(Object.fromEntries((proposal.items || []).map((item) => [item.catalog_item_id, {
      quantity: Number(item.quantity || 1),
      applied_price: Number(item.snapshot_unit_price ?? item.unit_price_override ?? 0),
      discount_type: item.discount_type || "none",
      discount_percent: Number(item.discount_percent || 0),
      discount_amount: Number(item.discount_amount || 0),
      discount_reason: item.discount_reason || "",
      customer_item_note: item.customer_item_note || "",
      internal_item_note: item.internal_item_note || ""
    }])));
    setMessage(`Preparando versão ${Number(proposal.version || 1) + 1}. Informe o motivo da alteração antes de gerar.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handlePdf(proposal: NodereProposal) {
    try {
      await downloadProposalPdf(proposal.id, `proposta-${slug(proposal.title || proposal.id)}.pdf`);
      setMessage("PDF de proposta gerado pelo backend usando o snapshot salvo.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao gerar PDF.");
    }
  }

  async function handleContractPdf(proposal: NodereProposal) {
    try {
      await downloadContractPdf(proposal.id, `contrato-${slug(proposal.title || proposal.id)}.pdf`);
      setMessage("PDF de contrato gerado pelo backend usando o snapshot salvo.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao gerar contrato.");
    }
  }

  return (
    <div className="settings-page proposals-page">
      <div className="proposals-header">
        <div>
          <span className="eyebrow">CRM-04</span>
          <h1>Propostas comerciais</h1>
          <p>Monte propostas a partir dos produtos/serviços ativos do catálogo oficial e preserve o snapshot comercial.</p>
        </div>
        <button className="btn-ghost" type="button" onClick={loadData} disabled={loading}>
          <RefreshCw size={16} /> Atualizar
        </button>
      </div>

      {message && <div className="app-alert">{message}</div>}

      <div className="settings-content proposals-grid">
        <section className="proposal-editor">
          <h2><FileText size={18} /> Composição comercial</h2>
          {documentGroupId && (
            <div className="proposal-version-banner">
              Nova versão rastreável do documento selecionado. O snapshot anterior será preservado.
            </div>
          )}

          <div className="proposal-flow-section">
            <div className="proposal-step-heading"><span>1</span><div><strong>Cliente e oportunidade</strong><small>Obrigatório e vinculado à Ficha 360.</small></div></div>
            <label>
              Lead/empresa
              <select value={leadId} onChange={(event) => setLeadId(event.target.value)}>
                <option value="">Selecione uma empresa</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>{company.name} - {company.city || "sem cidade"}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="proposal-flow-section">
            <div className="proposal-step-heading"><span>2</span><div><strong>Documento e escopo</strong><small>O modelo preenche somente o rascunho e nunca cria uma proposta.</small></div></div>
            <div className="grid gap-3 md:grid-cols-2">
              <label>
                Tipo de documento
                <select value={documentType} onChange={(event) => setDocumentType(event.target.value as "proposal" | "contract")}>
                  <option value="proposal">Proposta</option>
                  <option value="contract">Contrato</option>
                </select>
              </label>
              <label>
                Tipo de serviço
                <input value={serviceType} onChange={(event) => setServiceType(event.target.value)} />
              </label>
            </div>
            <label>
              Título
              <input value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <label>
                Modelo de escopo opcional
                <select value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
                  <option value="">Sem modelo</option>
                  {templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
                </select>
              </label>
              <button type="button" className="btn-ghost" onClick={applyTemplate} disabled={!templateId}>Aplicar ao rascunho</button>
            </div>
          </div>

          <div className="proposal-flow-section">
            <div className="proposal-step-heading"><span>3</span><div><strong>Produtos, preços e descontos</strong><small>Itens ativos do catálogo oficial, com custo e limite de desconto validados.</small></div></div>
            <div className="proposal-items">
            <div className="proposal-items-title">
              <strong>Produtos/serviços ativos</strong>
              <span className="text-xs text-[var(--text-secondary)]">{selectedRows.length} selecionado(s)</span>
            </div>
            {!activeCatalogItems.length && <p className="muted">Nenhum produto/serviço ativo no catálogo.</p>}
            {activeCatalogItems.map((item) => {
              const selected = selectedItems[item.id];
              const base = catalogPrice(item);
              const appliedPrice = selected ? Number(selected.applied_price || base) : base;
              const gross = selected ? appliedPrice * Number(selected.quantity || 0) : 0;
              const discount = selected?.discount_type === "percent"
                ? gross * (Number(selected.discount_percent || 0) / 100)
                : selected?.discount_type === "amount"
                  ? Number(selected.discount_amount || 0)
                  : 0;
              return (
                <div className="proposal-item-row" key={item.id}>
                  <label className="flex items-start gap-3">
                    <input type="checkbox" checked={Boolean(selected)} onChange={(event) => toggleItem(item.id, event.target.checked)} />
                    <span>
                      <strong>{item.name}</strong>
                      <small>{item.type === "service" ? "Serviço" : "Produto"} · {unitLabel(item.billing_unit || item.unit_measure)} · Valor base {money(base)}</small>
                      <small>{item.description_short}</small>
                      <small>Condição: {item.payment_conditions || "Não informada"} · Forma: {item.payment_method || "Não informada"} · Prazo: {item.execution_time || (item.delivery_days ? `${item.delivery_days} dias` : "Não informado")}</small>
                    </span>
                  </label>
                  {selected && (
                    <div className="grid gap-3 md:grid-cols-3">
                      <label>
                        Quantidade/horas/recorrência
                        <input type="number" min="1" value={selected.quantity} onChange={(event) => updateItem(item.id, { quantity: Number(event.target.value) })} />
                      </label>
                      <label>
                        Valor aplicado
                        <input type="number" min="0" step="0.01" value={selected.applied_price || base} onChange={(event) => updateItem(item.id, { applied_price: Number(event.target.value) })} />
                      </label>
                      <label>
                        Valor base bloqueado
                        <input disabled value={money(base)} />
                      </label>
                      <label>
                        Tipo de desconto
                        <select value={selected.discount_type} onChange={(event) => updateItem(item.id, { discount_type: event.target.value as SelectedItemState["discount_type"], discount_percent: 0, discount_amount: 0 })}>
                          <option value="none">Sem desconto</option>
                          <option value="percent">Percentual</option>
                          <option value="amount">Valor</option>
                        </select>
                      </label>
                      {selected.discount_type === "percent" && (
                        <label>
                          Desconto (%)
                          <input type="number" min="0" max="100" value={selected.discount_percent} onChange={(event) => updateItem(item.id, { discount_percent: Number(event.target.value), discount_amount: 0 })} />
                        </label>
                      )}
                      {selected.discount_type === "amount" && (
                        <label>
                          Desconto (R$)
                          <input type="number" min="0" value={selected.discount_amount} onChange={(event) => updateItem(item.id, { discount_amount: Number(event.target.value), discount_percent: 0 })} />
                        </label>
                      )}
                      {selected.discount_type !== "none" && (
                        <label className="md:col-span-3">
                          Motivo obrigatório do desconto
                          <input value={selected.discount_reason} onChange={(event) => updateItem(item.id, { discount_reason: event.target.value })} />
                        </label>
                      )}
                      <label className="md:col-span-3">
                        Observação para o cliente
                        <input value={selected.customer_item_note} onChange={(event) => updateItem(item.id, { customer_item_note: event.target.value })} />
                      </label>
                      <label className="md:col-span-3">
                        Observação interna
                        <input value={selected.internal_item_note} onChange={(event) => updateItem(item.id, { internal_item_note: event.target.value })} />
                      </label>
                      <span>Original {money(base * Number(selected.quantity || 0))}</span>
                      <span>Aplicado {money(gross)}</span>
                      <span>Final {money(Math.max(0, gross - Math.min(discount, gross)))}</span>
                    </div>
                  )}
                </div>
              );
            })}
            </div>
          </div>

          <div className="proposal-flow-section">
            <div className="proposal-step-heading"><span>4</span><div><strong>Escopo e observações</strong><small>O conteúdo do cliente e o histórico interno permanecem separados.</small></div></div>
            <label>
              Escopo e observações para o cliente
              <RichTextEditor value={customerNotes} onChange={setCustomerNotes} minHeight={170} placeholder="Texto opcional que aparecerá no PDF. Produtos, descrições, condições, forma de pagamento e prazos vêm do catálogo." />
            </label>
            <label>
              Observações internas da negociação
              <RichTextEditor value={internalNotes} onChange={setInternalNotes} minHeight={150} placeholder="Histórico interno. Não aparece no PDF do cliente." />
            </label>
          </div>

          <div className="proposal-flow-section">
            <div className="proposal-step-heading"><span>5</span><div><strong>Condições comerciais e validade</strong><small>Totais calculados pelo snapshot; impostos não configurados são sinalizados.</small></div></div>
            <div className="proposal-total-box">
              <label>
                Validade
                <input type="date" min={new Date().toISOString().slice(0, 10)} value={validUntil} onChange={(event) => setValidUntil(event.target.value)} />
              </label>
              <div>
                <span>Subtotal {money(totals.subtotal)}</span>
                <span>Desconto {money(totals.discount)}</span>
                <span>Custo cadastrado {money(totals.cost)}</span>
                <span>Margem bruta estimada {grossMargin.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</span>
                <span>Impostos: não configurados no catálogo</span>
                <strong>Total {money(totals.total)}</strong>
              </div>
            </div>
            {documentGroupId && (
              <label>
                Motivo obrigatório da nova versão
                <input value={changeReason} onChange={(event) => setChangeReason(event.target.value)} placeholder="Ex.: ajuste de escopo solicitado pelo cliente" />
              </label>
            )}
          </div>

          <div className="proposal-flow-section proposal-preview">
            <div className="proposal-step-heading"><span>6</span><div><strong>Preview antes de gerar</strong><small>Confirme cliente, escopo, itens e valor. Nada é salvo até a ação final.</small></div></div>
            <div className="proposal-preview-document">
              <span className="eyebrow">{documentType === "contract" ? "Contrato comercial" : "Proposta comercial"}</span>
              <h3>{title || "Documento sem título"}</h3>
              <p><strong>Cliente:</strong> {selectedCompany?.name || "Selecione uma empresa"}</p>
              <p><strong>Serviço:</strong> {serviceType || "Não informado"}</p>
              <div className="proposal-preview-items">
                {selectedRows.map(({ catalog, selection }) => <p key={catalog.id}>{catalog.name} × {selection.quantity} — {money((selection.applied_price || catalogPrice(catalog)) * selection.quantity)}</p>)}
                {!selectedRows.length && <p>Nenhum produto/serviço selecionado.</p>}
              </div>
              {plainText(customerNotes) && <p className="proposal-preview-notes">{plainText(customerNotes)}</p>}
              <strong className="proposal-preview-total">Total {money(totals.total)}</strong>
            </div>
          </div>

          <button className="btn-primary" type="button" onClick={handleCreate} disabled={loading || !leadId || !selectedRows.length}>
            <Save size={16} /> {documentType === "contract" ? "Gerar contrato PDF" : "Gerar proposta PDF"}
          </button>
        </section>

        <section className="proposal-list">
          <h2>Histórico e versões</h2>
          {proposals.map((proposal) => (
            <article key={proposal.id} className="proposal-card">
              <div>
                <strong>{proposal.title}</strong>
                <span>
                  {proposal.metadata?.document_type === "contract" ? "Contrato" : "Proposta"}
                  {` · versão ${proposal.version || 1} · ${proposal.status} · ${money(proposal.total)}`}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="btn-ghost" type="button" onClick={() => handlePdf(proposal)}>
                  <Download size={15} /> Proposta PDF
                </button>
                <button className="btn-ghost" type="button" onClick={() => handleContractPdf(proposal)}>
                  <Download size={15} /> Contrato PDF
                </button>
                <button className="btn-ghost" type="button" onClick={() => startNewVersion(proposal)}>
                  Nova versão
                </button>
              </div>
            </article>
          ))}
          {!proposals.length && <p className="muted">Nenhuma proposta criada no banco ainda.</p>}
        </section>
      </div>
    </div>
  );
}
