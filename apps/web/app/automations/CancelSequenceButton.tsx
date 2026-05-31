"use client";

import { useState } from "react";
import { Loader2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { getApiBaseUrl } from "@/lib/apiBase";

const API_URL = getApiBaseUrl();

export function CancelSequenceButton({ instanceId }: { instanceId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function cancel() {
    setLoading(true);
    try {
      await fetch(`${API_URL}/sequences/instances/${instanceId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={cancel}
      disabled={loading}
      className="inline-flex items-center gap-1 rounded-md border border-danger/30 bg-danger/10 px-2 py-1 text-[10px] text-red-300 transition hover:bg-danger/20 disabled:opacity-50"
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
      Cancelar
    </button>
  );
}
