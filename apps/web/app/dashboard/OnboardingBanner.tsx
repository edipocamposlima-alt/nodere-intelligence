"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, X } from "lucide-react";
import { OnboardingStatus, markOnboardingStep } from "@/lib/api";

const steps = [
  { key: "step_search_completed", label: "1. Fazer primeira busca", href: "/searches" },
  { key: "step_crm_completed", label: "2. Salvar lead no CRM", href: "/crm" },
  { key: "step_proposal_completed", label: "3. Gerar uma proposta", href: "/companies" }
] as const;

export function OnboardingBanner({ initialSteps }: { initialSteps: OnboardingStatus }) {
  const [status, setStatus] = useState(initialSteps);
  const [dismissed, setDismissed] = useState(false);
  const [congrats, setCongrats] = useState(false);

  const progress = useMemo(() => steps.filter((step) => Boolean(status[step.key])).length, [status]);
  const total = steps.length;

  useEffect(() => {
    if (progress !== total || dismissed) return;
    setCongrats(true);
    const timer = window.setTimeout(() => {
      setCongrats(false);
      setDismissed(true);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [dismissed, progress, total]);

  if (dismissed) return null;

  async function dismiss() {
    setDismissed(true);
    try {
      let next = status;
      for (const step of ["search", "crm", "proposal"] as const) {
        next = await markOnboardingStep(step);
      }
      setStatus(next);
    } catch {
      // Dispensar é uma preferência de UX; falha de rede não deve travar a tela.
    }
  }

  return (
    <div className="mb-6 rounded-xl border border-blue-700 bg-blue-900/30 p-4 shadow-[0_18px_50px_rgba(30,111,219,0.12)]">
      {congrats ? (
        <div className="flex items-center gap-3 text-blue-100">
          <CheckCircle2 className="h-5 w-5 text-emerald-300" />
          <div>
            <h3 className="font-semibold text-emerald-200">NODERE configurado com sucesso.</h3>
            <p className="text-sm text-blue-100/80">Você concluiu os 3 passos iniciais.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="mb-2 font-semibold text-blue-300">Configure o NODERE em 3 passos — {progress}/{total} concluídos</h3>
              <div className="flex flex-wrap gap-3 text-sm">
                {steps.map((step) => {
                  const done = Boolean(status[step.key]);
                  return (
                    <Link key={step.key} href={step.href} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${done ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200" : "border-blue-400/30 bg-blue-400/10 text-blue-100 hover:border-cyan/60"}`}>
                      {done ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                      {step.label}
                    </Link>
                  );
                })}
              </div>
            </div>
            <button onClick={dismiss} className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200">
              <X className="h-3.5 w-3.5" />
              Dispensar
            </button>
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-gray-700">
            <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${(progress / total) * 100}%` }} />
          </div>
        </>
      )}
    </div>
  );
}
