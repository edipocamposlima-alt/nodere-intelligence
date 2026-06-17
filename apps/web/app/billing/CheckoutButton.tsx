"use client";

import { useState } from "react";
import { createCheckoutSession } from "@/lib/api";

export function CheckoutButton({ planId, label, paymentLinkUrl }: { planId: string; label: string; paymentLinkUrl?: string }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    if (paymentLinkUrl) {
      window.location.href = paymentLinkUrl;
      return;
    }
    try {
      const { url } = await createCheckoutSession(planId);
      window.location.href = url;
    } catch {
      alert("Checkout temporariamente indisponível. Tente novamente em instantes ou fale com o comercial.");
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
