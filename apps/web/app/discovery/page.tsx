"use client";

import { useState } from "react";
import { CompanyMap } from "@/components/discovery/CompanyMap";
import { DiscoveryResults } from "@/components/discovery/DiscoveryResults";
import { DiscoverySearch } from "@/components/discovery/DiscoverySearch";
import { Company } from "@/lib/types";

export default function DiscoveryPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selected, setSelected] = useState<Company | null>(null);
  const [warning, setWarning] = useState("");

  return (
    <main className="min-h-screen bg-[var(--bg-main)] p-4 text-[var(--text-primary)] md:p-6">
      <div className="mx-auto grid max-w-7xl gap-5">
        <header className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] p-4 md:p-5">
          <p className="text-xs font-black uppercase tracking-wide text-[var(--brand-primary)]">Discovery</p>
          <h1 className="mt-1 text-2xl font-black md:text-3xl">Prospecção Google Maps e CRM</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            Encontre empresas, analise presença digital, detecte oportunidades e envie leads qualificados para o CRM.
          </p>
        </header>

        <DiscoverySearch
          onResults={(next, nextWarning) => {
            setCompanies(next);
            setSelected(next[0] ?? null);
            setWarning(nextWarning || "");
          }}
        />

        {warning && <div className="rounded-lg border border-amber-400/40 bg-amber-500/10 p-3 text-sm text-amber-100">{warning}</div>}

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="min-w-0">
            <DiscoveryResults companies={companies} onSelect={setSelected} />
          </div>
          <div className="xl:sticky xl:top-4 xl:self-start">
            <CompanyMap company={selected} />
          </div>
        </section>
      </div>
    </main>
  );
}
