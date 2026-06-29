import { CheckCircle2, ExternalLink, Info, XCircle } from "lucide-react";
import { DigitalAudit } from "@/lib/types";

function ScoreBar({ label, value, hint }: { label: string; value: number; hint: string }) {
  const color = value >= 70 ? "bg-emerald-500" : value >= 40 ? "bg-amber-400" : "bg-red-500";
  const textColor = value >= 70 ? "text-emerald-300" : value >= 40 ? "text-amber-300" : "text-red-300";
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-300">{label}</span>
        <span className={`font-semibold ${textColor}`}>{value}/100</span>
      </div>
      <div className="mt-1.5 h-2 rounded-full bg-white/10">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
      </div>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

function Check({ label, ok, detail }: { label: string; ok: boolean; detail?: string }) {
  return (
    <div className="flex items-start gap-2">
      {ok
        ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
        : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />}
      <div className="min-w-0">
        <p className={`text-sm ${ok ? "text-slate-300" : "text-slate-400"}`}>{label}</p>
        {detail && <p className="mt-0.5 truncate text-xs text-slate-500">{detail}</p>}
      </div>
    </div>
  );
}

function ms(val?: number) {
  if (!val) return "—";
  return val >= 1000 ? `${(val / 1000).toFixed(1)}s` : `${Math.round(val)}ms`;
}

export function AuditPanel({ audit }: { audit: DigitalAudit }) {
  const { scan, maturityScore, commercialScore, paidTrafficScore, opportunityScore, gbp } = audit;

  return (
    <div className="space-y-5">
      {/* Composite scores */}
      <div className="rounded-lg border border-line bg-panel/90 p-5">
        <h3 className="font-semibold text-white">Scores compostos</h3>
        <div className="mt-4 space-y-4">
          <ScoreBar label="Oportunidade comercial" value={opportunityScore} hint="Sinais de carência: baixa nota, sem site, sem Google Ads." />
          <ScoreBar label="Maturidade digital" value={maturityScore} hint="Qualidade técnica: SSL, SEO, OG, dados estruturados, velocidade." />
          <ScoreBar label="Infraestrutura comercial" value={commercialScore} hint="Pixel, conversões, GA4, GTM, WhatsApp." />
          <ScoreBar label="Prontidão para tráfego pago" value={paidTrafficScore} hint="Pixel + conversões + GA4 + GTM + velocidade mobile." />
        </div>
      </div>

      {scan ? (
        <>
          {/* Core Web Vitals */}
          <div className="rounded-lg border border-line bg-panel/90 p-5">
            <h3 className="font-semibold text-white">Core Web Vitals — mobile</h3>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              {[
                { label: "LCP", value: ms(scan.lcp), hint: "Largest Contentful Paint", ok: scan.lcp ? scan.lcp < 2500 : false },
                { label: "FCP", value: ms(scan.fcp), hint: "First Contentful Paint", ok: scan.fcp ? scan.fcp < 1800 : false },
                { label: "CLS", value: scan.cls != null ? scan.cls.toFixed(3) : "—", hint: "Cumulative Layout Shift", ok: scan.cls != null ? scan.cls < 0.1 : false }
              ].map((v) => (
                <div key={v.label} className="rounded-lg border border-line bg-ink px-3 py-3">
                  <p className="text-xs text-slate-400">{v.label}</p>
                  <p className={`mt-1 text-xl font-semibold ${v.value === "—" ? "text-slate-500" : v.ok ? "text-emerald-300" : "text-red-300"}`}>{v.value}</p>
                  <p className="mt-1 text-[10px] text-slate-600">{v.hint}</p>
                </div>
              ))}
            </div>
          </div>

          {/* SEO audit */}
          <div className="rounded-lg border border-line bg-panel/90 p-5">
            <h3 className="font-semibold text-white">Auditoria SEO</h3>
            <div className="mt-4 space-y-2.5">
              <Check label="Title tag" ok={scan.hasTitle} detail={scan.titleText} />
              <Check label="Meta description" ok={scan.hasMetaDescription} />
              <Check label="H1 principal" ok={scan.hasH1} detail={scan.h1Text} />
              <Check label="Tag canonical" ok={scan.hasCanonical} />
              <Check label="Open Graph (og:)" ok={scan.hasOpenGraph} />
              <Check label="Dados estruturados (JSON-LD)" ok={scan.hasStructuredData} />
              <Check label="Sitemap.xml" ok={scan.hasSitemap} />
              <Check label="Meta robots" ok={scan.hasRobotsMeta} />
              <Check label="SSL (HTTPS)" ok={scan.hasSsl} />
              <Check label="Responsivo (mobile)" ok={scan.isResponsive} />
            </div>
          </div>

          {/* Tracking */}
          <div className="rounded-lg border border-line bg-panel/90 p-5">
            <h3 className="font-semibold text-white">Rastreamento e conversões</h3>
            <div className="mt-4 space-y-2.5">
              <Check label="Meta Pixel" ok={scan.hasMetaPixel} detail={scan.metaPixelId ? `ID: ${scan.metaPixelId}` : undefined} />
              <Check label="Google Tag Manager" ok={scan.hasGTM} detail={scan.gtmContainerId} />
              <Check label="GA4 (Google Analytics 4)" ok={scan.hasGA4} detail={scan.ga4MeasurementId} />
              <Check label="Eventos de conversão" ok={scan.hasConversionEvents} detail={scan.conversionEvents.slice(0, 3).join(", ")} />
            </div>
            {scan.conversionEvents.length > 0 && (
              <div className="mt-3 space-y-1">
                {scan.conversionEvents.map((ev) => (
                  <span key={ev} className="mr-1.5 inline-block rounded-full bg-electric/15 px-2 py-0.5 text-xs text-blue-200">{ev}</span>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-line bg-panel/90 p-5 text-center">
          <p className="text-sm text-slate-400">Análise detalhada do site ainda não executada.</p>
          <p className="mt-1 text-xs text-slate-500">Clique em &quot;Analisar site&quot; para obter SEO, Core Web Vitals e rastreamento.</p>
        </div>
      )}

      {/* GBP */}
      <div className={`rounded-lg border p-5 ${gbp.status === "configured" ? "border-emerald-500/30 bg-emerald-500/5" : "border-line bg-panel/90"}`}>
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-cyan shrink-0" />
          <h3 className="text-sm font-semibold text-white">Google Business Profile</h3>
          {gbp.status === "configured" && (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">Configurado</span>
          )}
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-400">{gbp.message}</p>
        {gbp.status === "not_configured" && (
          <a
            href="https://developers.google.com/my-business/content/overview"
            target="_blank"
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-electric hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Documentação da API
          </a>
        )}
      </div>
    </div>
  );
}
