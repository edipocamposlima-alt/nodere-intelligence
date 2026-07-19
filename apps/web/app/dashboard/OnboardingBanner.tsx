"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, X } from "lucide-react";
import { OnboardingStatus } from "@/lib/api";

const steps = [
  { key: "step_search_completed", label: "1. Fazer primeira busca", href: "/searches" },
  { key: "step_crm_completed", label: "2. Salvar lead no CRM", href: "/crm" },
  { key: "step_proposal_completed", label: "3. Gerar uma proposta", href: "/companies" }
] as const;

export function OnboardingBanner({ initialSteps }: { initialSteps: OnboardingStatus }) {
  const [dismissed, setDismissed] = useState(false);
  const progress = steps.filter((step) => Boolean(initialSteps[step.key])).length;
  const total = steps.length;

  if (dismissed) return null;

  function dismiss() {
    setDismissed(true);
  }

  return (
    <div className="mb-6 rounded-xl border border-electric/35 bg-[linear-gradient(135deg,rgba(3,98,76,0.18),rgba(0,223,130,0.10))] p-4 shadow-[0_18px_50px_rgba(0,223,130,0.10)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="mb-2 font-semibold text-[var(--text-primary)]">Configure o NODERE em 3 passos — {progress}/{total} concluídos</h3>
          <div className="flex flex-wrap gap-3 text-sm">
            {steps.map((step) => {
              const done = Boolean(initialSteps[step.key]);
              return (
                <Link key={step.key} href={step.href} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-semibold ${done ? "border-success/40 bg-success/10 text-[var(--text-primary)]" : "border-electric/35 bg-electric/10 text-[var(--text-primary)] hover:border-electric/70"}`}>
                  {done ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                  {step.label}
                </Link>
              );
            })}
          </div>
        </div>
        <button onClick={dismiss} className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          <X className="h-3.5 w-3.5" />
          Dispensar
        </button>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-black/20">
        <div className="h-full rounded-full bg-electric transition-all" style={{ width: `${(progress / total) * 100}%` }} />
      </div>
    </div>
  );
}
