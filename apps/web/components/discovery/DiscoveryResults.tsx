"use client";

import { Company } from "@/lib/types";
import { CompanyCard } from "./CompanyCard";

export function DiscoveryResults({ companies, onSelect }: { companies: Company[]; onSelect: (company: Company) => void }) {
  if (!companies.length) {
    return <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-300">Execute uma busca real no Google Maps para listar oportunidades.</div>;
  }
  return (
    <div className="space-y-4">
      {companies.map((company) => <CompanyCard key={company.id} company={company} onSelect={onSelect} />)}
    </div>
  );
}
