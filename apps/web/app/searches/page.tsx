import type { Metadata } from "next";
import Image from "next/image";
import { Clock, Database, RefreshCw, Search } from "lucide-react";
import { SearchPanel } from "@/components/SearchPanel";
import { CreditsBadge } from "@/components/CreditsBadge";
import { getSearchHistory, getEnrichmentQueue } from "@/lib/api";
import { RerunButton } from "./RerunButton";
import { CsvImportPanel } from "./CsvImportPanel";
import { ExternalSearchTabs } from "./ExternalSearchTabs";

export const metadata: Metadata = {
  title: "Busca de empresas | NODERE Nexus",
  description: "Busque empresas no Google Places, salve oportunidades no CRM e acompanhe enriquecimento comercial no NODERE Nexus."
};

export default async function SearchesPage() {
  const [history, queue] = await Promise.all([getSearchHistory(), getEnrichmentQueue()]);

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Busca de empresas NODERE</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Pesquise empresas reais, salve leads e acompanhe enriquecimento comercial.</p>
        </div>

        <div className="flex gap-3">
          <CreditsBadge />
          <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-3 text-center">
            <p className="text-xs text-[var(--text-muted)]">Enriquecendo</p>
            <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{queue.pending + queue.running}</p>
            <p className="text-xs text-[var(--text-muted)]">na fila</p>
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <div className="overflow-hidden rounded-lg border border-[rgba(3,98,76,0.32)] bg-[linear-gradient(135deg,rgba(3,98,76,0.18),rgba(8,16,24,0.92))] p-4 shadow-glow">
          <Image src="/logo-noderi-full.png" alt="NODERE Nexus" width={420} height={150} priority className="h-auto w-full max-w-sm object-contain" />
          <h2 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">Busca inteligente de empresas</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Pesquise, selecione empresas em massa, salve leads, exporte CSV ou baixe relatório PDF.</p>
        </div>
        <SearchPanel />
        <ExternalSearchTabs />
      </section>

      <CsvImportPanel />

      {queue.running > 0 || queue.pending > 0 ? (
        <div className="rounded-lg border border-[rgba(0,223,130,0.32)] bg-[rgba(0,223,130,0.10)] px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
            <Database className="h-4 w-4 animate-pulse text-cyan" />
            Enriquecimento em andamento: {queue.running} analisando, {queue.pending} aguardando — os dados das empresas serão atualizados automaticamente.
          </div>
        </div>
      ) : null}

      {history.length === 0 ? (
        <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] p-12 text-center">
          <Search className="mx-auto h-10 w-10 text-[var(--brand-primary)]" />
          <p className="mt-4 text-sm text-[var(--text-secondary)]">Nenhuma busca realizada ainda.</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Use o painel principal para buscar empresas por cidade e segmento.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((search) => (
            <div key={search.id} className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-[var(--text-primary)]">{search.segment}</span>
                    <span className="text-[var(--text-secondary)]">em</span>
                    <span className="font-medium text-[var(--text-primary)]">
                      {search.city}
                      {search.state ? `, ${search.state}` : ""}
                    </span>
                    {search.keyword && (
                      <span className="rounded-full border border-[var(--border-soft)] bg-[var(--bg-hover)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
                        {search.keyword}
                      </span>
                    )}
                    <span
                      className={[
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        search.source === "google" ? "bg-[rgba(0,223,130,0.13)] text-[var(--brand-glow)]" : "bg-[rgba(245,158,11,0.14)] text-[var(--warning)]"
                      ].join(" ")}
                    >
                      {search.source === "google" ? "Google Places" : search.source === "mock" ? "Demo" : "Fallback"}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-[var(--text-muted)]">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(search.lastRanAt).toLocaleString("pt-BR")}
                    </span>
                    <span>{search.resultCount} empresas</span>
                  </div>
                </div>

                <RerunButton searchId={search.id} />
              </div>
            </div>
          ))}
        </div>
      )}

      {queue.jobs.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-[var(--text-secondary)]">Fila de enriquecimento</h2>
          <div className="overflow-hidden rounded-lg border border-[var(--border-soft)]">
            <table className="w-full text-sm">
              <thead className="border-b border-[var(--border-soft)] bg-[var(--bg-elevated)]">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Empresa</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Iniciado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-soft)]">
                {queue.jobs.slice(0, 20).map((job) => (
                  <tr key={job.id} className="bg-[var(--bg-card)]">
                    <td className="px-4 py-3 text-[var(--text-primary)]">{job.companyName}</td>
                    <td className="px-4 py-3">
                      <span
                        className={[
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                          job.status === "done" ? "bg-[rgba(0,223,130,0.13)] text-[var(--brand-glow)]" :
                          job.status === "running" ? "bg-[rgba(3,98,76,0.16)] text-[var(--brand-primary)]" :
                          job.status === "error" ? "bg-[rgba(239,68,68,0.14)] text-[var(--danger)]" :
                          "bg-[var(--bg-hover)] text-[var(--text-secondary)]"
                        ].join(" ")}
                      >
                        {job.status === "running" && <RefreshCw className="h-2.5 w-2.5 animate-spin" />}
                        {job.status === "done" ? "Concluído" : job.status === "running" ? "Analisando" : job.status === "error" ? "Erro" : "Aguardando"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{new Date(job.createdAt).toLocaleTimeString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

