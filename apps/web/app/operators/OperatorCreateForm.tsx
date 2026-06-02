"use client";

import { FormEvent, useState } from "react";
import { Plus, UserPlus } from "lucide-react";
import { createOperator } from "@/lib/api";

export function OperatorCreateForm() {
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setMessage("");
    try {
      await createOperator({
        name: String(form.get("name") || ""),
        email: String(form.get("email") || ""),
        role: String(form.get("role") || "operator") as "admin" | "operator"
      });
      setMessage("Operador criado. Atualize a página para recalcular ranking/metas.");
      event.currentTarget.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível criar operador.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-line bg-panel/90 p-5">
      <div className="flex items-center gap-2">
        <UserPlus className="h-5 w-5 text-cyan" />
        <h3 className="font-semibold text-white">Cadastrar operador</h3>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_180px_auto]">
        <input name="name" required placeholder="Nome do operador" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-electric" />
        <input name="email" type="email" placeholder="E-mail" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-electric" />
        <select name="role" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-electric">
          <option value="operator">Operador</option>
          <option value="admin">Admin</option>
        </select>
        <button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-electric px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
          <Plus className="h-4 w-4" />
          {saving ? "Salvando" : "Criar"}
        </button>
      </div>
      {message && <p className="mt-3 text-sm text-slate-400">{message}</p>}
    </form>
  );
}
