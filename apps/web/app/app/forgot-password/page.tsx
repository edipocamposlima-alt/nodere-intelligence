"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://nodere-api.onrender.com/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
    } finally {
      setSent(true);
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <main className="grid min-h-screen place-items-center bg-ink p-4 text-white">
        <div className="w-full max-w-md rounded-lg border border-line bg-panel p-6 text-center shadow-glow">
          <h1 className="text-2xl font-bold">Verifique seu e-mail</h1>
          <p className="mt-3 text-sm text-slate-300">Se o e-mail existir, você receberá o link de redefinição.</p>
          <Link href="/app/login" className="mt-6 inline-flex text-sm font-semibold text-cyan">Voltar ao login</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-ink p-4 text-white">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 rounded-lg border border-line bg-panel p-6 shadow-glow">
        <h1 className="text-2xl font-bold">Recuperar senha</h1>
        <input required type="email" placeholder="Seu e-mail" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-line bg-ink px-3 py-3 text-sm outline-none" />
        <button type="submit" disabled={loading} className="w-full rounded-lg bg-electric px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60">
          {loading ? "Enviando..." : "Enviar link de recuperação"}
        </button>
        <Link href="/app/login" className="block text-sm text-cyan">Voltar ao login</Link>
      </form>
    </main>
  );
}
