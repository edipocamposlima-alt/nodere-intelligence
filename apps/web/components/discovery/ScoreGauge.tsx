"use client";

export function ScoreGauge({ score, level }: { score: number; level?: string }) {
  const normalized = Math.max(0, Math.min(100, Number(score || 0)));
  const color = normalized >= 65 ? "#16a34a" : normalized >= 40 ? "#f59e0b" : "#64748b";

  return (
    <div className="flex items-center gap-3">
      <div
        className="grid h-16 w-16 place-items-center rounded-full text-sm font-bold text-white"
        style={{ background: `conic-gradient(${color} ${normalized * 3.6}deg, #1f2937 0deg)` }}
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
