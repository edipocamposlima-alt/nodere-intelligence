"use client";

import { Search } from "lucide-react";
import { FormEvent, useState } from "react";
import { discoverySearch } from "@/lib/api";
import { Company } from "@/lib/types";

export function DiscoverySearch({ onResults }: { onResults: (companies: Company[], warning?: string) => void }) {
  const [segment, setSegment] = useState("clínica odontológica");
  const [city, setCity] = useState("Caxias do Sul");
  const [state, setState] = useState("RS");
  const [limit, setLimit] = useState(12);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await discoverySearch({ segment, city, state, limit });
      onResults(data.companies, data.warning);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha na busca Discovery.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-lg border border-slate-800 bg-slate-900/80 p-4 md:grid-cols-[1fr_1fr_96px_130px]">
      <label className="grid gap-1 text-sm">
        <span className="font-semibold text-slate-200">Segmento</span>
        <input value={segment} onChange={(e) => setSegment(e.target.value)} className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-blue-400" />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-semibold text-slate-200">Cidade</span>
        <input value={city} onChange={(e) => setCity(e.target.value)} className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-blue-400" />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-semibold text-slate-200">UF</span>
        <input value={state} onChange={(e) => setState(e.target.value)} maxLength={2} className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-blue-400" />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-semibold text-slate-200">Limite</span>
        <input type="number" min={1} max={100} value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-blue-400" />
      </label>
      <div className="md:col-span-4">
        <button disabled={busy} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60">
          <Search className="h-4 w-4" /> {busy ? "Buscando..." : "Buscar no Google Maps"}
        </button>
        {error && <span className="ml-3 text-sm text-red-300">{error}</span>}
      </div>
    </form>
  );
}
