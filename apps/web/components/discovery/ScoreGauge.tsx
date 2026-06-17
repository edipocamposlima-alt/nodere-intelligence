"use client";

export function ScoreGauge({ score, level }: { score: number; level?: string }) {
  const normalized = Math.max(0, Math.min(100, Number(score || 0)));
  const color = normalized >= 80
    ? "var(--score-excellent)"
    : normalized >= 65
      ? "var(--score-good)"
      : normalized >= 40
        ? "var(--score-medium)"
        : normalized >= 25
          ? "var(--score-low)"
          : "var(--score-critical)";

  return (
    <div className="flex items-center gap-3">
      <div
        className="grid h-16 w-16 place-items-center rounded-full text-sm font-bold text-white"
        style={{ background: `conic-gradient(${color} ${normalized * 3.6}deg, var(--border-soft) 0deg)` }}
        title={`Score ${normalized}/100`}
      >
        <div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--bg-main)]">{normalized}</div>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Score digital</p>
        <p className="text-sm font-semibold text-[var(--text-primary)]">{level || "Baixa"}</p>
      </div>
    </div>
  );
}
