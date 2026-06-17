import { getCompanies } from "@/lib/api";
import { getServerSessionToken } from "@/lib/serverSession";
import { CrmSwitcher } from "./CrmSwitcher";

export const dynamic = "force-dynamic";

export default async function CrmPage() {
  const sessionToken = await getServerSessionToken();
  const { companies, error } = await getCompanies(sessionToken)
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
      <CrmSwitcher companies={companies} />
    </div>
  );
}
