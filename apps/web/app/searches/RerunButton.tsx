"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { rerunSearch } from "@/lib/api";

export function RerunButton({ searchId }: { searchId: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleRerun() {
    setLoading(true);
    try {
      await rerunSearch(searchId);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleRerun}
      disabled={loading}
      className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-line bg-ink px-3 py-2 text-sm text-slate-300 transition hover:border-electric hover:text-white disabled:opacity-50"
    >
      <RefreshCw className={["h-3.5 w-3.5", loading ? "animate-spin" : ""].join(" ")} />
      {done ? "Atualizado!" : loading ? "Buscando..." : "Reexecutar"}
    </button>
  );
}
