interface ScoreBadgeProps {
  score: number;
  variant?: "nodere" | "digital";
  showLabel?: boolean;
}

export function ScoreBadge({ score, variant = "nodere", showLabel = true }: ScoreBadgeProps) {
  const max = variant === "nodere" ? 1000 : 100;
  const pct = Math.max(0, Math.min(100, (score / max) * 100));

  const color = (() => {
    if (pct < 25) return "var(--score-critical)";
    if (pct < 45) return "var(--score-low)";
    if (pct < 65) return "var(--score-medium)";
    if (pct < 80) return "var(--score-good)";
    return "var(--score-excellent)";
  })();

  const label = (() => {
    if (variant === "nodere") {
      if (score <= 250) return "Baixa oportunidade";
      if (score <= 500) return "Oportunidade moderada";
      if (score <= 750) return "Alta oportunidade";
      return "Oportunidade crítica";
    }
    if (pct < 25) return "Crítico";
    if (pct < 45) return "Baixo";
    if (pct < 65) return "Médio";
    if (pct < 80) return "Bom";
    return "Excelente";
  })();

  return (
    <div className="flex items-center gap-2">
      <div className="relative h-8 w-8 shrink-0">
        <svg viewBox="0 0 32 32" className="-rotate-90">
          <circle cx="16" cy="16" r="13" fill="none" stroke="var(--border-soft)" strokeWidth="3" />
          <circle cx="16" cy="16" r="13" fill="none" stroke={color} strokeWidth="3" strokeDasharray={`${(pct / 100) * 81.7} 81.7`} strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-text-primary">
          {score > 99 ? Math.round(score / 10) : score}
        </span>
      </div>
      {showLabel && (
        <div>
          <p className="text-sm font-semibold" style={{ color }}>{score}</p>
          <p className="text-xs text-text-muted">{label}</p>
        </div>
      )}
    </div>
  );
}
