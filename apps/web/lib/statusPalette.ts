export type StatusTone =
  | "critical"
  | "excellent"
  | "high"
  | "good"
  | "moderate"
  | "low"
  | "discarded"
  | "done"
  | "progress"
  | "waiting"
  | "neutral";

export type ScoreBand = {
  label: string;
  tone: StatusTone;
  colorVar: string;
};

export const STATUS_TONE_LABELS: Record<StatusTone, string> = {
  critical: "Crítico",
  excellent: "Oportunidade Excelente",
  high: "Alta oportunidade",
  good: "Boa oportunidade",
  moderate: "Oportunidade moderada",
  low: "Baixa oportunidade",
  discarded: "Descartado / ignorado",
  done: "Concluído / finalizado",
  progress: "Em andamento",
  waiting: "Aguardando",
  neutral: "Baixa prioridade"
};

export const STATUS_BADGE_BASE_CLASS = "nodere-status-badge";
export const STATUS_DOT_CLASS = "nodere-status-dot";

function normalizeStatus(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function normalizeCommercialScore(score: number, max: 1000 | 100 = 1000) {
  const numeric = Number.isFinite(score) ? Number(score) : 0;
  const scaled = max === 100 ? numeric * 10 : numeric;
  return Math.max(0, Math.min(1000, scaled));
}

export function getScoreBand(score: number, max: 1000 | 100 = 1000): ScoreBand {
  const normalized = normalizeCommercialScore(score, max);

  if (normalized >= 850) return { label: "Oportunidade Excelente", tone: "excellent", colorVar: "var(--status-excellent)" };
  if (normalized >= 700) return { label: "Alta oportunidade", tone: "high", colorVar: "var(--status-high)" };
  if (normalized >= 550) return { label: "Boa oportunidade", tone: "good", colorVar: "var(--status-good)" };
  if (normalized >= 400) return { label: "Oportunidade moderada", tone: "moderate", colorVar: "var(--status-moderate)" };
  if (normalized >= 250) return { label: "Baixa oportunidade", tone: "waiting", colorVar: "var(--status-waiting)" };
  return { label: "Pouca oportunidade", tone: "low", colorVar: "var(--status-low)" };
}

export function getStatusTone(value: unknown): StatusTone {
  const normalized = normalizeStatus(value);

  if (!normalized) return "neutral";
  if (/(critico|urgente|falha grave|problema critico|pendencia critica)/.test(normalized)) return "critical";
  if (/(excelente|lead muito quente|muito quente|score elevado)/.test(normalized)) return "excellent";
  if (/(alta oportunidade|alta prioridade|alta|quente|lead quente)/.test(normalized)) return "high";
  if (/(boa oportunidade|qualificado|boa probabilidade|bom|boa)/.test(normalized)) return "good";
  if (/(moderada|media|medio|morno|necessita analise|potencial medio)/.test(normalized)) return "moderate";
  if (/(baixa oportunidade|baixa prioridade|baixo potencial|frio|baixa|pouca oportunidade)/.test(normalized)) return "low";
  if (/(ignorado|descartado|perdido|perdida|lost|cancelado|cancelada|pausado|pausada)/.test(normalized)) return "discarded";
  if (/(concluido|finalizado|cliente convertido|convertido|sucesso|fechado|fechada|ganha|won|cliente)/.test(normalized)) return "done";
  if (/(em andamento|em atendimento|em negociacao|em analise|em processamento|negociando|negotiating|novo lead|novo|contactado|contatado)/.test(normalized)) return "progress";
  if (/(aguardando|follow-up|follow up|retorno|proposta enviada|sent|draft|pendente)/.test(normalized)) return "waiting";

  return "neutral";
}

export function getStatusTooltip(value: unknown, tone = getStatusTone(value)) {
  const label = String(value ?? STATUS_TONE_LABELS[tone]).trim() || STATUS_TONE_LABELS[tone];
  return `${label}: ${STATUS_TONE_LABELS[tone]}`;
}
