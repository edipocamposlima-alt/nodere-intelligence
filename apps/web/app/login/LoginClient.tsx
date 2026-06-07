"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { getApiBaseUrl } from "@/lib/apiBase";
import { setAdminToken } from "@/lib/adminAuth";
import { hasSupabaseAuthConfig, sendPasswordRecovery, signInWithPassword } from "@/lib/supabaseAuthRest";

export function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    try {
      if (hasSupabaseAuthConfig()) {
        const auth = await signInWithPassword(email, password);
        if (!auth.access_token) throw new Error("Supabase não retornou token de sessão.");
        setAdminToken(auth.access_token);
        localStorage.setItem("nodere_user_profile", JSON.stringify({
          email,
          name: auth.user?.email ? formatDisplayName(auth.user.email) : formatDisplayName(email)
        }));
        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ access_token: auth.access_token })
        });
        router.push(searchParams.get("next") || "/");
        return;
      }

      const response = await fetch(`${getApiBaseUrl()}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "Não foi possível entrar.");
      setAdminToken(payload.token);
      localStorage.setItem("nodere_user_profile", JSON.stringify({
        email: payload.user?.email || email,
        name: payload.user?.name || formatDisplayName(payload.user?.email || email),
        role: payload.user?.role
      }));
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: payload.token })
      });
      router.push(searchParams.get("next") || "/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login.");
    } finally {
      setLoading(false);
    }
  }

  async function recoverPassword() {
    setLoading(true);
    setError("");
    setNotice("");
    try {
      if (!email.trim()) throw new Error("Informe seu e-mail para receber a recuperação de senha.");
      const result = await sendPasswordRecovery(email);
      setNotice(result.message || "E-mail de recuperação enviado.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar recuperação.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-gray-950 px-5 py-10 text-white">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950/92 p-6 shadow-glow">
        <div className="mb-7 flex justify-center">
          <Image src="/nodere-wordmark.png" alt="NODERE" width={360} height={120} priority className="h-auto w-full max-w-xs object-contain" />
        </div>
        <h1 className="text-center text-2xl font-semibold text-white">Entrar no NODERE</h1>
        <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-200">E-mail</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              required
              autoComplete="email"
              className="mt-2 min-h-12 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white outline-none focus:border-[#1E6FDB]"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-200">Senha</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              required
              autoComplete="current-password"
              className="mt-2 min-h-12 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white outline-none focus:border-[#1E6FDB]"
            />
          </label>
          {error && <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>}
          {notice && <p className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{notice}</p>}
          <button disabled={loading} className="min-h-12 w-full rounded-lg bg-[#1E6FDB] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1557B0] disabled:opacity-60">
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <div className="mt-5 space-y-3 text-center text-sm">
          <button type="button" onClick={recoverPassword} className="block w-full text-cyan hover:text-white">
            Esqueci minha senha
          </button>
          <Link href="/register" className="block text-slate-300 hover:text-white">
            Criar conta
          </Link>
        </div>
        <footer className="mt-7 text-center text-xs text-slate-500">
          <Link href="/terms" className="hover:text-cyan">Termos de uso</Link>
          <span className="px-2">·</span>
          <Link href="/privacy" className="hover:text-cyan">Política de privacidade</Link>
        </footer>
      </section>
    </main>
  );
}

function formatDisplayName(email: string) {
  const raw = String(email || "Usuário").split("@")[0].replace(/[._-]+/g, " ");
  return raw.split(" ").filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(" ") || "Usuário";
}
