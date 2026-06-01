"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { getApiBaseUrl } from "@/lib/apiBase";
import { setAdminToken } from "@/lib/adminAuth";

export function LoginClient() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@nodere.com.br");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${getApiBaseUrl()}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "Nao foi possivel entrar.");
      setAdminToken(payload.token);
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-5 py-10 lg:grid-cols-[1.1fr_0.9fr]">
        <section>
          <div className="inline-flex rounded-3xl border border-electric/30 bg-electric/10 p-4 shadow-glow">
            <Image src="/nodere-wordmark.png" alt="NODERE" width={520} height={180} priority className="h-auto w-full max-w-xl rounded-2xl object-contain" />
          </div>
          <h1 className="mt-8 max-w-2xl text-4xl font-semibold tracking-tight text-white md:text-5xl">
            Administração NODERE
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-400">
            Entre como administrador para validar integrações, cadastrar APIs operacionais e acompanhar o status seguro do backend.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-line bg-white/5 px-4 py-2 text-sm text-slate-300">
            <ShieldCheck className="h-4 w-4 text-cyan" />
            Chaves completas nunca são exibidas novamente na interface.
          </div>
        </section>

        <section className="rounded-xl border border-line bg-panel/95 p-6 shadow-glow">
          <h2 className="text-xl font-semibold text-white">Login administrador</h2>
          <p className="mt-1 text-sm text-slate-400">Use o e-mail e senha configurados no Render.</p>
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
            <button disabled={loading} className="w-full rounded-lg bg-electric px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60">
              {loading ? "Entrando..." : "Entrar como administrador"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
