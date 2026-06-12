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
    <main className="min-h-screen bg-slate-950 p-4 text-white md:p-8">
      <div className="mx-auto grid max-w-7xl gap-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-300">Discovery</p>
          <h1 className="mt-1 text-2xl font-bold md:text-3xl">Prospecção Google Maps e CRM</h1>
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
          <DiscoveryResults companies={companies} onSelect={setSelected} />
          <div className="xl:sticky xl:top-4 xl:self-start">
            <CompanyMap company={selected} />
          </div>
        </section>
      </div>
    </main>
  );
}
