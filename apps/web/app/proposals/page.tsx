"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardList, FileText, History, Percent, Plus, RefreshCw } from "lucide-react";
import {
  createProposal,
  getCatalogItems,
  getCommercialContext,
  getProposalAudit,
  getProposals,
  openProposalPdf,
  type CommercialContext,
  type ProposalPayload
} from "@/lib/commercialApi";
import type { CommercialCatalogItem, CommercialProposal, CommercialProposalAuditLog } from "@/lib/types";

type DiscountMode = "none" | "percent" | "value";

type SelectedItem = {
  catalogItemId: string;
  quantity: number;
};

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function toCents(value: string) {
  return Math.round(Number(value.replace(",", ".")) * 100);
}

export default function ProposalsPage() {
  const [context, setContext] = useState<CommercialContext | null>(null);
  const [catalog, setCatalog] = useState<CommercialCatalogItem[]>([]);
  const [proposals, setProposals] = useState<CommercialProposal[]>([]);
  const [audit, setAudit] = useState<CommercialProposalAuditLog[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<CommercialProposal | null>(null);
  const [title, setTitle] = useState("Proposta comercial");
  const [companyId, setCompanyId] = useState("");
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [discountMode, setDiscountMode] = useState<DiscountMode>("none");
  const [discountPercent, setDiscountPercent] = useState("");
  const [discountValue, setDiscountValue] = useState("");
  const [discountReason, setDiscountReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [ctx, items, proposalRows] = await Promise.all([
        getCommercialContext(),
        getCatalogItems(true),
        getProposals()
      ]);
      setContext(ctx);
      setCatalog(items);
      setProposals(proposalRows);
      if (!selectedProposal && proposalRows[0]) setSelectedProposal(proposalRows[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar propostas.");
    } finally {
      setLoading(false);
    }
  }, [selectedProposal]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!selectedProposal) {
      setAudit([]);
      return;
    }

    getProposalAudit(selectedProposal.id)
      .then(setAudit)
      .catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar auditoria."));
  }, [selectedProposal]);

  const totals = useMemo(() => {
    const subtotal = selectedItems.reduce((sum, selected) => {
      const item = catalog.find((entry) => entry.id === selected.catalogItemId);
      return sum + (item?.unitPriceCents ?? 0) * selected.quantity;
    }, 0);

    const discount =
      discountMode === "percent"
        ? Math.round(subtotal * (Number(discountPercent || 0) / 100))
        : discountMode === "value"
          ? toCents(discountValue || "0")
          : 0;

    return {
      subtotal,
      discount,
      total: Math.max(subtotal - discount, 0)
    };
  }, [catalog, discountMode, discountPercent, discountValue, selectedItems]);

  function toggleItem(item: CommercialCatalogItem) {
    setSelectedItems((current) => {
      if (current.some((selected) => selected.catalogItemId === item.id)) {
        return current.filter((selected) => selected.catalogItemId !== item.id);
      }
      return [...current, { catalogItemId: item.id, quantity: 1 }];
    });
  }

  function setQuantity(catalogItemId: string, quantity: number) {
    setSelectedItems((current) =>
      current.map((item) => item.catalogItemId === catalogItemId ? { ...item, quantity: Math.max(1, quantity) } : item)
    );
  }

  function resetForm() {
    setTitle("Proposta comercial");
    setCompanyId("");
    setSelectedItems([]);
    setDiscountMode("none");
    setDiscountPercent("");
    setDiscountValue("");
    setDiscountReason("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!context?.canWriteProposals) return;
    if (selectedItems.length === 0) {
      setError("Selecione pelo menos um item ativo do catalogo.");
      return;
    }
    if (discountMode !== "none" && !discountReason.trim()) {
      setError("Informe o motivo do desconto.");
      return;
    }

    const payload: ProposalPayload = {
      title,
      companyId: companyId || undefined,
      status: "draft",
      items: selectedItems
    };

    if (discountMode === "percent") {
      payload.discountPercent = Number(discountPercent || 0);
      payload.discountReason = discountReason;
    }
    if (discountMode === "value") {
      payload.discountValueCents = toCents(discountValue || "0");
      payload.discountReason = discountReason;
    }

    setSaving(true);
    setError("");
    try {
      const proposal = await createProposal(payload);
      resetForm();
      await load();
      setSelectedProposal(proposal);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar proposta.");
    } finally {
      setSaving(false);
    }
  }

  async function openPdf(id: string) {
    setError("");
    try {
      await openProposalPdf(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao abrir PDF.");
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Propostas Comerciais</h2>
          <p className="mt-1 text-sm text-slate-400">
            Monte propostas apenas com itens ativos do catálogo. O snapshot salvo alimenta o PDF.
          </p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-line bg-panel px-3 py-2 text-sm text-slate-300">
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={submit} className="rounded-lg border border-line bg-panel/90 p-5">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-cyan" />
            <h3 className="font-semibold text-white">Nova proposta</h3>
          </div>

          {!context?.canWriteProposals && (
            <div className="mt-4 rounded-md border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
              Seu perfil pode visualizar propostas, mas não criar ou editar.
            </div>
          )}

          <div className="mt-4 grid gap-3">
            <input disabled={!context?.canWriteProposals} value={title} onChange={(e) => setTitle(e.target.value)} required className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-cyan disabled:opacity-60" />
            <input disabled={!context?.canWriteProposals} value={companyId} onChange={(e) => setCompanyId(e.target.value)} placeholder="ID da empresa ou lead (opcional)" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-cyan disabled:opacity-60" />

            <div className="rounded-lg border border-line bg-ink p-3">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Itens ativos do catálogo</p>
              <div className="space-y-2">
                {catalog.length === 0 && <p className="text-sm text-slate-500">Nenhum item ativo disponível.</p>}
                {catalog.map((item) => {
                  const selected = selectedItems.find((entry) => entry.catalogItemId === item.id);
                  return (
                    <label key={item.id} className="grid gap-2 rounded-md border border-line bg-panel/70 p-3 sm:grid-cols-[1fr_auto]">
                      <span className="flex items-start gap-3">
                        <input disabled={!context?.canWriteProposals} type="checkbox" checked={Boolean(selected)} onChange={() => toggleItem(item)} className="mt-1 h-4 w-4 accent-electric disabled:opacity-60" />
                        <span>
                          <span className="block text-sm font-medium text-white">{item.name}</span>
                          <span className="text-xs text-slate-500">{item.type === "service" ? "Serviço" : "Produto"} · {formatBRL(item.unitPriceCents)} / {item.unit}</span>
                        </span>
                      </span>
                      {selected && (
                        <input
                          disabled={!context?.canWriteProposals}
                          type="number"
                          min="1"
                          step="1"
                          value={selected.quantity}
                          onChange={(e) => setQuantity(item.id, Number(e.target.value))}
                          className="w-24 rounded-md border border-line bg-ink px-2 py-1 text-sm outline-none focus:border-cyan disabled:opacity-60"
                          aria-label={`Quantidade de ${item.name}`}
                        />
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg border border-line bg-ink p-3">
              <div className="mb-3 flex items-center gap-2">
                <Percent className="h-4 w-4 text-cyan" />
                <p className="text-sm font-medium text-white">Desconto</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {(["none", "percent", "value"] as const).map((mode) => (
                  <button
                    key={mode}
                    disabled={!context?.canWriteProposals}
                    type="button"
                    onClick={() => setDiscountMode(mode)}
                    className={`rounded-md px-3 py-2 text-sm ${discountMode === mode ? "bg-electric text-white" : "bg-panel text-slate-400 hover:text-white"} disabled:opacity-60`}
                  >
                    {mode === "none" ? "Sem desconto" : mode === "percent" ? "Percentual" : "Valor"}
                  </button>
                ))}
              </div>

              {discountMode === "percent" && (
                <input disabled={!context?.canWriteProposals} type="number" min="0" max="100" step="0.01" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} placeholder="% de desconto" className="mt-3 w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-cyan disabled:opacity-60" />
              )}
              {discountMode === "value" && (
                <input disabled={!context?.canWriteProposals} type="number" min="0" step="0.01" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} placeholder="Valor do desconto" className="mt-3 w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-cyan disabled:opacity-60" />
              )}
              {discountMode !== "none" && (
                <textarea disabled={!context?.canWriteProposals} value={discountReason} onChange={(e) => setDiscountReason(e.target.value)} required placeholder="Motivo interno obrigatório do desconto" rows={2} className="mt-3 w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-cyan disabled:opacity-60" />
              )}
            </div>

            <div className="grid gap-2 rounded-lg border border-line bg-ink p-3 text-sm sm:grid-cols-3">
              <div><span className="text-slate-500">Subtotal</span><strong className="block text-white">{formatBRL(totals.subtotal)}</strong></div>
              <div><span className="text-slate-500">Desconto</span><strong className="block text-amber-200">{formatBRL(totals.discount)}</strong></div>
              <div><span className="text-slate-500">Total</span><strong className="block text-cyan">{formatBRL(totals.total)}</strong></div>
            </div>
          </div>

          {context?.canWriteProposals && (
            <button disabled={saving || selectedItems.length === 0} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-electric px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              <Plus className="h-4 w-4" />
              Criar proposta
            </button>
          )}
        </form>

        <div className="space-y-5">
          <div className="rounded-lg border border-line bg-panel/90">
            <div className="border-b border-line px-5 py-4">
              <h3 className="font-semibold text-white">Propostas salvas</h3>
              <p className="text-xs text-slate-500">Dados persistidos no Supabase</p>
            </div>
            <div className="divide-y divide-line">
              {loading && <p className="p-5 text-sm text-slate-500">Carregando...</p>}
              {!loading && proposals.length === 0 && <p className="p-5 text-sm text-slate-500">Nenhuma proposta criada.</p>}
              {proposals.map((proposal) => (
                <article key={proposal.id} className={`grid gap-3 p-5 ${selectedProposal?.id === proposal.id ? "bg-electric/5" : ""}`}>
                  <button type="button" onClick={() => setSelectedProposal(proposal)} className="text-left">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong className="text-white">{proposal.title}</strong>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase text-slate-300">{proposal.status}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{proposal.items.length} itens · {new Date(proposal.createdAt).toLocaleDateString("pt-BR")}</p>
                    <p className="mt-2 text-sm text-cyan">Total: {formatBRL(proposal.totalCents)}</p>
                  </button>
                  <div className="flex gap-2">
                    <button onClick={() => openPdf(proposal.id)} className="inline-flex items-center gap-2 rounded-lg border border-line bg-white/5 px-3 py-2 text-xs text-slate-200 hover:text-white">
                      <FileText className="h-4 w-4" />
                      PDF
                    </button>
                    <button onClick={() => setSelectedProposal(proposal)} className="inline-flex items-center gap-2 rounded-lg border border-line bg-white/5 px-3 py-2 text-xs text-slate-200 hover:text-white">
                      <History className="h-4 w-4" />
                      Auditoria
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-line bg-panel/90">
            <div className="border-b border-line px-5 py-4">
              <h3 className="font-semibold text-white">Auditoria da proposta</h3>
              <p className="text-xs text-slate-500">{selectedProposal ? selectedProposal.title : "Selecione uma proposta"}</p>
            </div>
            <div className="divide-y divide-line">
              {!selectedProposal && <p className="p-5 text-sm text-slate-500">Nenhuma proposta selecionada.</p>}
              {selectedProposal && audit.length === 0 && <p className="p-5 text-sm text-slate-500">Nenhum evento registrado.</p>}
              {audit.map((event) => (
                <article key={event.id} className="p-5">
                  <p className="text-sm font-medium text-white">{event.action}</p>
                  <p className="mt-1 text-xs text-slate-500">{new Date(event.createdAt).toLocaleString("pt-BR")}</p>
                  <pre className="mt-3 overflow-auto rounded-md border border-line bg-ink p-3 text-xs text-slate-400">
                    {JSON.stringify(event.metadata, null, 2)}
                  </pre>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
