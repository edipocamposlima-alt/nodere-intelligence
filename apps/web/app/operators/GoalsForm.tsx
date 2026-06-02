"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setOperatorGoals } from "@/lib/api";
import type { OperatorGoal, OperatorMetrics } from "@/lib/types";

export function GoalsForm({ op, goal }: { op: OperatorMetrics; goal: OperatorGoal | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    targetSearches: goal?.targetSearches ?? 20,
    targetContacts: goal?.targetContacts ?? 15,
    targetDeals: goal?.targetDeals ?? 3,
    targetRevenueBRL: goal?.targetRevenueBRL ?? 36000
  });

  async function handleSave() {
    setSaving(true);
    try {
      await setOperatorGoals(op.operatorId, form);
      setOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded px-2 py-1 text-xs text-slate-400 hover:text-cyan hover:bg-white/[0.05] transition"
      >
        Editar metas
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl border border-line bg-ink p-6 shadow-xl">
            <h3 className="mb-4 text-base font-semibold text-white">Metas — {op.operatorName}</h3>
            <div className="space-y-3">
              {([
                ["targetSearches", "Buscas/mês"],
                ["targetContacts", "Contatos/mês"],
                ["targetDeals", "Negócios fechados"],
                ["targetRevenueBRL", "Receita (R$)"]
              ] as [keyof typeof form, string][]).map(([key, label]) => (
                <div key={key}>
                  <label className="mb-1 block text-xs text-slate-400">{label}</label>
                  <input
                    type="number"
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-line bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-cyan"
                  />
                </div>
              ))}
            </div>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg border border-line px-4 py-2 text-sm text-slate-400 hover:text-white transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-lg bg-cyan px-4 py-2 text-sm font-semibold text-ink transition hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
