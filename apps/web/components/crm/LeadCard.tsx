"use client";

import Link from "next/link";
import { MoreHorizontal, MessageCircle } from "lucide-react";
import type { Company } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { ScoreBadge } from "@/components/ui/ScoreBadge";

interface LeadCardProps {
  lead: Company;
  onEdit?: (lead: Company) => void;
  onArchive?: (leadId: string) => void;
}

function temperatureFor(lead: Company) {
  if (lead.temperature === "Quente") return "hot";
  if (lead.temperature === "Morno") return "warm";
  if (lead.temperature === "Frio") return "cold";
  if (lead.opportunityLevel === "Alta" || Number(lead.score || 0) >= 75) return "hot";
  if (lead.opportunityLevel === "Media" || Number(lead.score || 0) >= 45) return "warm";
  return "cold";
}

function daysStopped(lead: Company) {
  const date = lead.updatedAt || lead.createdAt;
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  return Number.isFinite(days) && days > 0 ? days : 0;
}

function formatDate(value?: string) {
  if (!value) return "Sem contato";
  return new Date(value).toLocaleDateString("pt-BR");
}

export function LeadCard({ lead, onEdit, onArchive }: LeadCardProps) {
  const temperature = temperatureFor(lead);
  const temperatureLabel = temperature === "hot" ? "Quente" : temperature === "warm" ? "Morno" : "Frio";
  const temperatureVariant = temperature === "hot" ? "danger" : temperature === "warm" ? "warning" : "info";

  return (
    <article
      className="group cursor-pointer rounded-xl border border-border-soft bg-bg-card p-3 transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-primary/50 hover:shadow-glow"
      onClick={() => onEdit?.(lead)}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href={`/companies/${encodeURIComponent(lead.id)}`} onClick={(event) => event.stopPropagation()} className="block truncate text-sm font-semibold text-text-primary hover:text-brand-glow">
            {lead.name}
          </Link>
          {(lead.city || lead.state) && (
            <p className="truncate text-xs text-text-muted">{[lead.city, lead.state].filter(Boolean).join(", ")}</p>
          )}
        </div>
        <ScoreBadge score={lead.score || 0} variant="digital" showLabel={false} />
      </div>

      <div className="mb-2 flex flex-wrap gap-1">
        <Badge variant={temperatureVariant}>{temperatureLabel}</Badge>
        {lead.probability !== undefined && <Badge variant="default">{lead.probability}%</Badge>}
        {lead.category && <Badge className="max-w-[128px] truncate">{lead.category}</Badge>}
      </div>

      <div className="mb-2 space-y-1 rounded-lg border border-border-soft bg-bg-input px-2 py-2 text-[11px] text-text-secondary">
        <p><strong className="text-text-primary">Último contato:</strong> {formatDate(lead.lastContactAt)}</p>
        <p><strong className="text-text-primary">Tempo na etapa:</strong> {daysStopped(lead)} dia(s)</p>
        {lead.nextAction && <p className="line-clamp-2"><strong className="text-text-primary">Próxima ação:</strong> {lead.nextAction}</p>}
        {lead.status === "Perdido" && lead.lostReason && <p className="line-clamp-2 text-[var(--danger)]"><strong>Motivo:</strong> {lead.lostReason}</p>}
      </div>

      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-medium text-text-secondary">
          {lead.source === "manual" ? "Manual" : lead.source === "import" ? "Importado" : lead.source || "CRM"}
        </span>
        <span className="flex items-center gap-2 text-text-muted">
          {lead.whatsapp && <MessageCircle className="h-3.5 w-3.5 text-[var(--success)]" />}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onArchive?.(lead.id);
            }}
            className="rounded-md p-1 text-text-muted hover:bg-bg-hover hover:text-text-primary"
            aria-label="Ações do lead"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </span>
      </div>
    </article>
  );
}
