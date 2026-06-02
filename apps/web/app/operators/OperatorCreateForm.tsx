"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, UserPlus } from "lucide-react";
import { createOperator } from "@/lib/api";

export function OperatorCreateForm() {
  const router = useRouter();
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
      setMessage("Operador criado. Ranking e metas foram recalculados.");
      event.currentTarget.reset();
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível criar operador.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-cyan/30 bg-gradient-to-br from-cyan/15 via-panel to-indigo-500/10 p-5 shadow-[0_18px_50px_rgba(34,211,238,0.08)]">
      <div className="flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan to-blue-500 text-white shadow-[0_0_24px_rgba(34,211,238,0.28)]">
          <UserPlus className="h-5 w-5" />
        </span>
        <h3 className="font-semibold text-white">Cadastrar operador</h3>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_180px_auto]">
        <input name="name" required placeholder="Nome do operador" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-electric" />
        <input name="email" type="email" placeholder="E-mail" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-electric" />
        <select name="role" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-electric">
          <option value="operator">Operador</option>
          <option value="admin">Admin</option>
        </select>
        <button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(34,211,238,0.20)] disabled:opacity-60">
          <Plus className="h-4 w-4" />
          {saving ? "Salvando" : "Criar"}
        </button>
      </div>
      {message && <p className="mt-3 text-sm text-slate-400">{message}</p>}
    </form>
  );
}
