"use client";

import { Company } from "@/lib/types";
import { CompanyCard } from "./CompanyCard";

export function DiscoveryResults({ companies, onSelect }: { companies: Company[]; onSelect: (company: Company) => void }) {
  if (!companies.length) {
    return <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] p-6 text-sm text-[var(--text-secondary)]">Execute uma busca real no Google Maps para listar oportunidades.</div>;
  }
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] p-4">
        <p className="text-sm font-black text-[var(--text-primary)]">Resultados Discovery</p>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">{companies.length} empresa(s) retornada(s) pela busca atual.</p>
      </div>
      {companies.map((company) => <CompanyCard key={company.id} company={company} onSelect={onSelect} />)}
    </div>
  );
}
