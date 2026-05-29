"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ color: "#fff", fontSize: "1.125rem", fontWeight: 500 }}>Algo deu errado</p>
          <p style={{ color: "#94a3b8", fontSize: "0.875rem", marginTop: "0.5rem" }}>{error.message ?? "Erro inesperado"}</p>
          <button
            onClick={reset}
            style={{ marginTop: "1rem", padding: "0.5rem 1rem", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "0.375rem", cursor: "pointer", fontSize: "0.875rem" }}
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
