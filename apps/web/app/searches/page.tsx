import { Clock, Database, RefreshCw, Search } from "lucide-react";
import { SearchPanel } from "@/components/SearchPanel";
import { getSearchHistory, getEnrichmentQueue, getCredits } from "@/lib/api";
import { RerunButton } from "./RerunButton";
import { CsvImportPanel } from "./CsvImportPanel";
import { ExternalSearchTabs } from "./ExternalSearchTabs";

export default async function SearchesPage() {
  const [history, queue, credits] = await Promise.all([getSearchHistory(), getEnrichmentQueue(), getCredits()]);

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Histórico de buscas</h1>
          <p className="mt-1 text-sm text-slate-400">Buscas salvas automaticamente. Reexecute para atualizar os dados.</p>
        </div>

        <div className="flex gap-3">
          <div className="rounded-lg border border-line bg-panel/90 px-4 py-3 text-center">
            <p className="text-xs text-slate-400">Créditos</p>
            <p className="mt-1 text-2xl font-semibold text-white">{credits.balance}</p>
            <p className="text-xs text-slate-500">{credits.plan}</p>
          </div>
          <div className="rounded-lg border border-line bg-panel/90 px-4 py-3 text-center">
            <p className="text-xs text-slate-400">Enriquecendo</p>
            <p className="mt-1 text-2xl font-semibold text-white">{queue.pending + queue.running}</p>
            <p className="text-xs text-slate-500">na fila</p>
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Busca de empresas</h2>
          <p className="mt-1 text-sm text-slate-400">Pesquise, selecione empresas em massa, salve leads, exporte CSV ou baixe relatório PDF.</p>
        </div>
        <SearchPanel />
        <ExternalSearchTabs />
      </section>

      <CsvImportPanel />

      {queue.running > 0 || queue.pending > 0 ? (
        <div className="rounded-lg border border-electric/30 bg-electric/10 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-blue-100">
            <Database className="h-4 w-4 animate-pulse text-cyan" />
            Enriquecimento em andamento: {queue.running} analisando, {queue.pending} aguardando — os dados das empresas serão atualizados automaticamente.
          </div>
        </div>
      ) : null}

      {history.length === 0 ? (
        <div className="rounded-lg border border-line bg-panel/90 p-12 text-center">
          <Search className="mx-auto h-10 w-10 text-slate-600" />
          <p className="mt-4 text-sm text-slate-400">Nenhuma busca realizada ainda.</p>
          <p className="mt-1 text-xs text-slate-500">Use o painel principal para buscar empresas por cidade e segmento.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((search) => (
            <div key={search.id} className="rounded-lg border border-line bg-panel/90 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-white">{search.segment}</span>
                    <span className="text-slate-400">em</span>
                    <span className="font-medium text-white">
                      {search.city}
                      {search.state ? `, ${search.state}` : ""}
                    </span>
                    {search.keyword && (
                      <span className="rounded-full border border-line bg-ink px-2 py-0.5 text-xs text-slate-400">
                        {search.keyword}
                      </span>
                    )}
                    <span
                      className={[
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        search.source === "google" ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"
                      ].join(" ")}
                    >
                      {search.source === "google" ? "Google Places" : search.source === "mock" ? "Demo" : "Fallback"}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-500">
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
          <h2 className="text-sm font-medium text-slate-400">Fila de enriquecimento</h2>
          <div className="overflow-hidden rounded-lg border border-line">
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-ink/60">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-400">Empresa</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-400">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-400">Iniciado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {queue.jobs.slice(0, 20).map((job) => (
                  <tr key={job.id} className="bg-panel/50">
                    <td className="px-4 py-3 text-white">{job.companyName}</td>
                    <td className="px-4 py-3">
                      <span
                        className={[
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                          job.status === "done" ? "bg-emerald-500/15 text-emerald-300" :
                          job.status === "running" ? "bg-blue-500/15 text-blue-300" :
                          job.status === "error" ? "bg-red-500/15 text-red-300" :
                          "bg-slate-500/15 text-slate-400"
                        ].join(" ")}
                      >
                        {job.status === "running" && <RefreshCw className="h-2.5 w-2.5 animate-spin" />}
                        {job.status === "done" ? "Concluído" : job.status === "running" ? "Analisando" : job.status === "error" ? "Erro" : "Aguardando"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{new Date(job.createdAt).toLocaleTimeString("pt-BR")}</td>
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

