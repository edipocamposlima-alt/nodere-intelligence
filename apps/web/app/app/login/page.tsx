"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = await getSupabaseBrowserClient();
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password
      });

      if (loginError) {
        if (loginError.message.includes("Invalid login")) {
          setError("E-mail ou senha incorretos.");
        } else if (loginError.message.includes("Email not confirmed")) {
          setError("Confirme seu e-mail antes de entrar.");
        } else {
          setError("Erro ao entrar. Tente novamente.");
        }
        return;
      }

      router.push("/app/dashboard");
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-ink p-4 text-white">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 rounded-lg border border-line bg-panel p-6 shadow-glow">
        <h1 className="text-2xl font-bold">Entrar no NODERE</h1>
        {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}
        <input required type="email" placeholder="E-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-line bg-ink px-3 py-3 text-sm outline-none" />
        <input required type="password" placeholder="Senha" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-lg border border-line bg-ink px-3 py-3 text-sm outline-none" />
        <Link href="/app/forgot-password" className="block text-sm text-cyan">Esqueci minha senha</Link>
        <button type="submit" disabled={loading} className="w-full rounded-lg bg-electric px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60">
          {loading ? "Entrando..." : "Entrar"}
        </button>
        <p className="text-center text-sm text-slate-300">Não tem conta? <Link href="/app/register" className="text-cyan">Criar conta grátis</Link></p>
      </form>
    </main>
  );
}
