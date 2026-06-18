"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, FileText, Plus, RefreshCw, Save } from "lucide-react";
import { createProposal, downloadProposalPdf, getCompanies, getProposals, NodereProposal, ProposalItemPayload } from "@/lib/api";
import type { Company } from "@/lib/types";

const defaultItem: ProposalItemPayload = { description: "Gestão comercial e tráfego local", quantity: 1, unit_price: 970 };

function money(value: number) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function slug(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function AppProposalsPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [proposals, setProposals] = useState<NodereProposal[]>([]);
  const [message, setMessage] = useState("Carregando propostas...");
  const [loading, setLoading] = useState(false);
  const [leadId, setLeadId] = useState("");
  const [title, setTitle] = useState("Proposta comercial NODERE Nexus");
  const [serviceType, setServiceType] = useState("Google Ads + CRM");
  const [content, setContent] = useState("Diagnóstico, plano de ação comercial e execução acompanhada pelo CRM NODERE Nexus.");
  const [items, setItems] = useState<ProposalItemPayload[]>([defaultItem]);
  const [discount, setDiscount] = useState(0);
  const [validUntil, setValidUntil] = useState("");

  const selectedCompany = companies.find((item) => item.id === leadId);
  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0), 0);
    const safeDiscount = Math.min(Math.max(Number(discount || 0), 0), subtotal);
    return { subtotal, discount: safeDiscount, total: subtotal - safeDiscount };
  }, [items, discount]);

  async function loadData() {
    setLoading(true);
    try {
      const [companyRows, proposalRows] = await Promise.all([getCompanies(), getProposals()]);
      setCompanies(companyRows);
      setProposals(proposalRows);
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

  function updateItem(index: number, patch: Partial<ProposalItemPayload>) {
    setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  }

  async function handleCreate() {
    if (!leadId) {
      setMessage("Selecione um lead/empresa antes de salvar a proposta.");
      return;
    }
    setLoading(true);
    try {
      const created = await createProposal({
        lead_id: leadId,
        title,
        service_type: serviceType,
        content,
        items,
        discount,
        valid_until: validUntil || null
      });
      setProposals((current) => [created, ...current]);
      setMessage(`Proposta salva para ${selectedCompany?.name || "lead selecionado"}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao salvar proposta.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePdf(proposal: NodereProposal) {
    try {
      await downloadProposalPdf(proposal.id, `proposta-${slug(proposal.title || proposal.id)}.pdf`);
      setMessage("PDF gerado pelo backend.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao gerar PDF.");
    }
  }

  return (
    <div className="settings-page proposals-page">
      <div className="proposals-header">
        <div>
          <span className="eyebrow">CRM-04</span>
          <h1>Propostas comerciais</h1>
          <p>Crie propostas ligadas aos leads reais do CRM, registre versões e gere PDFs padronizados.</p>
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
          <label>
            Conteúdo
            <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={6} />
          </label>

          <div className="proposal-items">
            <div className="proposal-items-title">
              <strong>Itens</strong>
              <button className="btn-ghost" type="button" onClick={() => setItems((current) => [...current, defaultItem])}>
                <Plus size={14} /> Item
              </button>
            </div>
            {items.map((item, index) => (
              <div className="proposal-item-row" key={`${item.description}-${index}`}>
                <input value={item.description} onChange={(event) => updateItem(index, { description: event.target.value })} />
                <input type="number" min="0" value={item.quantity} onChange={(event) => updateItem(index, { quantity: Number(event.target.value) })} />
                <input type="number" min="0" value={item.unit_price} onChange={(event) => updateItem(index, { unit_price: Number(event.target.value) })} />
                <span>{money(Number(item.quantity || 0) * Number(item.unit_price || 0))}</span>
              </div>
            ))}
          </div>

          <div className="proposal-total-box">
            <label>
              Desconto
              <input type="number" min="0" value={discount} onChange={(event) => setDiscount(Number(event.target.value))} />
            </label>
            <label>
              Validade
              <input type="date" value={validUntil} onChange={(event) => setValidUntil(event.target.value)} />
            </label>
            <div>
              <span>Subtotal {money(totals.subtotal)}</span>
              <strong>Total {money(totals.total)}</strong>
            </div>
          </div>

          <button className="btn-primary" type="button" onClick={handleCreate} disabled={loading || !leadId}>
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
              <button className="btn-ghost" type="button" onClick={() => handlePdf(proposal)}>
                <Download size={15} /> PDF
              </button>
            </article>
          ))}
          {!proposals.length && <p className="muted">Nenhuma proposta criada no banco ainda.</p>}
        </section>
      </div>
    </div>
  );
}
