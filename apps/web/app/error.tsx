"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-lg font-medium text-white">Algo deu errado</p>
      <p className="text-sm text-slate-400">{error.message ?? "Erro inesperado"}</p>
      <button
        onClick={reset}
        className="rounded-md bg-electric px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        Tentar novamente
      </button>
    </div>
  );
}
