"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, LockKeyhole, Mail, UserRound } from "lucide-react";
import { getApiBaseUrl } from "@/lib/apiBase";
import { setAdminToken } from "@/lib/adminAuth";
import { hasSupabaseAuthConfig, signUpWithPassword } from "@/lib/supabaseAuthRest";

export function RegisterClient() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", workspace: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      if (!hasSupabaseAuthConfig()) {
        throw new Error("Cadastro via Supabase Auth exige NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY configurados na Vercel.");
      }
      const auth = await signUpWithPassword(form.email, form.password, form.name);
      if (!auth.access_token) {
        setMessage("Conta criada. Confirme seu e-mail e depois faça login.");
        return;
      }
      setAdminToken(auth.access_token);
      await fetch("/api/auth/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: auth.access_token }) });
      await fetch(`${getApiBaseUrl()}/workspace`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.access_token}` },
        body: JSON.stringify({ name: form.workspace || "Workspace NODERE" })
      });
      router.push("/dashboard");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao criar conta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-4 py-10">
      <section className="w-full max-w-xl rounded-xl border border-line bg-panel/95 p-6 shadow-glow">
        <h1 className="text-2xl font-semibold text-white">Criar workspace NODERE</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Crie a conta owner da empresa. Usuários, leads, CRM e configurações ficam isolados nesse workspace.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          {[
            { key: "name", label: "Seu nome", icon: UserRound, type: "text" },
            { key: "workspace", label: "Nome da empresa/workspace", icon: Building2, type: "text" },
            { key: "email", label: "E-mail", icon: Mail, type: "email" },
            { key: "password", label: "Senha", icon: LockKeyhole, type: "password" }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <label key={item.key} className="block">
                <span className="text-sm text-slate-300">{item.label}</span>
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-line bg-ink px-3 py-3">
                  <Icon className="h-4 w-4 text-slate-500" />
                  <input
                    required={item.key !== "workspace"}
                    minLength={item.key === "password" ? 8 : undefined}
                    value={form[item.key as keyof typeof form]}
                    onChange={(event) => setForm((current) => ({ ...current, [item.key]: event.target.value }))}
                    type={item.type}
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
              </label>
            );
          })}
          {message && <p className="rounded-lg border border-line bg-ink px-3 py-2 text-sm text-slate-200">{message}</p>}
          <button disabled={loading} className="w-full rounded-lg bg-electric px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60">
            {loading ? "Criando..." : "Criar conta"}
          </button>
          <p className="text-center text-sm text-slate-400">
            Já tem acesso? <Link href="/login" className="text-cyan">Entrar</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
