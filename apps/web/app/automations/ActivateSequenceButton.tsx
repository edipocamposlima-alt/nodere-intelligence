"use client";

import { useState } from "react";
import { Loader2, Play } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://nodere-api.onrender.com/api";

export function ActivateSequenceButton({ templateId, templateName }: { templateId: string; templateName: string }) {
  const [companyId, setCompanyId] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function activate() {
    if (!companyId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/companies/${companyId.trim()}/sequences`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId })
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message ?? "Erro ao ativar");
      }
      setDone(true);
      setCompanyId("");
      setTimeout(() => setDone(false), 3000);
    } catch (err: any) {
      setError(err.message ?? "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 space-y-2">
      <input
        type="text"
        value={companyId}
        onChange={(e) => setCompanyId(e.target.value)}
        placeholder="ID da empresa"
        className="w-full rounded-md border border-line bg-ink px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:border-cyan focus:outline-none"
      />
      <button
        onClick={activate}
        disabled={loading || !companyId.trim()}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-electric/30 bg-electric/10 px-3 py-1.5 text-xs font-semibold text-blue-300 transition hover:bg-electric/20 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
        {done ? "Ativada!" : `Ativar ${templateName}`}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
