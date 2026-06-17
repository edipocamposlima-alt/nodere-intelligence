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
    <article className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <button className="text-left" onClick={() => onSelect(active)}>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">{active.name}</h3>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{[active.category, active.city, active.state].filter(Boolean).join(" · ") || "Empresa local"}</p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">{active.address}</p>
        </button>
        <ScoreGauge score={active.score} level={active.opportunityLevel} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_220px]">
        <OpportunitiesList opportunities={active.detectedOpportunities} suggestions={active.suggestions} />
        <div className="flex flex-col gap-2">
          {active.website && (
            <a className="inline-flex items-center justify-center gap-2 rounded-md border border-[var(--border-soft)] px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]" href={active.website} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" /> Site
            </a>
          )}
          <button disabled={busy === "site"} onClick={scanSite} className="inline-flex items-center justify-center gap-2 rounded-md border border-[rgba(0,223,130,0.32)] px-3 py-2 text-sm font-semibold text-[var(--brand-glow)] hover:bg-[rgba(0,223,130,0.10)] disabled:opacity-60">
            <Globe2 className="h-4 w-4" /> {busy === "site" ? "Analisando..." : "Analisar site"}
          </button>
          <button disabled={busy === "social"} onClick={scanSocial} className="inline-flex items-center justify-center gap-2 rounded-md border border-[var(--border-soft)] px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] disabled:opacity-60">
            <Share2 className="h-4 w-4" /> {busy === "social" ? "Verificando..." : "Redes sociais"}
          </button>
          <button disabled={busy === "crm"} onClick={addToCrm} className="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--brand-primary)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-primary-hover)] disabled:opacity-60">
            <Plus className="h-4 w-4" /> {busy === "crm" ? "Salvando..." : "Adicionar ao CRM"}
          </button>
          <button onClick={() => onSelect(active)} className="inline-flex items-center justify-center gap-2 rounded-md border border-[var(--border-soft)] px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">
            <Radar className="h-4 w-4" /> Ver no mapa
          </button>
        </div>
      </div>
      {message && <p className="mt-3 rounded-md border border-[var(--border-soft)] bg-[var(--bg-hover)] px-3 py-2 text-sm text-[var(--text-secondary)]">{message}</p>}
    </article>
  );
}
