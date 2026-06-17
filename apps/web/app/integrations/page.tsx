import { AlertTriangle, CheckCircle2, CircleDashed, XCircle } from "lucide-react";
import { getBackendRootUrl } from "@/lib/apiBase";
import { getIntegrationsStatus } from "@/lib/api";
import { AVAILABLE_INTEGRATIONS } from "@/lib/integrations-config";
import { getErrorMessage } from "@/lib/errors";

export default async function IntegrationsPage() {
  const status = await withTimeout(getIntegrationsStatus(), 5000).catch((error) => ({
    readyForRealSearch: false,
    configured: 0,
    total: AVAILABLE_INTEGRATIONS.length,
    checkedAt: new Date().toISOString(),
    integrations: [],
    error: getErrorMessage(error)
  }));
  const backendStatusByKey = new Map(status.integrations.map((item) => [item.key, item]));
  const integrations = AVAILABLE_INTEGRATIONS.map((item) => {
    const remote = backendStatusByKey.get(item.id);
    return {
      ...item,
      key: item.id,
      configured: remote?.configured ?? false,
      status: remote?.status ?? ("unknown" as const),
      required: item.requiredPlan === "starter",
      capability: remote?.capability ?? item.description,
      message: remote?.message ?? ("error" in status ? "Status desconhecido. O card segue disponível para configuração." : "Aguardando configuração."),
      missingEnv: remote?.configured ? [] : [item.credentialLabel]
    };
  });
  const backendRoot = getBackendRootUrl();

  return (
    <div className="space-y-5 p-4 md:p-8">
      <div>
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Integrações</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Configure as credenciais no backend para ativar dados reais.</p>
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
            <div key={integration.key} className={`rounded-lg border ${statusMeta.border} bg-panel/90 p-5`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-[var(--text-primary)]">{integration.name}</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{integration.category} · plano {integration.requiredPlan}</p>
                  <span className={`mt-3 inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${statusMeta.badge}`}>
                    {statusMeta.label}
                  </span>
                  {integration.capability && <p className="mt-3 text-sm leading-5 text-[var(--text-secondary)]">{integration.capability}</p>}
                  {integration.message && <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">{integration.message}</p>}
                  {integration.missingEnv && integration.missingEnv.length > 0 && (
                    <p className="mt-2 text-[11px] font-semibold text-warning">
                      Credenciais pendentes: {integration.missingEnv.join(", ")}
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
                {integration.docsUrl && (
                  <a
                    href={integration.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-line bg-ink px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:border-electric"
                  >
                    Documentação
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
  if (status === "unknown") {
    return {
      label: "Status desconhecido",
      icon: CircleDashed,
      iconClass: "text-slate-500",
      border: "border-line",
      badge: "bg-slate-500/15 text-[var(--text-secondary)]"
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
