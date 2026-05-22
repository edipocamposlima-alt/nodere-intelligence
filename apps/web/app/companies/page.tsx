import { CompanyTable } from "@/components/CompanyTable";
import { getCompanies } from "@/lib/api";

export default async function CompaniesPage() {
  const companies = await getCompanies();

  return (
    <div className="space-y-5 p-4 md:p-8">
      <div>
        <h2 className="text-2xl font-semibold text-white">Empresas</h2>
        <p className="mt-1 text-sm text-slate-400">Leads encontrados, enriquecidos e priorizados por oportunidade comercial.</p>
      </div>
      <CompanyTable companies={companies} />
    </div>
  );
}
