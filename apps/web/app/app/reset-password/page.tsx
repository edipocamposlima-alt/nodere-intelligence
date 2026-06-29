"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const supabase = await getSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError("Não foi possível redefinir sua senha. Solicite um novo link.");
        return;
      }
      setMessage("Senha atualizada. Você já pode entrar.");
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-ink p-4 text-white">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 rounded-lg border border-line bg-panel p-6 shadow-glow">
        <h1 className="text-2xl font-bold">Nova senha</h1>
        {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}
        {message && <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{message}</div>}
        <input required minLength={8} type="password" placeholder="Nova senha" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-line bg-ink px-3 py-3 text-sm outline-none" />
        <button type="submit" disabled={loading} className="w-full rounded-lg bg-electric px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60">
          {loading ? "Salvando..." : "Salvar nova senha"}
        </button>
        <Link href="/app/login" className="block text-sm text-cyan">Voltar ao login</Link>
      </form>
    </main>
  );
}
