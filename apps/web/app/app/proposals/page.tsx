"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, FileText, RefreshCw, Save } from "lucide-react";
import {
  CatalogItem,
  createProposal,
  downloadContractPdf,
  downloadProposalPdf,
  getCatalogItems,
  getCompanies,
  getProposals,
  NodereProposal,
  ProposalItemPayload
} from "@/lib/api";
import type { Company } from "@/lib/types";
import { RichTextEditor } from "@/components/RichTextEditor";

type SelectedItemState = {
  quantity: number;
  discount_type: "none" | "percent" | "amount";
  discount_percent: number;
  discount_amount: number;
  discount_reason: string;
  customer_item_note: string;
  internal_item_note: string;
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
    discount_type: "none",
    discount_percent: 0,
    discount_amount: 0,
    discount_reason: "",
    customer_item_note: "",
    internal_item_note: ""
  };
}

export default function AppProposalsPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<string, SelectedItemState>>({});
  const [proposals, setProposals] = useState<NodereProposal[]>([]);
  const [message, setMessage] = useState("Carregando propostas...");
  const [loading, setLoading] = useState(false);
  const [leadId, setLeadId] = useState("");
  const [title, setTitle] = useState("Proposta comercial NODERE");
  const [serviceType, setServiceType] = useState("Google Ads + CRM");
  const [content, setContent] = useState("Diagnóstico, plano de ação comercial e execução acompanhada pelo CRM NODERE.");
  const [validUntil, setValidUntil] = useState("");

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
        const gross = catalogPrice(row.catalog) * Number(row.selection.quantity || 0);
        const discount = row.selection.discount_type === "percent"
          ? gross * (Number(row.selection.discount_percent || 0) / 100)
          : row.selection.discount_type === "amount"
            ? Number(row.selection.discount_amount || 0)
            : 0;
        acc.subtotal += gross;
        acc.discount += Math.min(discount, gross);
        acc.total += Math.max(0, gross - Math.min(discount, gross));
        return acc;
      },
      { subtotal: 0, discount: 0, total: 0 }
    );
  }, [selectedRows]);

  async function loadData() {
    setLoading(true);
    try {
      const [companyRows, proposalRows, catalogRows] = await Promise.all([getCompanies(), getProposals(), getCatalogItems()]);
      setCompanies(companyRows);
      setProposals(proposalRows);
      setCatalogItems(catalogRows);
      setLeadId((current) => current || companyRows[0]?.id || "");
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
      return { ...current, [itemId]: current[itemId] || defaultSelection() };
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
    if (!selectedRows.length) return "Selecione pelo menos um produto/serviço ativo do catálogo.";
    for (const row of selectedRows) {
      const gross = catalogPrice(row.catalog) * Number(row.selection.quantity || 0);
      if (Number(row.selection.quantity || 0) <= 0) return `Informe quantidade válida para ${row.catalog.name}.`;
      if (row.selection.discount_type === "percent" && Number(row.selection.discount_amount || 0) > 0) return "Use desconto por percentual OU por valor.";
      if (row.selection.discount_type === "amount" && Number(row.selection.discount_percent || 0) > 0) return "Use desconto por percentual OU por valor.";
      const discount = row.selection.discount_type === "percent"
        ? gross * (Number(row.selection.discount_percent || 0) / 100)
        : row.selection.discount_type === "amount"
          ? Number(row.selection.discount_amount || 0)
          : 0;
      if (discount > gross) return `Desconto maior que o total do item ${row.catalog.name}.`;
      if (discount > 0 && !row.selection.discount_reason.trim()) return `Informe o motivo do desconto para ${row.catalog.name}.`;
    }
    return "";
  }

  function buildPayloadItems(): ProposalItemPayload[] {
    return selectedRows.map(({ catalog, selection }) => ({
      catalog_item_id: catalog.id,
      quantity: Number(selection.quantity || 1),
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
        service_type: serviceType,
        content,
        items: buildPayloadItems(),
        valid_until: validUntil || null
      });
      setProposals((current) => [created, ...current]);
      setSelectedItems({});
      setMessage(`Proposta salva para ${selectedCompany?.name || "lead selecionado"} com snapshot comercial.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao salvar proposta.");
    } finally {
      setLoading(false);
    }
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
          <h2><FileText size={18} /> Nova proposta</h2>
          <label>
            Lead/empresa
            <select value={leadId} onChange={(event) => setLeadId(event.target.value)}>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>{company.name} - {company.city || "sem cidade"}</option>
              ))}
            </select>
          </label>
          <label>
            Título
            <input value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label>
            Tipo de serviço
            <input value={serviceType} onChange={(event) => setServiceType(event.target.value)} />
          </label>
          <div>
            <span className="mb-1.5 block text-sm font-semibold">Conteúdo</span>
            <RichTextEditor value={content} onChange={setContent} minHeight={220} placeholder="Diagnóstico, escopo, condições e próximos passos..." />
          </div>

          <div className="proposal-items">
            <div className="proposal-items-title">
              <strong>Produtos/serviços ativos</strong>
              <span className="text-xs text-[var(--text-secondary)]">{selectedRows.length} selecionado(s)</span>
            </div>
            {!activeCatalogItems.length && <p className="muted">Nenhum produto/serviço ativo no catálogo.</p>}
            {activeCatalogItems.map((item) => {
              const selected = selectedItems[item.id];
              const gross = selected ? catalogPrice(item) * Number(selected.quantity || 0) : 0;
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
                      <small>{item.type === "service" ? "Serviço" : "Produto"} · {unitLabel(item.billing_unit || item.unit_measure)} · {money(catalogPrice(item))}</small>
                      <small>{item.description_short}</small>
                    </span>
                  </label>
                  {selected && (
                    <div className="grid gap-3 md:grid-cols-3">
                      <label>
                        Quantidade/horas/recorrência
                        <input type="number" min="1" value={selected.quantity} onChange={(event) => updateItem(item.id, { quantity: Number(event.target.value) })} />
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
                      <span>{money(Math.max(0, gross - Math.min(discount, gross)))}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="proposal-total-box">
            <label>
              Validade
              <input type="date" value={validUntil} onChange={(event) => setValidUntil(event.target.value)} />
            </label>
            <div>
              <span>Subtotal {money(totals.subtotal)}</span>
              <span>Desconto {money(totals.discount)}</span>
              <strong>Total {money(totals.total)}</strong>
            </div>
          </div>

          <button className="btn-primary" type="button" onClick={handleCreate} disabled={loading || !leadId || !selectedRows.length}>
            <Save size={16} /> Salvar proposta
          </button>
        </section>

        <section className="proposal-list">
          <h2>Histórico</h2>
          {proposals.map((proposal) => (
            <article key={proposal.id} className="proposal-card">
              <div>
                <strong>{proposal.title}</strong>
                <span>{proposal.status} · {money(proposal.total)}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="btn-ghost" type="button" onClick={() => handlePdf(proposal)}>
                  <Download size={15} /> Proposta PDF
                </button>
                <button className="btn-ghost" type="button" onClick={() => handleContractPdf(proposal)}>
                  <Download size={15} /> Contrato PDF
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
