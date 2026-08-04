"use client";

import { useEffect, useState } from "react";
import { Archive, MoreHorizontal, ShieldAlert, Trash2, X } from "lucide-react";
import type { Company } from "@/lib/types";
import { archiveCompany, getCompanyDependencies, trashCompany } from "@/lib/api";

type DependencyImpact = { companyId: string; dependencies: Record<string, number>; total: number };

const dependencyLabels: Record<string, string> = {
  commercial_briefings: "briefings",
  company_contacts: "contatos",
  communications: "comunicações",
  communication_threads: "conversas",
  communication_events: "eventos de comunicação",
  company_contracts: "contratos",
  calendar_events: "tarefas e eventos",
  schedules: "agendamentos",
  nodere_proposals: "propostas",
  proposal_versions: "versões de proposta",
  inbox_messages: "mensagens",
  cadence_enrollments: "automações",
  nodere_company_notes: "registros do histórico",
  company_files: "arquivos"
};

export function RecordActionsMenu({ company, role, compact = false, onChanged }: { company: Company; role?: string; compact?: boolean; onChanged?: (action: "archive" | "trash") => void }) {
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<"archive" | "trash" | null>(null);
  const [impact, setImpact] = useState<DependencyImpact | null>(null);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [message, setMessage] = useState("");
  const canArchive = ["owner", "admin", "operator"].includes(String(role || ""));
  const canDelete = ["owner", "admin"].includes(String(role || ""));

  useEffect(() => {
    if (!dialog) return;
    setLoading(true);
    setImpact(null);
    setMessage("");
    getCompanyDependencies(company.id)
      .then(setImpact)
      .catch((error) => setMessage(error instanceof Error ? error.message : "Não foi possível calcular o impacto."))
      .finally(() => setLoading(false));
  }, [company.id, dialog]);

  function begin(action: "archive" | "trash") {
    setOpen(false);
    setReason("");
    setAcknowledged(false);
    setDialog(action);
  }

  async function confirm() {
    if (!dialog || reason.trim().length < 3 || !acknowledged) return;
    setLoading(true);
    setMessage("");
    try {
      if (dialog === "archive") await archiveCompany(company.id, reason.trim());
      else await trashCompany(company.id, reason.trim());
      const action = dialog;
      setDialog(null);
      onChanged?.(action);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível alterar o ciclo de vida.");
    } finally { setLoading(false); }
  }

  if (!canArchive && !canDelete) return null;

  return <>
    <div className="relative inline-flex">
      <button type="button" onClick={() => setOpen((value) => !value)} className={compact ? "nodere-company-action-icon" : "briefing-action"} aria-haspopup="menu" aria-expanded={open} aria-label={`Ações do registro ${company.name}`} title="Arquivar ou excluir com segurança">
        <MoreHorizontal className="h-4 w-4" />{!compact && <span>Ações</span>}
      </button>
      {open && <div role="menu" className="absolute right-0 top-full z-40 mt-2 min-w-56 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-modal)] p-2 shadow-2xl">
        {canArchive && <button type="button" role="menuitem" onClick={() => begin("archive")} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold hover:bg-[var(--bg-hover)]"><Archive className="h-4 w-4" /> Arquivar</button>}
        {canDelete && <button type="button" role="menuitem" onClick={() => begin("trash")} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold text-red-300 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /> Mover para a lixeira</button>}
      </div>}
    </div>

    {dialog && <div className="fixed inset-0 z-[1200] grid place-items-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="record-action-title">
      <section className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-modal)] p-5 shadow-2xl md:p-6">
        <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-amber-300">Ciclo de vida protegido</p><h2 id="record-action-title" className="mt-1 text-xl font-black">{dialog === "trash" ? "Mover para a lixeira" : "Arquivar registro"}</h2></div><button type="button" onClick={() => setDialog(null)} className="rounded-lg border border-[var(--border-soft)] p-2" aria-label="Fechar"><X className="h-4 w-4" /></button></div>
        <div className="mt-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-main)] p-4">
          <p className="font-black">{company.name}</p>
          <div className="mt-2 grid gap-2 text-sm text-[var(--text-secondary)] sm:grid-cols-2"><span>CNPJ: {company.cnpj || "não informado"}</span><span>Responsável: {company.ownerId || "workspace"}</span><span>Etapa: {company.status || "não informada"}</span><span>Contato: {company.phone || company.whatsapp || "não informado"}</span></div>
        </div>
        <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm"><p className="flex items-center gap-2 font-black"><ShieldAlert className="h-4 w-4" /> Impacto calculado</p>{loading && !impact ? <p className="mt-2">Calculando vínculos...</p> : <div className="mt-2 grid gap-1 sm:grid-cols-2">{Object.entries(impact?.dependencies || {}).map(([key, count]) => <span key={key}>{dependencyLabels[key] || key}: <strong>{count}</strong></span>)}</div>}<p className="mt-3 font-bold">Total de vínculos preservados: {impact?.total ?? 0}</p><p className="mt-2 text-[var(--text-secondary)]">{dialog === "trash" ? "O registro poderá ser restaurado durante 30 dias. Seus vínculos e o impacto nas métricas serão preservados até eventual exclusão definitiva." : "O registro deixa a operação ativa, mas permanece íntegro e pode ser restaurado."}</p></div>
        <label className="mt-4 block text-sm font-bold">Motivo obrigatório<textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-input)] p-3 font-normal outline-none focus:border-amber-400" placeholder="Descreva o motivo desta ação" /></label>
        <label className="mt-4 flex items-start gap-3 rounded-xl border border-[var(--border-soft)] p-3 text-sm"><input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} className="mt-0.5 h-4 w-4" /><span>Li o impacto, entendi os vínculos afetados e confirmo que a ação é intencional.</span></label>
        {message && <p role="alert" className="mt-3 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{message}</p>}
        <div className="mt-5 flex flex-wrap justify-end gap-2"><button type="button" onClick={() => setDialog(null)} className="briefing-action">Cancelar</button><button type="button" onClick={() => void confirm()} disabled={loading || reason.trim().length < 3 || !acknowledged} className={dialog === "trash" ? "briefing-action border-red-400/40 text-red-300" : "briefing-action briefing-action--primary"}>{dialog === "trash" ? <Trash2 className="h-4 w-4" /> : <Archive className="h-4 w-4" />}{dialog === "trash" ? "Mover para a lixeira" : "Arquivar"}</button></div>
      </section>
    </div>}
  </>;
}
