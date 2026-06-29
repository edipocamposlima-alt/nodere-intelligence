"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Ban, CheckCircle2, Package, Pencil, Plus, Save } from "lucide-react";
import {
  createCatalogItem,
  getCatalogItems,
  getCommercialContext,
  updateCatalogItem,
  type CatalogPayload,
  type CommercialContext
} from "@/lib/commercialApi";
import type { CommercialCatalogItem } from "@/lib/types";

const emptyForm: CatalogPayload = {
  type: "service",
  name: "",
  description: "",
  unit: "un",
  unitPriceCents: 0,
  active: true
};

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function toCents(value: string) {
  return Math.round(Number(value.replace(",", ".")) * 100);
}

export default function CatalogPage() {
  const [context, setContext] = useState<CommercialContext | null>(null);
  const [items, setItems] = useState<CommercialCatalogItem[]>([]);
  const [form, setForm] = useState<CatalogPayload>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const activeItems = useMemo(() => items.filter((item) => item.active), [items]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [ctx, catalog] = await Promise.all([getCommercialContext(), getCatalogItems()]);
      setContext(ctx);
      setItems(catalog);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar catalogo.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function edit(item: CommercialCatalogItem) {
    setEditingId(item.id);
    setForm({
      type: item.type,
      name: item.name,
      description: item.description ?? "",
      unit: item.unit,
      unitPriceCents: item.unitPriceCents,
      active: item.active
    });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!context?.canManageCatalog) return;

    setSaving(true);
    setError("");
    try {
      if (editingId) await updateCatalogItem(editingId, form);
      else await createCatalogItem(form);
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar item.");
    } finally {
      setSaving(false);
    }
  }

  async function inactivate(item: CommercialCatalogItem) {
    if (!context?.canManageCatalog) return;
    setSaving(true);
    setError("");
    try {
      await updateCatalogItem(item.id, { active: false });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao inativar item.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Catálogo de Produtos e Serviços</h2>
          <p className="mt-1 text-sm text-slate-400">
            Fonte comercial oficial para propostas. Itens inativos ficam preservados para snapshots antigos.
          </p>
        </div>
        {context && (
          <span className="rounded-lg border border-line bg-panel px-3 py-2 text-xs text-slate-300">
            Perfil: <strong className="text-white">{context.role}</strong>
          </span>
        )}
      </div>

      {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

      <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <form onSubmit={save} className="rounded-lg border border-line bg-panel/90 p-5">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-cyan" />
            <h3 className="font-semibold text-white">{editingId ? "Editar item" : "Novo item"}</h3>
          </div>

          {!context?.canManageCatalog && (
            <div className="mt-4 rounded-md border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
              Seu perfil possui somente leitura para o catálogo.
            </div>
          )}

          <div className="mt-4 grid gap-3">
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-line bg-ink p-1">
              {(["service", "product"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  disabled={!context?.canManageCatalog}
                  onClick={() => setForm((current) => ({ ...current, type }))}
                  className={`rounded-md px-3 py-2 text-sm ${form.type === type ? "bg-electric text-white" : "text-slate-400 hover:text-white"}`}
                >
                  {type === "service" ? "Serviço" : "Produto"}
                </button>
              ))}
            </div>

            <input disabled={!context?.canManageCatalog} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-cyan disabled:opacity-60" />
            <textarea disabled={!context?.canManageCatalog} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descrição" rows={3} className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-cyan disabled:opacity-60" />
            <div className="grid gap-3 sm:grid-cols-2">
              <input disabled={!context?.canManageCatalog} required value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="Unidade" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-cyan disabled:opacity-60" />
              <input disabled={!context?.canManageCatalog} required type="number" min="0" step="0.01" value={(form.unitPriceCents / 100).toFixed(2)} onChange={(e) => setForm({ ...form, unitPriceCents: toCents(e.target.value) })} placeholder="Preço" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-cyan disabled:opacity-60" />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input disabled={!context?.canManageCatalog} type="checkbox" checked={Boolean(form.active)} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 accent-electric disabled:opacity-60" />
              Ativo para novas propostas
            </label>
          </div>

          {context?.canManageCatalog && (
            <div className="mt-4 flex gap-2">
              <button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-electric px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                {editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingId ? "Salvar" : "Criar"}
              </button>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }} className="rounded-lg border border-line px-4 py-2 text-sm text-slate-300">
                  Cancelar
                </button>
              )}
            </div>
          )}
        </form>

        <div className="rounded-lg border border-line bg-panel/90">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <h3 className="font-semibold text-white">Itens cadastrados</h3>
              <p className="text-xs text-slate-500">{activeItems.length} ativos de {items.length} itens</p>
            </div>
          </div>

          <div className="divide-y divide-line">
            {loading && <p className="p-5 text-sm text-slate-500">Carregando...</p>}
            {!loading && items.length === 0 && <p className="p-5 text-sm text-slate-500">Nenhum item cadastrado.</p>}
            {items.map((item) => (
              <article key={item.id} className="grid gap-3 p-5 md:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-white">{item.name}</strong>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase text-slate-300">{item.type === "service" ? "Serviço" : "Produto"}</span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${item.active ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>
                      {item.active ? <CheckCircle2 className="h-3 w-3" /> : <Ban className="h-3 w-3" />}
                      {item.active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  {item.description && <p className="mt-1 text-sm text-slate-400">{item.description}</p>}
                  <p className="mt-2 text-sm text-cyan">{formatBRL(item.unitPriceCents)} <span className="text-slate-500">/ {item.unit}</span></p>
                </div>
                {context?.canManageCatalog && (
                  <div className="flex items-start gap-2">
                    <button onClick={() => edit(item)} className="rounded-lg border border-line bg-white/5 p-2 text-slate-300 hover:text-white" aria-label="Editar">
                      <Pencil className="h-4 w-4" />
                    </button>
                    {item.active && (
                      <button onClick={() => inactivate(item)} className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-red-200 hover:bg-red-500/20" aria-label="Inativar">
                        <Ban className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
