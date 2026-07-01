import { getScoreBand, normalizeCommercialScore } from "@/lib/statusPalette";

interface ScoreBadgeProps {
  score: number;
  variant?: "nodere" | "digital";
  showLabel?: boolean;
}

export function ScoreBadge({ score, variant = "nodere", showLabel = true }: ScoreBadgeProps) {
  const max = variant === "nodere" ? 1000 : 100;
  const normalizedScore = normalizeCommercialScore(score, max);
  const pct = Math.max(0, Math.min(100, normalizedScore / 10));
  const band = getScoreBand(score, max);

  return (
    <div className="flex items-center gap-2" title={band.label}>
      <div className="relative h-8 w-8 shrink-0">
        <svg viewBox="0 0 32 32" className="-rotate-90">
          <circle cx="16" cy="16" r="13" fill="none" stroke="var(--border-soft)" strokeWidth="3" />
          <circle cx="16" cy="16" r="13" fill="none" stroke={band.colorVar} strokeWidth="3" strokeDasharray={`${(pct / 100) * 81.7} 81.7`} strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-text-primary">
          {score > 99 ? Math.round(score / 10) : score}
        </span>
      </div>
      {showLabel && (
        <div>
          <p className="text-sm font-semibold" style={{ color: band.colorVar }}>{score}</p>
          <p className="text-xs text-text-muted">{band.label}</p>
        </div>
      )}
    </div>
  );
}
