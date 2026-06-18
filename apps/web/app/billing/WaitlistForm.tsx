"use client";

import { FormEvent, useState } from "react";
import { joinBillingWaitlist } from "@/lib/api";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState<"starter" | "pro" | "agency">("pro");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      await joinBillingWaitlist({ email, plan });
      setMessage("Interesse registrado. A equipe NODERE pode ativar o checkout ou entrar em contato.");
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível registrar o interesse.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-amber-300/30 bg-amber-300/10 p-5">
      <p className="text-sm font-semibold text-amber-100">Planos em breve disponíveis. Entre em contato para upgrade.</p>
      <p className="mt-1 text-sm text-amber-100/80">
        Quando o checkout estiver ativo, os botões mudam automaticamente para assinatura.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_180px_auto]">
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="email@empresa.com.br"
          className="rounded-lg border border-line bg-ink px-3 py-2 text-sm text-white outline-none focus:border-electric"
        />
        <select value={plan} onChange={(event) => setPlan(event.target.value as "starter" | "pro" | "agency")} className="rounded-lg border border-line bg-ink px-3 py-2 text-sm text-white outline-none focus:border-electric">
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="agency">Agency</option>
        </select>
        <button disabled={loading} className="rounded-lg bg-cyan px-4 py-2 text-sm font-semibold text-ink disabled:opacity-60">
          {loading ? "Salvando..." : "Registrar interesse"}
        </button>
      </div>
      {message && <p className="mt-3 text-sm text-emerald-200">{message}</p>}
      {error && <p className="mt-3 text-sm text-rose-200">{error}</p>}
    </form>
  );
}
