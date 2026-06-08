"use client";

import Link from "next/link";
import { CreditCard } from "lucide-react";
import { useCredits } from "@/context/CreditsProvider";

export function CreditsBadge() {
  const { credits, loading, daysLeft, trialExpired } = useCredits();

  if (loading && !credits) {
    return (
      <div className="rounded-lg border border-line bg-panel/90 px-4 py-3 text-center">
        <p className="text-xs text-slate-400">Créditos</p>
        <p className="mt-1 text-sm font-semibold text-slate-500">Carregando...</p>
      </div>
    );
  }

  if (!credits) {
    return (
      <Link href="/billing" className="rounded-lg border border-line bg-panel/90 px-4 py-3 text-center transition hover:border-electric/60">
        <p className="text-xs text-slate-400">Créditos</p>
        <p className="mt-1 text-sm font-semibold text-amber-200">Indisponível</p>
      </Link>
    );
  }

  return (
    <Link href="/billing" className="rounded-lg border border-line bg-panel/90 px-4 py-3 text-center transition hover:border-electric/60">
      <p className="flex items-center justify-center gap-1 text-xs text-slate-400">
        <CreditCard className="h-3.5 w-3.5 text-cyan" />
        Créditos
      </p>
      <p className="mt-1 text-2xl font-semibold text-white">{credits.remaining} / {credits.total}</p>
      <p className={`text-xs ${trialExpired || credits.blocked ? "text-rose-300" : "text-slate-500"}`}>
        {credits.plan}{credits.plan === "trial" && daysLeft !== null ? ` · ${trialExpired ? "expirado" : `${Math.max(0, daysLeft)} dia(s)`}` : ""}
      </p>
    </Link>
  );
}
