"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { updatePasswordWithRecoveryToken } from "@/lib/supabaseAuthRest";

function readRecoveryToken() {
  if (typeof window === "undefined") return "";
  const hash = window.location.hash.replace(/^#/, "");
  const hashParams = new URLSearchParams(hash);
  const queryParams = new URLSearchParams(window.location.search);
  return hashParams.get("access_token") || queryParams.get("access_token") || "";
}

export function ResetPasswordClient() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setToken(readRecoveryToken());
  }, []);

  const canSubmit = useMemo(() => password.length >= 8 && password === confirm && Boolean(token), [password, confirm, token]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!token) {
      setError("Token de recuperação ausente ou expirado. Solicite um novo link em Esqueci minha senha.");
      return;
    }
    if (password.length < 8) {
      setError("A nova senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("A confirmação precisa ser igual à nova senha.");
      return;
    }
    setLoading(true);
    try {
      await updatePasswordWithRecoveryToken(token, password);
      setMessage("Senha atualizada com sucesso. Você já pode entrar no NODERE.");
      setPassword("");
      setConfirm("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível atualizar a senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-ink px-5 py-10">
      <section className="mx-auto max-w-md rounded-xl border border-line bg-panel/95 p-6 shadow-glow">
        <div className="mb-6 flex justify-center">
          <Image src="/logo-noderi-full.png" alt="NODERE" width={360} height={120} priority className="h-auto w-full max-w-xs rounded-xl object-contain" />
        </div>
        <h1 className="text-xl font-semibold text-white">Redefinir senha</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Crie uma nova senha para voltar ao NODERE. Por segurança, o link de recuperação expira automaticamente.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm text-slate-300">Nova senha</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-lg border border-line bg-ink px-3 text-sm text-white outline-none focus:border-electric"
              autoComplete="new-password"
            />
          </label>
          <label className="block">
            <span className="text-sm text-slate-300">Confirmar senha</span>
            <input
              type="password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-lg border border-line bg-ink px-3 text-sm text-white outline-none focus:border-electric"
              autoComplete="new-password"
            />
          </label>
          {error && <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-red-300">{error}</p>}
          {message && <p className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-emerald-200">{message}</p>}
          <button
            disabled={loading || !canSubmit}
            className="w-full rounded-lg bg-electric px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Atualizando..." : "Atualizar senha"}
          </button>
          <Link href="/login" className="block text-center text-sm text-cyan hover:text-white">
            Voltar para login
          </Link>
        </form>
      </section>
    </main>
  );
}
