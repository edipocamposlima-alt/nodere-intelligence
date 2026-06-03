"use client";

import { FormEvent, useEffect, useState } from "react";
import { PackageOpen, Plus } from "lucide-react";
import { CatalogItem, createCatalogItem, getCatalogItems } from "@/lib/api";
import { SEGMENTS } from "@/constants/segments";

export function CatalogClient() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refresh();
  }, []);

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
    const form = new FormData(event.currentTarget);
    try {
      await createCatalogItem({
        code: String(form.get("code") || "").trim() || undefined,
        name: String(form.get("name") || ""),
        commercialName: String(form.get("commercialName") || ""),
        category: String(form.get("category") || ""),
        type: String(form.get("type") || "service") as "product" | "service",
        descriptionShort: String(form.get("descriptionShort") || ""),
        cost: Number(form.get("cost") || 0),
        price: Number(form.get("price") || 0),
        scope: String(form.get("scope") || ""),
        deliverables: String(form.get("deliverables") || ""),
        sla: String(form.get("sla") || ""),
        stockCurrent: Number(form.get("stockCurrent") || 0)
      });
      event.currentTarget.reset();
      await refresh();
      setMessage("Item salvo no catálogo.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao salvar item.");
    }
  }

  return (
    <main className="space-y-6">
      <section className="rounded-2xl border border-line bg-panel/90 p-6 shadow-glow">
        <p className="flex items-center gap-2 text-sm font-semibold text-cyan">
          <PackageOpen className="h-4 w-4" />
          Catálogo comercial
        </p>
        <h1 className="mt-2 text-2xl font-black text-white">Produtos e serviços</h1>
        <p className="text-sm text-slate-300">Cadastre ofertas reais para usar em propostas, contratos e IA comercial.</p>
      </section>

      <form onSubmit={onSubmit} className="grid gap-3 rounded-2xl border border-line bg-panel/80 p-4 md:grid-cols-4">
        <input name="code" placeholder="Código opcional" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
        <select name="type" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm" defaultValue="service">
          <option value="service">Serviço</option>
          <option value="product">Produto</option>
        </select>
        <input name="name" required placeholder="Nome" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
        <input name="commercialName" placeholder="Nome comercial" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
        <select name="category" required className="rounded-lg border border-line bg-ink px-3 py-2 text-sm">
          <option value="">Categoria</option>
          {SEGMENTS.map((segment) => <option key={segment} value={segment}>{segment}</option>)}
        </select>
        <input name="cost" type="number" min="0" step="0.01" placeholder="Custo" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
        <input name="price" type="number" min="0" step="0.01" placeholder="Preço" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
        <input name="stockCurrent" type="number" min="0" placeholder="Estoque atual" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
        <textarea name="descriptionShort" required placeholder="Descrição curta" className="md:col-span-2 min-h-20 rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
        <textarea name="scope" placeholder="Escopo" className="md:col-span-2 min-h-20 rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
        <textarea name="deliverables" placeholder="Entregáveis" className="md:col-span-2 min-h-20 rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
        <textarea name="sla" placeholder="SLA / prazo / condições" className="md:col-span-2 min-h-20 rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
        <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-electric px-4 py-2 text-sm font-bold text-white">
          <Plus className="h-4 w-4" />
          Salvar item
        </button>
      </form>

      {message && <p className="rounded-lg border border-cyan/30 bg-cyan/10 px-4 py-3 text-sm text-cyan">{message}</p>}

      <section className="overflow-hidden rounded-2xl border border-line bg-panel/80">
        <div className="border-b border-line px-4 py-3">
          <h2 className="font-bold text-white">Itens cadastrados</h2>
        </div>
        {loading ? (
          <p className="p-4 text-sm text-slate-400">Carregando...</p>
        ) : items.length === 0 ? (
          <p className="p-4 text-sm text-slate-400">Nenhum item cadastrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-white/5 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Preço</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-line">
                    <td className="px-4 py-3 font-mono text-cyan">{item.code}</td>
                    <td className="px-4 py-3 font-semibold text-white">{item.name}</td>
                    <td className="px-4 py-3 text-slate-300">{item.type === "service" ? "Serviço" : "Produto"}</td>
                    <td className="px-4 py-3 text-slate-300">{item.category}</td>
                    <td className="px-4 py-3 text-slate-300">{Number(item.price || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-bold text-emerald-300">{item.status}</span></td>
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
