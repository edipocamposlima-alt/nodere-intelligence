"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import { ImageIcon, PackageOpen, Plus, Upload } from "lucide-react";
import { CatalogItem, createCatalogItem, getCatalogItems } from "@/lib/api";
import { RichTextEditor } from "@/components/RichTextEditor";
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
    const text = (name: string) => String(form.get(name) || "").trim();
    const num = (name: string) => Number(form.get(name) || 0);
    try {
      const created = await createCatalogItem({
        code: text("code") || undefined,
        name: text("name"),
        commercialName: text("commercialName"),
        category: text("category"),
        subcategory: text("subcategory"),
        brand: text("brand"),
        type: text("type") as "product" | "service",
        descriptionShort: text("descriptionShort"),
        descriptionFull: text("descriptionFull"),
        features: text("features"),
        benefits: text("benefits"),
        differentials: text("differentials"),
        targetAudience: text("targetAudience"),
        useCases: text("useCases"),
        cost: num("cost"),
        price: num("price"),
        commissionPct: num("commissionPct"),
        maxDiscountPct: num("maxDiscountPct"),
        promotionalPrice: num("promotionalPrice"),
        promotionExpiresAt: text("promotionExpiresAt"),
        supplier: text("supplier"),
        deliveryDays: num("deliveryDays"),
        warranty: text("warranty"),
        exchangePolicy: text("exchangePolicy"),
        cancellationPolicy: text("cancellationPolicy"),
        paymentConditions: text("paymentConditions"),
        installmentsAvailable: num("installmentsAvailable"),
        unitMeasure: text("unitMeasure"),
        weightKg: num("weightKg"),
        heightCm: num("heightCm"),
        widthCm: num("widthCm"),
        lengthCm: num("lengthCm"),
        color: text("color"),
        material: text("material"),
        model: text("model"),
        voltage: text("voltage"),
        technicalSpecs: text("technicalSpecs"),
        executionTime: text("executionTime"),
        scope: text("scope"),
        limitations: text("limitations"),
        deliverables: text("deliverables"),
        complexity: text("complexity"),
        sla: text("sla"),
        stockCurrent: num("stockCurrent"),
        stockMin: num("stockMin"),
        stockMax: num("stockMax"),
        stockLocation: text("stockLocation"),
        marketSegment: text("marketSegment"),
        campaignUrl: text("campaignUrl")
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

      <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-line bg-panel/80 p-4">
        <CatalogSection title="1. Identificação">
          <Input name="code" label="Código opcional" placeholder="SRV-0001, PRD-0001 ou MKT-0025" />
          <label className="block">
            <span className="text-xs font-semibold text-slate-400">Tipo</span>
            <select name="type" className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm" defaultValue="service">
              <option value="service">Serviço</option>
              <option value="product">Produto</option>
            </select>
          </label>
          <Input name="name" label="Nome do produto/serviço" required />
          <Input name="commercialName" label="Nome comercial" />
          <label className="block">
            <span className="text-xs font-semibold text-slate-400">Categoria</span>
            <select name="category" required className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm">
              <option value="">Categoria</option>
              {SEGMENTS.map((segment) => <option key={segment} value={segment}>{segment}</option>)}
            </select>
          </label>
          <Input name="subcategory" label="Subcategoria" />
          <Input name="brand" label="Marca" />
          <label className="block xl:col-span-2">
            <span className="text-xs font-semibold text-slate-400">Imagem principal</span>
            <span className="mt-1 flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-cyan/40 bg-cyan/5 px-3 py-3 text-sm font-semibold text-cyan hover:bg-cyan/10">
              <Upload className="h-4 w-4" /> Enviar imagem do produto/serviço
              <input name="image" type="file" accept="image/*" className="hidden" />
            </span>
          </label>
        </CatalogSection>

        <CatalogSection title="2. Descrição e marketing">
          <Textarea name="descriptionShort" label="Descrição resumida" required />
          <Textarea name="descriptionFull" label="Descrição completa" />
          <Textarea name="features" label="Principais características" />
          <Textarea name="benefits" label="Benefícios" />
          <Textarea name="differentials" label="Diferenciais competitivos" />
          <Textarea name="targetAudience" label="Público-alvo" />
          <Textarea name="useCases" label="Aplicações de uso" />
          <Input name="marketSegment" label="Segmento de mercado" />
          <Input name="campaignUrl" label="URL da página/campanha" />
        </CatalogSection>

        <CatalogSection title="3. Precificação e comercial">
          <Input name="cost" label="Custo" type="number" step="0.01" />
          <Input name="price" label="Preço de venda" type="number" step="0.01" />
          <Input name="commissionPct" label="Comissão (%)" type="number" step="0.01" />
          <Input name="maxDiscountPct" label="Desconto máximo (%)" type="number" step="0.01" />
          <Input name="promotionalPrice" label="Preço promocional" type="number" step="0.01" />
          <Input name="promotionExpiresAt" label="Vigência promoção" type="date" />
          <Input name="supplier" label="Fornecedor" />
          <Input name="deliveryDays" label="Prazo entrega (dias)" type="number" />
          <Input name="warranty" label="Garantia" />
          <Input name="paymentConditions" label="Condições de pagamento" />
          <Input name="installmentsAvailable" label="Parcelas disponíveis" type="number" />
          <Textarea name="exchangePolicy" label="Política de troca" />
          <Textarea name="cancellationPolicy" label="Política de cancelamento" />
        </CatalogSection>

        <CatalogSection title="4. Técnico, serviço e estoque">
          <Input name="unitMeasure" label="Unidade de medida" />
          <Input name="weightKg" label="Peso kg" type="number" step="0.01" />
          <Input name="heightCm" label="Altura cm" type="number" step="0.01" />
          <Input name="widthCm" label="Largura cm" type="number" step="0.01" />
          <Input name="lengthCm" label="Comprimento cm" type="number" step="0.01" />
          <Input name="color" label="Cor" />
          <Input name="material" label="Material" />
          <Input name="model" label="Modelo" />
          <Input name="voltage" label="Voltagem" />
          <Textarea name="technicalSpecs" label="Especificações técnicas" />
          <Input name="executionTime" label="Tempo médio de execução" />
          <Textarea name="scope" label="Escopo do serviço" />
          <Textarea name="limitations" label="Limitações do serviço" />
          <Textarea name="deliverables" label="Entregáveis" />
          <Input name="complexity" label="Complexidade" />
          <Input name="sla" label="SLA / prazo de atendimento" />
          <Input name="stockCurrent" label="Estoque atual" type="number" />
          <Input name="stockMin" label="Estoque mínimo" type="number" />
          <Input name="stockMax" label="Estoque máximo" type="number" />
          <Input name="stockLocation" label="Localização no estoque" />
        </CatalogSection>

        <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan to-electric px-5 py-3 text-sm font-black text-white shadow-glow">
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
                  <th className="px-4 py-3">Imagem</th>
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
                    <td className="px-4 py-3">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-line bg-ink">
                        {item.image_url ? <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" /> : <ImageIcon className="h-5 w-5 text-cyan" />}
                      </div>
                    </td>
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

function CatalogSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-ink/70 p-4">
      <h2 className="text-sm font-black text-white">{title}</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{children}</div>
    </section>
  );
}

function Input({ name, label, type = "text", required, step, placeholder }: { name: string; label: string; type?: string; required?: boolean; step?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-400">{label}</span>
      <input name={name} type={type} required={required} step={step} placeholder={placeholder} className="mt-1 w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-electric" />
    </label>
  );
}

function Textarea({ name, label, required }: { name: string; label: string; required?: boolean }) {
  const [value, setValue] = useState("");
  return (
    <label className="block md:col-span-2">
      <span className="text-xs font-semibold text-slate-400">{label}</span>
      <input type="hidden" name={name} value={value} required={required} />
      <div className="mt-1"><RichTextEditor value={value} onChange={setValue} minHeight={150} /></div>
    </label>
  );
}


