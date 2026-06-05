import { CheckCircle2, CircleDashed } from "lucide-react";
import { getBackendRootUrl } from "@/lib/apiBase";
import { getIntegrations } from "@/lib/api";

export default async function IntegrationsPage() {
  const integrations = await getIntegrations();
  const backendRoot = getBackendRootUrl();

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
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={`${backendRoot}/api/integrations/health`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-line bg-ink px-3 py-2 text-xs font-semibold text-white hover:border-electric"
              >
                Testar status
              </a>
              {integration.key === "bling" && (
                <a
                  href={`${backendRoot}/api/integrations/bling/connect`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-[#16C784] px-3 py-2 text-xs font-semibold text-ink"
                >
                  Conectar Bling
                </a>
              )}
              {integration.key === "rdstation" && (
                <a
                  href={`${backendRoot}/api/integrations/rdstation/connect`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-[#6D28D9] px-3 py-2 text-xs font-semibold text-white"
                >
                  Conectar RD
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
