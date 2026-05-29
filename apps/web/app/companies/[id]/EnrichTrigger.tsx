"use client";

import { useState } from "react";
import { RefreshCw, Zap } from "lucide-react";
import { triggerEnrichment } from "@/lib/api";
import { EnrichmentStatus } from "@/lib/types";

const statusLabels: Record<EnrichmentStatus, string> = {
  none: "Analisar site",
  pending: "Aguardando na fila",
  running: "Analisando...",
  done: "Análise concluída",
  error: "Erro — tentar novamente"
};

export function EnrichTrigger({
  companyId,
  enrichmentStatus,
  hasWebsite
}: {
  companyId: string;
  enrichmentStatus?: EnrichmentStatus;
  hasWebsite: boolean;
}) {
  const [status, setStatus] = useState<EnrichmentStatus>(enrichmentStatus ?? "none");
  const [loading, setLoading] = useState(false);

  if (!hasWebsite) return null;

  const isActive = status === "pending" || status === "running";

  async function handleEnrich() {
    if (isActive || loading) return;
    setLoading(true);
    try {
      await triggerEnrichment(companyId);
      setStatus("pending");
    } catch {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleEnrich}
      disabled={isActive || loading}
      className={[
        "inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition",
        status === "done" ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300" :
        status === "error" ? "border border-red-500/30 bg-red-500/10 text-red-300" :
        isActive ? "border border-line bg-white/5 text-slate-400 cursor-not-allowed" :
        "border border-line bg-white/5 text-slate-300 hover:border-electric hover:text-white"
      ].join(" ")}
    >
      {loading || isActive
        ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        : <Zap className="h-3.5 w-3.5" />}
      {statusLabels[status]}
    </button>
  );
}
