"use client";

import { ExternalLink, Globe2, Plus, Radar, Share2 } from "lucide-react";
import { Company } from "@/lib/types";
import { discoveryAddToCrm, discoveryOpportunities, discoveryScanSocial, discoveryScanWebsite } from "@/lib/api";
import { ScoreGauge } from "./ScoreGauge";
import { OpportunitiesList } from "./OpportunitiesList";
import { useState } from "react";

export function CompanyCard({ company, onSelect }: { company: Company; onSelect: (company: Company) => void }) {
  const [active, setActive] = useState(company);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");

  async function scanSite() {
    if (!active.website) return setMessage("Empresa sem site para analisar.");
    setBusy("site");
    setMessage("");
    try {
      const { scan } = await discoveryScanWebsite({ url: active.website, companyId: active.id });
      const score = await discoveryOpportunities({ company: active, websiteScan: scan });
      setActive({ ...active, ...score } as Company);
      setMessage("Site analisado e score atualizado.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao analisar site.");
    } finally {
      setBusy("");
    }
  }

  async function scanSocial() {
    setBusy("social");
    setMessage("");
    try {
      const { social } = await discoveryScanSocial({ website: active.website, companyName: active.name, companyId: active.id });
      setActive({ ...active, ...social } as Company);
      setMessage("Redes sociais verificadas.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao verificar redes.");
    } finally {
      setBusy("");
    }
  }

  async function addToCrm() {
    setBusy("crm");
    setMessage("");
    try {
      const saved = await discoveryAddToCrm(active);
      setActive(saved.company);
      setMessage("Lead adicionado ao CRM.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao adicionar ao CRM.");
    } finally {
      setBusy("");
    }
  }

  return (
    <article className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <button className="text-left" onClick={() => onSelect(active)}>
          <h3 className="text-lg font-semibold text-white">{active.name}</h3>
          <p className="mt-1 text-sm text-slate-400">{[active.category, active.city, active.state].filter(Boolean).join(" · ") || "Empresa local"}</p>
          <p className="mt-2 text-sm text-slate-300">{active.address}</p>
        </button>
        <ScoreGauge score={active.score} level={active.opportunityLevel} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_220px]">
        <OpportunitiesList opportunities={active.detectedOpportunities} suggestions={active.suggestions} />
        <div className="flex flex-col gap-2">
          {active.website && (
            <a className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800" href={active.website} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" /> Site
            </a>
          )}
          <button disabled={busy === "site"} onClick={scanSite} className="inline-flex items-center justify-center gap-2 rounded-md border border-blue-500/40 px-3 py-2 text-sm font-semibold text-blue-100 hover:bg-blue-500/10 disabled:opacity-60">
            <Globe2 className="h-4 w-4" /> {busy === "site" ? "Analisando..." : "Analisar site"}
          </button>
          <button disabled={busy === "social"} onClick={scanSocial} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-60">
            <Share2 className="h-4 w-4" /> {busy === "social" ? "Verificando..." : "Redes sociais"}
          </button>
          <button disabled={busy === "crm"} onClick={addToCrm} className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60">
            <Plus className="h-4 w-4" /> {busy === "crm" ? "Salvando..." : "Adicionar ao CRM"}
          </button>
          <button onClick={() => onSelect(active)} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800">
            <Radar className="h-4 w-4" /> Ver no mapa
          </button>
        </div>
      </div>
      {message && <p className="mt-3 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-300">{message}</p>}
    </article>
  );
}
