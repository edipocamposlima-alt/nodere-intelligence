"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://nodere-api.onrender.com/api";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", company: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao criar conta. Tente novamente.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="grid min-h-screen place-items-center bg-ink p-4 text-white">
        <div className="w-full max-w-md rounded-lg border border-line bg-panel p-6 text-center shadow-glow">
          <h1 className="text-2xl font-bold">Verifique seu e-mail</h1>
          <p className="mt-3 text-sm text-slate-300">
            Enviamos um link de confirmação para <strong>{form.email}</strong>.
          </p>
          <p className="mt-2 text-sm text-slate-300">Confirme seu cadastro para acessar o NODERE Nexus.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-ink p-4 text-white">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 rounded-lg border border-line bg-panel p-6 shadow-glow">
        <div>
          <h1 className="text-2xl font-bold">Criar conta grátis</h1>
          <p className="mt-1 text-sm text-slate-400">14 dias grátis. Sem cartão de crédito.</p>
        </div>
        {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}
        <input required placeholder="Seu nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-line bg-ink px-3 py-3 text-sm outline-none" />
        <input required type="email" placeholder="E-mail profissional" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-line bg-ink px-3 py-3 text-sm outline-none" />
        <input placeholder="Nome da empresa (opcional)" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="w-full rounded-lg border border-line bg-ink px-3 py-3 text-sm outline-none" />
        <input required type="password" placeholder="Senha (mín. 8 caracteres)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-lg border border-line bg-ink px-3 py-3 text-sm outline-none" />
        <p className="text-xs text-slate-400">
          Ao criar sua conta, você concorda com os <Link href="/termos" className="text-cyan">Termos de Uso</Link> e a <Link href="/privacidade" className="text-cyan">Política de Privacidade</Link>.
        </p>
        <button type="submit" disabled={loading} className="w-full rounded-lg bg-electric px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60">
          {loading ? "Criando conta..." : "Começar grátis"}
        </button>
        <p className="text-center text-sm text-slate-300">Já tem conta? <Link href="/app/login" className="text-cyan">Entrar</Link></p>
      </form>
    </main>
  );
}
