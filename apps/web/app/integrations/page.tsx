import { AlertTriangle, CheckCircle2, CircleDashed, XCircle } from "lucide-react";
import { getBackendRootUrl } from "@/lib/apiBase";
import { getIntegrationsStatus } from "@/lib/api";

export default async function IntegrationsPage() {
  const status = await withTimeout(getIntegrationsStatus(), 5000).catch((error) => ({
    readyForRealSearch: false,
    configured: 0,
    total: 0,
    checkedAt: new Date().toISOString(),
    integrations: [],
    error: error instanceof Error ? error.message : "Não foi possível carregar integrações."
  }));
  const integrations = status.integrations;
  const backendRoot = getBackendRootUrl();

  return (
    <div className="space-y-5 p-4 md:p-8">
      <div>
        <h2 className="text-2xl font-semibold text-white">Integrações</h2>
        <p className="mt-1 text-sm text-slate-400">Configure as chaves no `.env` para ativar dados reais.</p>
        {"error" in status && status.error && (
          <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
            {String(status.error)}
          </p>
        )}
        {!("error" in status) && (
          <p className="mt-3 text-xs text-slate-500">
            {status.configured}/{status.total} integrações configuradas · última verificação {new Date(status.checkedAt).toLocaleString("pt-BR")}
          </p>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {integrations.map((integration) => {
          const status = integration.status ?? (integration.configured ? "ok" : "not_configured");
          const statusMeta = getStatusMeta(status, integration.required);
          const StatusIcon = statusMeta.icon;
          return (
            <div key={integration.name} className={`rounded-lg border ${statusMeta.border} bg-panel/90 p-5`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-white">{integration.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{integration.required ? "Necessária para busca real" : "Opcional no MVP"}</p>
                  <span className={`mt-3 inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${statusMeta.badge}`}>
                    {statusMeta.label}
                  </span>
                  {integration.capability && <p className="mt-3 text-sm leading-5 text-slate-400">{integration.capability}</p>}
                  {integration.message && <p className="mt-2 text-xs leading-5 text-slate-500">{integration.message}</p>}
                  {integration.missingEnv && integration.missingEnv.length > 0 && (
                    <p className="mt-2 text-[11px] text-amber-300">
                      Variáveis pendentes: {integration.missingEnv.join(", ")}
                    </p>
                  )}
                </div>
                <StatusIcon className={`h-5 w-5 ${statusMeta.iconClass}`} />
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
          );
        })}
      </div>
    </div>
  );
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error("Backend demorou mais de 5s para retornar o status das integrações.")), ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeout!);
  }
}

function getStatusMeta(status: string, required: boolean) {
  if (status === "ok") {
    return {
      label: "Conectado",
      icon: CheckCircle2,
      iconClass: "text-success",
      border: "border-emerald-500/25",
      badge: "bg-emerald-500/15 text-emerald-300"
    };
  }
  if (status === "error" || status === "timeout") {
    return {
      label: status === "timeout" ? "Tempo esgotado" : "Erro",
      icon: XCircle,
      iconClass: "text-red-300",
      border: "border-red-500/25",
      badge: "bg-red-500/15 text-red-300"
    };
  }
  return {
    label: required ? "Configuração obrigatória" : "Não configurado",
    icon: required ? AlertTriangle : CircleDashed,
    iconClass: required ? "text-amber-300" : "text-slate-500",
    border: required ? "border-amber-500/25" : "border-line",
    badge: required ? "bg-amber-500/15 text-amber-200" : "bg-slate-500/15 text-slate-400"
  };
}
