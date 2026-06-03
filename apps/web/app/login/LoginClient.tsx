"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { LockKeyhole, Mail } from "lucide-react";
import { getApiBaseUrl } from "@/lib/apiBase";
import { setAdminToken } from "@/lib/adminAuth";
import { hasSupabaseAuthConfig, sendPasswordRecovery, signInWithPassword } from "@/lib/supabaseAuthRest";

export function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("admin@nodere.com.br");
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
        await fetch("/api/auth/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: auth.access_token }) });
        router.push(searchParams.get("next") || "/");
        return;
      }
      const response = await fetch(`${getApiBaseUrl()}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "Nao foi possivel entrar.");
      setAdminToken(payload.token);
      await fetch("/api/auth/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: payload.token }) });
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
      if (!hasSupabaseAuthConfig()) {
        throw new Error("Recuperação automática exige NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      }
      await sendPasswordRecovery(email);
      setNotice("Enviamos o link de recuperação para o e-mail informado.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar recuperação.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
        <section className="rounded-xl border border-line bg-panel/95 p-6 shadow-glow">
          <div className="mb-6 flex justify-center">
            <Image src="/nodere-wordmark.png" alt="NODERE" width={360} height={120} priority className="h-auto w-full max-w-xs rounded-xl object-contain" />
          </div>
          <h2 className="text-xl font-semibold text-white">Entrar no NODERE</h2>
          <p className="mt-1 text-sm text-slate-400">
            {hasSupabaseAuthConfig() ? "Acesso seguro via Supabase Auth." : "Modo fallback: use o e-mail e senha configurados no Render."}
          </p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm text-slate-300">E-mail</span>
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-line bg-ink px-3 py-3">
                <Mail className="h-4 w-4 text-slate-500" />
                <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="w-full bg-transparent text-sm outline-none" />
              </div>
            </label>
            <label className="block">
              <span className="text-sm text-slate-300">Senha</span>
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-line bg-ink px-3 py-3">
                <LockKeyhole className="h-4 w-4 text-slate-500" />
                <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" className="w-full bg-transparent text-sm outline-none" />
              </div>
            </label>
            {error && <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-red-300">{error}</p>}
            {notice && <p className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-emerald-200">{notice}</p>}
            <button disabled={loading} className="w-full rounded-lg bg-electric px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60">
              {loading ? "Entrando..." : "Entrar"}
            </button>
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <button type="button" onClick={recoverPassword} className="text-cyan hover:text-white">
                Esqueci minha senha
              </button>
              <Link href="/register" className="text-slate-300 hover:text-white">
                Criar conta
              </Link>
            </div>
            <p className="text-xs leading-5 text-slate-500">
              Ao entrar, você concorda com os <Link href="/terms" className="text-cyan">Termos</Link> e a <Link href="/privacy" className="text-cyan">Política de Privacidade</Link>.
            </p>
          </form>
          <div className="mt-6 flex justify-center gap-2 text-xs text-slate-500">
            <Link href="/terms" className="hover:text-cyan">Termos de uso</Link>
            <span>·</span>
            <Link href="/privacy" className="hover:text-cyan">Política de privacidade</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
