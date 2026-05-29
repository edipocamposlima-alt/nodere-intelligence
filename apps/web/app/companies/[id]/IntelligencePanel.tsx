import { AlertTriangle, CheckCircle2, Info, TrendingUp, XCircle, Zap } from "lucide-react";
import { GoogleIntelligence, MissingAsset } from "@/lib/types";

const INTENT_LABELS = {
  local: "Local",
  service: "Serviço",
  competitor: "Concorrência",
  informational: "Informacional",
  urgent: "Urgente"
};

const INTENT_COLORS = {
  local: "bg-blue-500/15 text-blue-200",
  service: "bg-emerald-500/15 text-emerald-200",
  competitor: "bg-amber-500/15 text-amber-200",
  informational: "bg-slate-500/15 text-slate-300",
  urgent: "bg-red-500/15 text-red-200"
};

const COMPETITION_COLORS = {
  low: "text-emerald-300",
  medium: "text-amber-300",
  high: "text-red-300"
};

const PRIORITY_COLORS: Record<MissingAsset["priority"], string> = {
  high: "border-red-500/30 bg-red-500/5",
  medium: "border-amber-500/30 bg-amber-500/5",
  low: "border-line bg-panel/40"
};

const PRIORITY_LABELS: Record<MissingAsset["priority"], string> = {
  high: "Crítico",
  medium: "Recomendado",
  low: "Opcional"
};

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 70 ? "text-emerald-300" : score >= 40 ? "text-amber-300" : "text-red-300";
  const bg = score >= 70 ? "bg-emerald-500" : score >= 40 ? "bg-amber-400" : "bg-red-500";
  return (
    <div className="flex items-center gap-4">
      <div className="relative h-16 w-16 shrink-0">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15" fill="none"
            stroke={score >= 70 ? "#10b981" : score >= 40 ? "#fbbf24" : "#ef4444"}
            strokeWidth="3"
            strokeDasharray={`${(score / 100) * 94.2} 94.2`}
            strokeLinecap="round"
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-lg font-bold ${color}`}>{score}</span>
      </div>
      <div>
        <p className="text-sm font-medium text-white">Prontidão para Google Ads</p>
        <div className="mt-1.5 h-1.5 w-40 rounded-full bg-white/10">
          <div className={`h-1.5 rounded-full ${bg}`} style={{ width: `${score}%` }} />
        </div>
        <p className="mt-1 text-xs text-slate-500">{score < 40 ? "Infraestrutura insuficiente" : score < 70 ? "Infraestrutura parcial" : "Pronto para escalar"}</p>
      </div>
    </div>
  );
}

export function IntelligencePanel({ intel }: { intel: GoogleIntelligence }) {
  const { adsReadiness, keywords, gbp, adsConnectionStatus } = intel;
  const highPriority = adsReadiness.missingAssets.filter((a) => a.priority === "high");
  const otherAssets = adsReadiness.missingAssets.filter((a) => a.priority !== "high");

  return (
    <div className="space-y-5">
      {/* Ads connection banner */}
      <div className={`rounded-lg border p-4 ${adsConnectionStatus === "connected" ? "border-emerald-500/30 bg-emerald-500/5" : "border-line bg-panel/90"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-cyan" />
            <span className="text-sm font-medium text-white">Google Ads</span>
          </div>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${adsConnectionStatus === "connected" ? "bg-emerald-500/15 text-emerald-300" : adsConnectionStatus === "configured" ? "bg-amber-500/15 text-amber-300" : "bg-slate-500/15 text-slate-400"}`}>
            {adsConnectionStatus === "connected" ? "Conectado" : adsConnectionStatus === "configured" ? "Configurado" : "Não configurado"}
          </span>
        </div>
        {adsConnectionStatus !== "connected" && (
          <p className="mt-2 text-xs leading-5 text-slate-400">Configure GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CUSTOMER_ID e GOOGLE_ADS_REFRESH_TOKEN para conectar a conta Google Ads.</p>
        )}
      </div>

      {/* Ads readiness */}
      <div className="rounded-lg border border-line bg-panel/90 p-5">
        <h3 className="mb-4 font-semibold text-white">Prontidão para tráfego pago</h3>
        <ScoreGauge score={adsReadiness.score} />

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "Landing Page", ok: adsReadiness.hasLandingPage },
            { label: "Meta Pixel", ok: adsReadiness.hasPixel },
            { label: "GA4", ok: adsReadiness.hasGA4 },
            { label: "Conversões", ok: adsReadiness.hasConversionTracking },
            { label: "GTM", ok: adsReadiness.hasGTM },
            { label: "Velocidade", ok: adsReadiness.isLandingPageFast },
            { label: "Responsivo", ok: adsReadiness.isResponsive }
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5 text-xs">
              {item.ok
                ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                : <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />}
              <span className={item.ok ? "text-slate-300" : "text-slate-500"}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {adsReadiness.recommendations.length > 0 && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-200">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Recomendações prioritárias
          </div>
          <ul className="mt-3 space-y-2">
            {adsReadiness.recommendations.map((r) => (
              <li key={r} className="text-xs leading-5 text-amber-100/80">{r}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Critical missing assets */}
      {highPriority.length > 0 && (
        <div className="rounded-lg border border-line bg-panel/90 p-5">
          <h3 className="mb-3 font-semibold text-white">Assets críticos ausentes</h3>
          <div className="space-y-2">
            {highPriority.map((asset) => (
              <div key={asset.label} className={`rounded-md border p-3 ${PRIORITY_COLORS[asset.priority]}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{asset.label}</span>
                  <span className="text-xs text-red-400">{PRIORITY_LABELS[asset.priority]}</span>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-400">{asset.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other assets */}
      {otherAssets.length > 0 && (
        <div className="rounded-lg border border-line bg-panel/90 p-5">
          <h3 className="mb-3 font-semibold text-white">Checklist de assets</h3>
          <div className="space-y-2">
            {otherAssets.map((asset) => (
              <div key={asset.label} className={`rounded-md border p-3 ${PRIORITY_COLORS[asset.priority]}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{asset.label}</span>
                  <span className={`text-xs ${asset.priority === "medium" ? "text-amber-400" : "text-slate-500"}`}>{PRIORITY_LABELS[asset.priority]}</span>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-400">{asset.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Keywords */}
      <div className="rounded-lg border border-line bg-panel/90 p-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-cyan" />
          <h3 className="font-semibold text-white">Keywords sugeridas</h3>
        </div>
        <div className="mt-4 overflow-hidden rounded-lg border border-line">
          <table className="w-full text-xs">
            <thead className="border-b border-line bg-ink/60">
              <tr>
                <th className="px-3 py-2.5 text-left font-medium text-slate-400">Keyword</th>
                <th className="px-3 py-2.5 text-left font-medium text-slate-400">Intent</th>
                <th className="px-3 py-2.5 text-left font-medium text-slate-400">Vol./mês</th>
                <th className="px-3 py-2.5 text-left font-medium text-slate-400">Comp.</th>
                <th className="px-3 py-2.5 text-left font-medium text-slate-400">CPC est.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {keywords.map((kw) => (
                <tr key={kw.keyword} className="bg-panel/40">
                  <td className="px-3 py-2 font-medium text-white">{kw.keyword}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${INTENT_COLORS[kw.intent]}`}>
                      {INTENT_LABELS[kw.intent]}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-400">{kw.estimatedMonthlySearches}</td>
                  <td className={`px-3 py-2 font-medium ${COMPETITION_COLORS[kw.competition]}`}>
                    {kw.competition === "low" ? "Baixa" : kw.competition === "medium" ? "Média" : "Alta"}
                  </td>
                  <td className="px-3 py-2 text-slate-400">{kw.suggestedBidBRL ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* GBP */}
      <div className={`rounded-lg border p-5 ${gbp.status === "authorized" ? "border-emerald-500/30 bg-emerald-500/5" : "border-line bg-panel/90"}`}>
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-cyan shrink-0" />
          <h3 className="text-sm font-semibold text-white">Google Business Profile</h3>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${gbp.status === "authorized" ? "bg-emerald-500/15 text-emerald-300" : gbp.status === "error" ? "bg-red-500/15 text-red-300" : "bg-slate-500/15 text-slate-400"}`}>
            {gbp.status === "authorized" ? "Autorizado" : gbp.status === "error" ? "Erro" : gbp.status === "configured" ? "Configurado" : "Não configurado"}
          </span>
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-400">{gbp.message}</p>
        {gbp.data && (
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {gbp.data.locationCount !== undefined && (
              <div className="rounded-md bg-ink px-2 py-2">
                <p className="text-lg font-semibold text-white">{gbp.data.locationCount}</p>
                <p className="text-[10px] text-slate-400">locais</p>
              </div>
            )}
            {gbp.data.reviewCount !== undefined && (
              <div className="rounded-md bg-ink px-2 py-2">
                <p className="text-lg font-semibold text-white">{gbp.data.reviewCount}</p>
                <p className="text-[10px] text-slate-400">avaliações</p>
              </div>
            )}
            {gbp.data.averageRating !== undefined && (
              <div className="rounded-md bg-ink px-2 py-2">
                <p className="text-lg font-semibold text-white">{gbp.data.averageRating}</p>
                <p className="text-[10px] text-slate-400">nota média</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
