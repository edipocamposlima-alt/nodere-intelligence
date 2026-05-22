import Link from "next/link";
import { getCompanies } from "@/lib/api";
import { CrmStatus } from "@/lib/types";

const columns: CrmStatus[] = ["Novo Lead", "Contatado", "Em negociação", "Reunião marcada", "Proposta enviada", "Fechado", "Perdido"];

export default async function CrmPage() {
  const companies = await getCompanies();

  return (
    <div className="space-y-5 p-4 md:p-8">
      <div>
        <h2 className="text-2xl font-semibold text-white">CRM</h2>
        <p className="mt-1 text-sm text-slate-400">Pipeline simples para acompanhar contato, negociação e fechamento.</p>
      </div>
      <div className="grid gap-4 overflow-x-auto pb-2 xl:grid-cols-7">
        {columns.map((column) => (
          <section key={column} className="min-h-[420px] min-w-64 rounded-lg border border-line bg-panel/90 p-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">{column}</h3>
              <span className="rounded-md bg-white/5 px-2 py-1 text-xs text-slate-400">{companies.filter((company) => company.status === column).length}</span>
            </div>
            <div className="mt-3 space-y-3">
              {companies
                .filter((company) => company.status === column)
                .map((company) => (
                  <Link key={company.id} href={`/companies/${company.id}`} className="block rounded-lg border border-line bg-ink p-3 hover:border-electric/60">
                    <p className="text-sm font-medium text-white">{company.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{company.category}</p>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Score</span>
                      <span className="font-semibold text-cyan">{company.score}</span>
                    </div>
                  </Link>
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
