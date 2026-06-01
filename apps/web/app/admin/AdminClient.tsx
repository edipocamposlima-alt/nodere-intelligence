"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, Copy, KeyRound, LogOut, ShieldCheck } from "lucide-react";
import { adminFetch, clearAdminToken, getAdminToken } from "@/lib/adminAuth";

const fields = [
  "GOOGLE_PLACES_API_KEY",
  "GOOGLE_MAPS_API_KEY",
  "GOOGLE_PAGESPEED_API_KEY",
  "OPENAI_API_KEY",
  "WHATSAPP_CLOUD_TOKEN",
  "WHATSAPP_PHONE_NUMBER_ID",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY"
];

type ApiKeyStatus = { key: string; configured: boolean; source: string; masked: string; updatedAt: string | null };

export function AdminClient() {
  const [authorized, setAuthorized] = useState(false);
  const [keys, setKeys] = useState<ApiKeyStatus[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("Carregando painel administrativo...");
  const [saving, setSaving] = useState(false);

  async function load() {
    if (!getAdminToken()) {
      setMessage("Faça login como administrador.");
      return;
    }
    try {
      await adminFetch("/admin/session");
      const data = await adminFetch<{ keys: ApiKeyStatus[] }>("/admin/api-keys");
      setKeys(data.keys);
      setAuthorized(true);
      setMessage("Painel administrativo conectado.");
    } catch (error) {
      setAuthorized(false);
      setMessage(error instanceof Error ? error.message : "Sessão inválida.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const payload = await adminFetch<{ keys: ApiKeyStatus[]; message: string }>("/admin/api-keys", {
        method: "PATCH",
        body: JSON.stringify({ values })
      });
      setKeys(payload.keys);
      setValues({});
      setMessage(payload.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao salvar chaves.");
    } finally {
      setSaving(false);
    }
  }

  function logout() {
    clearAdminToken();
    location.href = "/login";
  }

  if (!authorized) {
    return (
      <div className="p-4 md:p-8">
        <div className="rounded-xl border border-line bg-panel p-6">
          <p className="text-white">{message}</p>
          <Link href="/login" className="mt-4 inline-flex rounded-lg bg-electric px-4 py-2 text-sm font-semibold text-white">Entrar</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <section className="overflow-hidden rounded-xl border border-electric/30 bg-panel shadow-glow">
        <div className="grid gap-6 p-6 lg:grid-cols-[360px_1fr]">
          <div className="rounded-2xl border border-electric/20 bg-electric/10 p-4">
            <Image src="/nodere-wordmark.png" alt="NODERE" width={500} height={180} priority className="h-auto w-full rounded-xl object-contain" />
          </div>
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-cyan">Modo administrador</p>
                <h1 className="mt-2 text-3xl font-semibold text-white">APIs, integrações e segurança</h1>
              </div>
              <button onClick={logout} className="inline-flex items-center gap-2 rounded-lg border border-line bg-white/5 px-4 py-2 text-sm text-slate-200 hover:text-white">
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
              Use esta área para registrar chaves operacionais e validar o status do backend. Para produção permanente, mantenha as chaves também no Render como variáveis de ambiente.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-line bg-panel/90 p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-cyan" />
          <h2 className="text-lg font-semibold text-white">Status atual</h2>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {keys.map((item) => (
            <div key={item.key} className="rounded-lg border border-line bg-ink p-4">
              <p className="break-all text-xs font-semibold text-slate-300">{item.key}</p>
              <p className={`mt-3 text-sm font-medium ${item.configured ? "text-success" : "text-amber-300"}`}>
                {item.configured ? "Configurada" : "Pendente"}
              </p>
              <p className="mt-1 text-xs text-slate-500">{item.source}</p>
              {item.masked && <p className="mt-2 font-mono text-xs text-cyan">{item.masked}</p>}
            </div>
          ))}
        </div>
      </section>

      <form onSubmit={save} className="rounded-xl border border-line bg-panel/90 p-5">
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-cyan" />
          <h2 className="text-lg font-semibold text-white">Cadastrar ou atualizar APIs</h2>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {fields.map((field) => (
            <label key={field} className="space-y-2 text-sm text-slate-300">
              {field}
              <input
                value={values[field] || ""}
                onChange={(event) => setValues((current) => ({ ...current, [field]: event.target.value }))}
                type="password"
                placeholder="Cole a chave aqui para atualizar"
                className="w-full rounded-lg border border-line bg-ink px-3 py-3 text-sm outline-none focus:border-electric"
              />
            </label>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-electric px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60">
            <CheckCircle2 className="h-4 w-4" />
            {saving ? "Salvando..." : "Salvar APIs"}
          </button>
          <button type="button" onClick={() => navigator.clipboard.writeText("https://nodere-api.onrender.com")} className="inline-flex items-center gap-2 rounded-lg border border-line bg-white/5 px-4 py-3 text-sm text-slate-200">
            <Copy className="h-4 w-4" />
            Copiar URL backend
          </button>
          <span className="text-sm text-slate-400">{message}</span>
        </div>
      </form>
    </div>
  );
}
