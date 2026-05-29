"use client";

import { useState } from "react";
import { createCheckoutSession } from "@/lib/api";

export function CheckoutButton({ planId, label }: { planId: string; label: string }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const { url } = await createCheckoutSession(planId);
      window.location.href = url;
    } catch {
      alert("Stripe não está configurado neste ambiente. Configure STRIPE_SECRET_KEY e os IDs de preço para ativar o checkout.");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="mt-4 w-full rounded-lg bg-cyan px-4 py-2 text-sm font-semibold text-ink transition hover:opacity-90 disabled:opacity-50"
    >
      {loading ? "Redirecionando…" : label}
    </button>
  );
}
