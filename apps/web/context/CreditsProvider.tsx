"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CreditStatus, getCreditStatus } from "@/lib/api";

type CreditsContextValue = {
  credits: CreditStatus | null;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  daysLeft: number | null;
  trialExpired: boolean;
};

const CreditsContext = createContext<CreditsContextValue>({
  credits: null,
  loading: true,
  error: "",
  refresh: async () => undefined,
  daysLeft: null,
  trialExpired: false
});

function daysUntil(date?: string | null) {
  if (!date) return null;
  const diff = new Date(date).getTime() - Date.now();
  if (!Number.isFinite(diff)) return null;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function CreditsProvider({ children }: { children: ReactNode }) {
  const [credits, setCredits] = useState<CreditStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setCredits(await getCreditStatus());
    } catch (err) {
      setCredits(null);
      setError(err instanceof Error ? err.message : "Não foi possível carregar créditos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onRefresh = () => void refresh();
    window.addEventListener("nodere:credits-refresh", onRefresh);
    return () => window.removeEventListener("nodere:credits-refresh", onRefresh);
  }, [refresh]);

  const daysLeft = useMemo(() => daysUntil(credits?.trial_expires_at), [credits?.trial_expires_at]);
  const trialExpired = Boolean(credits?.trialExpired || (credits?.plan === "trial" && daysLeft !== null && daysLeft < 0));

  return (
    <CreditsContext.Provider value={{ credits, loading, error, refresh, daysLeft, trialExpired }}>
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits() {
  return useContext(CreditsContext);
}
