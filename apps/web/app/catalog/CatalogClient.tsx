"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { Edit3, ImageIcon, PackageOpen, Plus, RefreshCw, SlidersHorizontal, Trash2 } from "lucide-react";
import { CatalogItem, createCatalogItem, getCatalogItems, inactiveCatalogItem, updateCatalogItem } from "@/lib/api";
import { RichTextEditor } from "@/components/RichTextEditor";
import { SEGMENTS } from "@/constants/segments";
import { useAuth } from "@/context/AuthProvider";

type BillingUnit = "unit" | "hour" | "monthly" | "package" | "project" | "daily" | "other";

const billingUnits: Array<{ value: BillingUnit; label: string }> = [
  { value: "unit", label: "Unidade" },
  { value: "hour", label: "Hora" },
  { value: "monthly", label: "Mensalidade" },
  { value: "package", label: "Pacote" },
  { value: "project", label: "Projeto" },
  { value: "daily", label: "Diária" },
  { value: "other", label: "Outro" }
];

export function CatalogClient() {
  const { user } = useAuth();
  const canManage = user?.role === "owner" || user?.role === "admin";
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "form">("list");
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [filters, setFilters] = useState({ type: "", category: "", status: "", billingUnit: "" });

  useEffect(() => {
    refresh();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filters.type && item.type !== filters.type) return false;
      if (filters.category && item.category !== filters.category) return false;
      if (filters.status && item.status !== filters.status) return false;
      if (filters.billingUnit && (item.billing_unit || item.unit_measure || "") !== filters.billingUnit) return false;
      return true;
    });
  }, [filters, items]);

  async function refresh() {
    setLoading(true);
    try {
      setItems(await getCatalogItems());
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao carregar catálogo.");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage) {
      setMessage("Somente owner/admin pode criar ou editar produtos/serviços.");
      return;
    }
    const form = new FormData(event.currentTarget);
    const text = (name: string) => String(form.get(name) || "").trim();
    const num = (name: string) => Number(form.get(name) || 0);
    const payload = {
      code: text("code") || undefined,
      name: text("name"),
      commercialName: text("commercialName"),
      category: text("category"),
      subcategory: text("subcategory"),
      brand: text("brand"),
      type: text("type") as "product" | "service",
      status: text("status") as "active" | "inactive",
      descriptionShort: text("descriptionShort"),
      descriptionFull: text("descriptionFull"),
      commercialGuidance: text("commercialGuidance"),
      cost: num("cost"),
      price: num("price"),
      maxDiscountPct: num("maxDiscountPct"),
      paymentConditions: text("paymentConditions"),
      paymentMethod: text("paymentMethod"),
      unitMeasure: text("unitMeasure"),
      billingUnit: text("billingUnit") as BillingUnit,
      executionTime: text("executionTime"),
      deliveryDays: num("deliveryDays"),
      internalNotes: text("internalNotes"),
      scope: text("scope"),
      deliverables: text("deliverables"),
      limitations: text("limitations"),
      marketSegment: text("marketSegment")
    };
    try {
      if (editing) await updateCatalogItem(editing.id, payload);
      else await createCatalogItem(payload);
      event.currentTarget.reset();
      setEditing(null);
      setView("list");
      await refresh();
      setMessage(editing ? "Produto/serviço atualizado." : "Produto/serviço salvo no catálogo.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao salvar item.");
    }
  }

  async function handleInactive(item: CatalogItem) {
    if (!canManage) {
      setMessage("Somente owner/admin pode inativar produtos/serviços.");
      return;
    }
    try {
      await inactiveCatalogItem(item.id);
      await refresh();
      setMessage("Produto/serviço inativado. Propostas antigas preservam o snapshot.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao inativar item.");
    }
  }

  function openEdit(item: CatalogItem) {
    setEditing(item);
    setView("form");
  }

  function openCreate() {
    setEditing(null);
    setView("form");
  }

  return (
    <main className="space-y-6">
      <section className="rounded-2xl border border-line bg-panel/90 p-6 shadow-glow">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-cyan">
              <PackageOpen className="h-4 w-4" />
              Catálogo comercial
            </p>
            <h1 className="mt-2 text-2xl font-black text-[var(--text-primary)]">Produtos e serviços</h1>
            <p className="text-sm text-[var(--text-secondary)]">Fonte oficial dos itens comerciais usados em propostas, contratos e IA comercial.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={refresh} className="btn-secondary-action px-4 py-2 text-sm">
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </button>
            {canManage && (
              <button
                type="button"
                onClick={() => view === "form" ? setView("list") : openCreate()}
                className={view === "form" ? "btn-secondary-action px-4 py-2 text-sm" : "btn-action px-4 py-2 text-sm"}
              >
                <Plus className="h-4 w-4" />
                {view === "form" ? "Voltar para lista" : "Novo produto/serviço"}
              </button>
            )}
          </div>
        </div>
      </section>

      {!canManage && (
        <p className="rounded-lg border border-cyan/30 bg-cyan/10 px-4 py-3 text-sm text-cyan">
          Seu perfil tem acesso de leitura ao catálogo. Apenas owner/admin cria, edita ou inativa itens.
        </p>
      )}

      {view === "form" && canManage && (
        <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-line bg-panel/80 p-4">
          <CatalogSection title={editing ? "Editar produto/serviço" : "Novo produto/serviço"}>
            <Input name="code" label="Código opcional" defaultValue={editing?.code} placeholder="SRV-0001, PRD-0001 ou MKT-0025" />
            <Select name="type" label="Tipo" defaultValue={editing?.type || "service"} options={[["service", "Serviço"], ["product", "Produto"]]} />
            <Input name="name" label="Nome do produto/serviço" required defaultValue={editing?.name} />
            <Input name="commercialName" label="Nome comercial" defaultValue={editing?.commercial_name} />
            <label className="block">
              <span className="text-xs font-semibold text-slate-400">Categoria</span>
              <select name="category" required defaultValue={editing?.category || ""} className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm">
                <option value="">Categoria</option>
                {SEGMENTS.map((segment) => <option key={segment} value={segment}>{segment}</option>)}
              </select>
            </label>
            <Input name="subcategory" label="Subcategoria" defaultValue={editing?.subcategory} />
            <Select name="status" label="Status" defaultValue={editing?.status || "active"} options={[["active", "Ativo"], ["inactive", "Inativo"]]} />
            <Select name="billingUnit" label="Unidade de cobrança" defaultValue={(editing?.billing_unit || editing?.unit_measure || "unit") as string} options={billingUnits.map((unit) => [unit.value, unit.label])} />
          </CatalogSection>

          <CatalogSection title="Descrição e regras comerciais">
            <Textarea name="descriptionShort" label="Descrição" required defaultValue={editing?.description_short} />
            <Textarea name="commercialGuidance" label="Orientação/instrução comercial" defaultValue={editing?.commercial_guidance || editing?.scope} />
            <Input name="price" label="Preço padrão por unidade/hora/pacote" type="number" step="0.01" required defaultValue={editing?.price} />
            <Input name="cost" label="Custo" type="number" step="0.01" defaultValue={editing?.cost} />
            <Input name="maxDiscountPct" label="Desconto máximo (%)" type="number" step="0.01" defaultValue={editing?.max_discount_pct} />
            <Input name="paymentConditions" label="Condições de pagamento" defaultValue={editing?.payment_conditions} />
            <Input name="paymentMethod" label="Forma de pagamento" defaultValue={editing?.payment_method} />
            <Input name="executionTime" label="Prazo de execução/entrega" defaultValue={editing?.execution_time} />
          </CatalogSection>

          <CatalogSection title="Detalhes internos">
            <Textarea name="descriptionFull" label="Descrição completa" defaultValue={editing?.description_full} />
            <Textarea name="deliverables" label="Entregáveis" defaultValue={editing?.deliverables} />
            <Textarea name="limitations" label="Limitações" defaultValue={editing?.limitations} />
            <Textarea name="internalNotes" label="Observações internas" defaultValue={editing?.internal_notes} />
            <Input name="unitMeasure" label="Unidade legada/medida" defaultValue={editing?.unit_measure} />
            <Input name="deliveryDays" label="Prazo entrega (dias)" type="number" defaultValue={editing?.delivery_days} />
            <Input name="marketSegment" label="Segmento de mercado" defaultValue={editing?.market_segment} />
            <Input name="brand" label="Marca/Fornecedor" defaultValue={editing?.brand || editing?.supplier} />
          </CatalogSection>

          <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan to-electric px-5 py-3 text-sm font-black text-white shadow-glow">
            <Plus className="h-4 w-4" />
            {editing ? "Salvar alterações" : "Salvar item"}
          </button>
        </form>
      )}

      {message && <p className="rounded-lg border border-cyan/30 bg-cyan/10 px-4 py-3 text-sm text-cyan">{message}</p>}

      <section className="rounded-2xl border border-line bg-panel/80 p-4">
        <div className="mb-4 flex items-center gap-2 text-sm font-bold text-white">
          <SlidersHorizontal className="h-4 w-4 text-cyan" />
          Filtros
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <FilterSelect label="Tipo" value={filters.type} onChange={(type) => setFilters((current) => ({ ...current, type }))} options={[["", "Todos"], ["service", "Serviço"], ["product", "Produto"]]} />
          <FilterSelect label="Categoria" value={filters.category} onChange={(category) => setFilters((current) => ({ ...current, category }))} options={[["", "Todas"], ...SEGMENTS.map((segment) => [segment, segment] as [string, string])]} />
          <FilterSelect label="Status" value={filters.status} onChange={(status) => setFilters((current) => ({ ...current, status }))} options={[["", "Todos"], ["active", "Ativo"], ["inactive", "Inativo"]]} />
          <FilterSelect label="Unidade" value={filters.billingUnit} onChange={(billingUnit) => setFilters((current) => ({ ...current, billingUnit }))} options={[["", "Todas"], ...billingUnits.map((unit) => [unit.value, unit.label] as [string, string])]} />
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-line bg-panel/80">
        <div className="border-b border-line px-4 py-3">
          <h2 className="font-bold text-white">Itens cadastrados</h2>
        </div>
        {loading ? (
          <p className="p-4 text-sm text-slate-400">Carregando...</p>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 text-center">
            <PackageOpen className="mx-auto h-9 w-9 text-cyan" />
            <p className="mt-3 text-sm font-semibold text-[var(--text-primary)]">Nenhum item encontrado.</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">Ajuste os filtros ou cadastre um produto/serviço.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-white/5 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">Imagem</th>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Unidade</th>
                  <th className="px-4 py-3">Preço</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-t border-line">
                    <td className="px-4 py-3">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-line bg-ink">
                        {item.image_url ? <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" /> : <ImageIcon className="h-5 w-5 text-cyan" />}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-cyan">{item.code}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-white">{item.name}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-400">{item.description_short}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{item.type === "service" ? "Serviço" : "Produto"}</td>
                    <td className="px-4 py-3 text-slate-300">{item.category}</td>
                    <td className="px-4 py-3 text-slate-300">{unitLabel(item.billing_unit || item.unit_measure)}</td>
                    <td className="px-4 py-3 text-slate-300">{money(item.price)}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-bold ${item.status === "active" ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-500/15 text-slate-300"}`}>{item.status === "active" ? "Ativo" : "Inativo"}</span></td>
                    <td className="px-4 py-3">
                      {canManage ? (
                        <div className="flex gap-2">
                          <button type="button" onClick={() => openEdit(item)} className="rounded-lg border border-line p-2 text-slate-300 hover:border-cyan hover:text-cyan" title="Editar">
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={() => handleInactive(item)} className="rounded-lg border border-line p-2 text-slate-300 hover:border-rose-400 hover:text-rose-300" title="Inativar">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">Somente leitura</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function CatalogSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-ink/70 p-4">
      <h2 className="text-sm font-black text-white">{title}</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{children}</div>
    </section>
  );
}

function Input({ name, label, type = "text", required, step, placeholder, defaultValue }: { name: string; label: string; type?: string; required?: boolean; step?: string; placeholder?: string; defaultValue?: string | number | null }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-400">{label}</span>
      <input name={name} type={type} required={required} step={step} placeholder={placeholder} defaultValue={defaultValue ?? ""} className="mt-1 w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-electric" />
    </label>
  );
}

function Select({ name, label, defaultValue, options }: { name: string; label: string; defaultValue?: string; options: Array<[string, string]> }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-400">{label}</span>
      <select name={name} defaultValue={defaultValue} className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm">
        {options.map(([value, labelText]) => <option key={value} value={value}>{labelText}</option>)}
      </select>
    </label>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<[string, string]> }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-400">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm">
        {options.map(([optionValue, labelText]) => <option key={optionValue || labelText} value={optionValue}>{labelText}</option>)}
      </select>
    </label>
  );
}

function Textarea({ name, label, required, defaultValue }: { name: string; label: string; required?: boolean; defaultValue?: string | null }) {
  const [value, setValue] = useState(defaultValue || "");
  return (
    <label className="block md:col-span-2">
      <span className="text-xs font-semibold text-slate-400">{label}</span>
      <input type="hidden" name={name} value={value} required={required} />
      <div className="mt-1"><RichTextEditor value={value} onChange={setValue} minHeight={150} /></div>
    </label>
  );
}

function money(value?: number | null) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function unitLabel(value?: string | null) {
  return billingUnits.find((unit) => unit.value === value)?.label || value || "Unidade";
}
