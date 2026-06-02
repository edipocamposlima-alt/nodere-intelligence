import { CompanyTable } from "@/components/CompanyTable";
import { getCompanies } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  const { companies, error } = await getCompanies()
    .then((companies) => ({ companies, error: "" }))
    .catch((error) => ({
      companies: [],
      error: error instanceof Error ? error.message : "Não foi possível carregar leads persistidos."
    }));

  return (
    <div className="space-y-5 p-4 md:p-8">
      {error && (
        <div className="rounded-lg border border-amber-400/40 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100">
          <strong>Persistência precisa de atenção:</strong> {error}
        </div>
      )}
      <div>
        <h2 className="text-2xl font-semibold text-white">Empresas</h2>
        <p className="mt-1 text-sm text-slate-400">Leads encontrados, enriquecidos e priorizados por oportunidade comercial.</p>
      </div>
      <CompanyTable companies={companies} />
    </div>
  );
}
