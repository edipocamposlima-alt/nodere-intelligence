import Link from "next/link";
import { ExternalLink, MessageCircle } from "lucide-react";
import { Company } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

const whatsappMessage =
  "Ola, tudo bem? Estive analisando a presenca digital da sua empresa no Google e identifiquei algumas oportunidades que podem ajudar voces a gerar mais contatos e melhorar o posicionamento online. Posso te mostrar rapidamente?";

export function CompanyTable({ companies }: { companies: Company[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-panel/90">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[840px] border-collapse text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Empresa</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Avaliação</th>
              <th className="px-4 py-3">Falhas detectadas</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Contato</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {companies.map((company) => (
              <tr key={company.id} className="hover:bg-white/[0.03]">
                <td className="px-4 py-4">
                  <Link href={`/companies/${company.id}`} className="font-medium text-white hover:text-cyan">
                    {company.name}
                  </Link>
                  <p className="mt-1 text-xs text-slate-500">
                    {company.category} · {company.city}/{company.state}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-white">{company.score}</span>
                    <StatusBadge value={company.opportunityLevel} />
                  </div>
                </td>
                <td className="px-4 py-4 text-slate-300">
                  {company.rating ?? "-"} · {company.reviewCount ?? 0} avaliações
                </td>
                <td className="px-4 py-4 text-slate-400">{company.detectedOpportunities[0] ?? "Sem alerta critico"}</td>
                <td className="px-4 py-4">
                  <StatusBadge value={company.status} />
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    {company.whatsapp && (
                      <a
                        href={`https://wa.me/${company.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappMessage)}`}
                        target="_blank"
                        className="rounded-lg border border-success/30 bg-success/10 p-2 text-emerald-200 hover:bg-success/20"
                        aria-label="Chamar no WhatsApp"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </a>
                    )}
                    {company.mapsUrl && (
                      <a target="_blank" href={company.mapsUrl} className="rounded-lg border border-line bg-white/5 p-2 text-slate-300 hover:text-white" aria-label="Abrir Google Maps">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
