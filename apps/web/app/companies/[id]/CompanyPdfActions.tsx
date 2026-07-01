"use client";

import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { downloadCompanyPdf, openCompanyPdf } from "@/lib/api";

function slug(value: string) {
  return String(value || "cliente")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

export function CompanyPdfActions({ companyId, companyName }: { companyId: string; companyName: string }) {
  const [busy, setBusy] = useState<"open" | "download" | "">("");
  const [error, setError] = useState("");
  const fileName = `ficha-cliente-${slug(companyName)}.pdf`;

  async function run(action: "open" | "download") {
    setBusy(action);
    setError("");
    try {
      if (action === "open") await openCompanyPdf(companyId, fileName);
      else await downloadCompanyPdf(companyId, fileName);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível gerar o documento.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => void run("open")} disabled={Boolean(busy)} className="inline-flex items-center gap-2 rounded-lg border border-line bg-white/5 px-4 py-2 text-sm text-white disabled:cursor-wait disabled:opacity-60">
        <FileText className="h-4 w-4" />
        {busy === "open" ? "Abrindo..." : "Abrir PDF"}
      </button>
      <button type="button" onClick={() => void run("download")} disabled={Boolean(busy)} className="inline-flex items-center gap-2 rounded-lg border border-line bg-white/5 px-4 py-2 text-sm text-white disabled:cursor-wait disabled:opacity-60">
        <Download className="h-4 w-4" />
        {busy === "download" ? "Baixando..." : "Baixar PDF"}
      </button>
      {error && <span className="basis-full text-xs text-red-200">{error}</span>}
    </div>
  );
}
