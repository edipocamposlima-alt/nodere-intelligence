import { CheckCircle2, CircleDashed } from "lucide-react";
import { getIntegrations } from "@/lib/api";

export default async function IntegrationsPage() {
  const integrations = await getIntegrations();

  return (
    <div className="space-y-5 p-4 md:p-8">
      <div>
        <h2 className="text-2xl font-semibold text-white">Integrações</h2>
        <p className="mt-1 text-sm text-slate-400">Configure as chaves no `.env` para ativar dados reais.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {integrations.map((integration) => (
          <div key={integration.name} className="rounded-lg border border-line bg-panel/90 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-white">{integration.name}</p>
                <p className="mt-1 text-sm text-slate-500">{integration.required ? "Necessária para busca real" : "Opcional no MVP"}</p>
                {integration.capability && <p className="mt-3 text-sm leading-5 text-slate-400">{integration.capability}</p>}
              </div>
              {integration.configured ? <CheckCircle2 className="h-5 w-5 text-success" /> : <CircleDashed className="h-5 w-5 text-slate-500" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
