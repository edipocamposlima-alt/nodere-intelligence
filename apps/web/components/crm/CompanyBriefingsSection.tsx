"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, ClipboardList, FilePlus2 } from "lucide-react";
import type { CommercialBriefingSummary } from "@/lib/api";

export function CompanyBriefingsSection({ companyId, canEdit }: { companyId: string; canEdit: boolean }) {
  const [items, setItems] = useState<CommercialBriefingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/backend/briefings?companyId=${encodeURIComponent(companyId)}`, { cache: "no-store", credentials: "include" })
      .then(async (response) => { const payload = await response.json().catch(() => []); if (!response.ok) throw new Error(payload.message || "Falha ao carregar briefings."); return payload; })
      .then((payload) => { if (!cancelled) setItems(Array.isArray(payload) ? payload : []); })
      .catch((error) => { if (!cancelled) setNotice(error instanceof Error ? error.message : "Falha ao carregar briefings."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [companyId]);

  async function createBriefing() {
    if (!canEdit || creating) return;
    setCreating(true);
    setNotice("");
    try {
      const response = await fetch("/api/backend/briefings", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ companyId, priority: "normal" }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "Não foi possível criar o briefing.");
      window.location.assign(`/crm/briefings/${encodeURIComponent(payload.id)}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível criar o briefing.");
      setCreating(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-heading text-lg font-black">Briefing Comercial</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">Coleta oficial de 47 campos, versões, anexos, conflitos e PDF vinculados a esta ficha.</p></div><button type="button" onClick={createBriefing} disabled={!canEdit || creating} className="briefing-action briefing-action--primary"><FilePlus2 /> {creating ? "Criando..." : "Novo briefing"}</button></div>
      {notice && <p role="alert" className="mt-4 rounded-lg border border-[var(--nodere-gold)] bg-[var(--brand-glow-dim)] p-3 text-sm">{notice}</p>}
      <div className="mt-5 space-y-3">{items.map((item) => <article key={item.id} className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wide text-[var(--brand-primary)]">{item.code} · versão {item.current_version}</p><h3 className="mt-1 font-heading font-black">{item.title}</h3><p className="mt-2 text-sm text-[var(--text-secondary)]">{item.completion_percent}% preenchido · {item.status === "completed" ? "Concluído" : item.status === "archived" ? "Arquivado" : "Em preenchimento"}</p></div>{item.status === "completed" ? <CheckCircle2 className="text-emerald-400" /> : <ClipboardList className="text-[var(--nodere-gold)]" />}</div><div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--bg-hover)]"><div className="h-full bg-[var(--brand-primary)]" style={{ width: `${item.completion_percent}%` }} /></div><Link href={`/crm/briefings/${encodeURIComponent(item.id)}`} className="briefing-action mt-4">{item.status === "draft" ? "Continuar preenchimento" : "Abrir histórico"}</Link></article>)}{!loading && !items.length && <div className="rounded-xl border border-dashed border-[var(--border-soft)] p-8 text-center text-sm text-[var(--text-muted)]">Ainda não há briefing comercial nesta ficha.</div>}{loading && <p className="text-sm text-[var(--text-muted)]">Carregando briefings...</p>}</div>
    </div>
  );
}
