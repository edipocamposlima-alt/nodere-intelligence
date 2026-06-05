"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Plus } from "lucide-react";
import { createCompany } from "@/lib/api";
import { SEGMENTS } from "@/constants/segments";

export function ManualCompanyForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(Array.from(form.entries()).map(([key, value]) => [key, String(value).trim()])) as any;
    setSaving(true);
    setMessage("");
    try {
      const company = await createCompany(payload);
      setMessage("Empresa cadastrada e salva no banco.");
      router.push(`/companies/${company.id}`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível cadastrar a empresa.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-line bg-panel/90 p-4 shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-cyan">
            <Building2 className="h-4 w-4" />
            Cadastro manual
          </p>
          <p className="mt-1 text-sm text-slate-400">Crie uma empresa completa sem depender de busca automática.</p>
        </div>
        <button onClick={() => setOpen((value) => !value)} className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan to-electric px-4 py-2 text-sm font-black text-white">
          <Plus className="h-4 w-4" />
          {open ? "Fechar cadastro" : "Nova empresa manual"}
        </button>
      </div>

      {open && (
        <form onSubmit={submit} className="mt-5 space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Input name="name" label="Nome fantasia" required />
            <Input name="legalName" label="Razão social" />
            <Input name="cnpj" label="CNPJ" placeholder="00.000.000/0001-00" />
            <label className="block">
              <span className="text-xs font-semibold text-slate-400">Segmento</span>
              <select name="category" className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm">
                <option value="">Selecione</option>
                {SEGMENTS.map((segment) => <option key={segment}>{segment}</option>)}
              </select>
            </label>
            <Input name="address" label="Endereço completo" />
            <Input name="city" label="Cidade" />
            <Input name="state" label="Estado" />
            <Input name="cep" label="CEP" />
            <Input name="phone" label="Telefone fixo/principal" />
            <Input name="whatsapp" label="WhatsApp celular" />
            <Input name="email" label="E-mail" type="email" />
            <Input name="website" label="Site" />
            <Input name="instagram" label="Instagram" />
            <Input name="facebook" label="Facebook" />
            <Input name="linkedin" label="LinkedIn" />
            <Input name="youtube" label="YouTube" />
            <Input name="principalContact" label="Responsável principal" />
            <Input name="principalContactRole" label="Cargo do responsável" />
            <Input name="serviceInterest" label="Produtos/serviços de interesse" />
            <label className="block">
              <span className="text-xs font-semibold text-slate-400">Temperatura</span>
              <select name="temperature" className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm">
                <option>Frio</option>
                <option>Morno</option>
                <option>Quente</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-400">Status comercial</span>
              <select name="status" className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm">
                <option>Novo Lead</option>
                <option>Qualificação</option>
                <option>Contatado</option>
                <option>Proposta</option>
                <option>Negociação</option>
                <option>Cliente</option>
              </select>
            </label>
            <label className="block md:col-span-2 xl:col-span-4">
              <span className="text-xs font-semibold text-slate-400">Observações</span>
              <textarea name="notes" className="mt-1 min-h-24 w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
            </label>
          </div>
          <button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-electric px-5 py-3 text-sm font-black text-white disabled:opacity-60">
            <Plus className="h-4 w-4" />
            {saving ? "Salvando..." : "Salvar empresa manual"}
          </button>
          {message && <p className="text-sm text-cyan">{message}</p>}
        </form>
      )}
    </section>
  );
}

function Input({ name, label, type = "text", placeholder, required }: { name: string; label: string; type?: string; placeholder?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-400">{label}</span>
      <input name={name} type={type} required={required} placeholder={placeholder} className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm" />
    </label>
  );
}
