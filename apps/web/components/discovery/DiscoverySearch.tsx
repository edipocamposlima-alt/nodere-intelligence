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
    <form onSubmit={submit} className="grid gap-3 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] p-4 md:grid-cols-[1fr_1fr_96px_130px]">
      <label className="grid gap-1 text-sm">
        <span className="font-semibold text-[var(--text-primary)]">Segmento</span>
        <input value={segment} onChange={(e) => setSegment(e.target.value)} className="rounded-md border border-[var(--border-soft)] bg-[var(--bg-hover)] px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)]" />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-semibold text-[var(--text-primary)]">Cidade</span>
        <input value={city} onChange={(e) => setCity(e.target.value)} className="rounded-md border border-[var(--border-soft)] bg-[var(--bg-hover)] px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)]" />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-semibold text-[var(--text-primary)]">UF</span>
        <input value={state} onChange={(e) => setState(e.target.value)} maxLength={2} className="rounded-md border border-[var(--border-soft)] bg-[var(--bg-hover)] px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)]" />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-semibold text-[var(--text-primary)]">Limite</span>
        <input type="number" min={1} max={100} value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="rounded-md border border-[var(--border-soft)] bg-[var(--bg-hover)] px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)]" />
      </label>
      <div className="md:col-span-4">
        <button disabled={busy} className="inline-flex items-center gap-2 rounded-md bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-primary-hover)] disabled:opacity-60">
          <Search className="h-4 w-4" /> {busy ? "Buscando..." : "Buscar no Google Maps"}
        </button>
        {error && <span className="ml-3 text-sm text-[var(--danger)]">{error}</span>}
      </div>
    </form>
  );
}
