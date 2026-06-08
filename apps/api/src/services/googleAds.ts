import { config } from "../config.js";
import { AdsReadiness, Company, MissingAsset, OfflineConversion, WebsiteScan } from "../types.js";

export function getAdsConnectionStatus() {
  const { developerToken, clientId, clientSecret, refreshToken, customerId } = config.googleAds;
  if (developerToken && clientId && clientSecret && refreshToken && customerId) return "connected" as const;
  if (developerToken || customerId) return "configured" as const;
  return "not_configured" as const;
}

export function assessAdsReadiness(company: Company, scan?: WebsiteScan | null): AdsReadiness {
  const hasLandingPage = Boolean(company.website);
  const hasPixel = Boolean(scan?.hasMetaPixel ?? company.metaPixel);
  const hasConversionTracking = Boolean(scan?.hasConversionEvents ?? company.hasConversionEvents);
  const hasGA4 = Boolean(scan?.hasGA4 ?? company.hasGA4);
  const hasGTM = Boolean(scan?.hasGTM ?? company.googleTagManager);
  const pageSpeed = scan?.pageSpeed ?? company.pageSpeed ?? 0;
  const isLandingPageFast = pageSpeed >= 60;
  const isResponsive = Boolean(scan?.isResponsive ?? company.isResponsive);

  const missing: MissingAsset[] = [];

  if (!hasLandingPage) {
    missing.push({ type: "sitelink", label: "Landing page", priority: "high", description: "Crie uma página de destino otimizada para conversão antes de investir em tráfego pago." });
  }
  if (!hasPixel) {
    missing.push({ type: "pixel", label: "Meta Pixel", priority: "high", description: "Instale o Meta Pixel para remarketing e audiências semelhantes no Facebook/Instagram Ads." });
  }
  if (!hasGA4) {
    missing.push({ type: "ga4", label: "Google Analytics 4", priority: "high", description: "Configure GA4 e vincule à conta Google Ads para medir conversões com precisão." });
  }
  if (!hasGTM) {
    missing.push({ type: "gtm", label: "Google Tag Manager", priority: "medium", description: "Use GTM para gerenciar tags de rastreamento sem depender do desenvolvedor." });
  }
  if (!hasConversionTracking) {
    missing.push({ type: "conversion", label: "Eventos de conversão", priority: "high", description: "Defina e dispare eventos de conversão (lead, contato, compra) para otimização de lances." });
  }
  if (hasLandingPage && !isLandingPageFast) {
    missing.push({ type: "speed", label: "Velocidade mobile", priority: "medium", description: `PageSpeed ${pageSpeed}/100. Sites lentos aumentam o CPC e reduzem o Quality Score. Meta: ≥60.` });
  }
  if (!isResponsive) {
    missing.push({ type: "speed", label: "Design responsivo", priority: "high", description: "O site não é mobile-friendly. O Google Ads penaliza landing pages sem responsividade." });
  }
  // Ad asset gaps
  missing.push({ type: "headline", label: "Títulos RSA", priority: "medium", description: "Prepare ao menos 10 títulos variados para Anúncios Responsivos de Pesquisa (RSA)." });
  missing.push({ type: "description", label: "Descrições RSA", priority: "medium", description: "Prepare ao menos 4 descrições de 90 caracteres para teste A/B." });
  missing.push({ type: "sitelink", label: "Sitelinks", priority: "low", description: "Adicione 4–6 sitelinks (serviços, sobre, contato, área de atuação)." });
  missing.push({ type: "callout", label: "Extensões de Callout", priority: "low", description: "Liste diferenciais curtos: 'Atendimento 24h', 'Sem taxa de entrada', 'Orçamento grátis'." });
  if (company.phone) {
    missing.push({ type: "call_extension", label: "Extensão de chamada", priority: "medium", description: `Adicione o número ${company.phone} como extensão de chamada no Google Ads.` });
  }
  if (!scan?.hasOpenGraph) {
    missing.push({ type: "image", label: "Imagens para Display", priority: "low", description: "Prepare imagens 1200×628 e 1200×1200 para campanhas Display e Performance Max." });
  }

  const recommendations: string[] = [];
  if (!hasGA4 && !hasPixel) recommendations.push("Priorize a instalação de GA4 + Meta Pixel antes de qualquer investimento em mídia paga.");
  if (!hasConversionTracking) recommendations.push("Sem eventos de conversão ativos, o algoritmo do Google não pode otimizar lances automaticamente.");
  if (pageSpeed > 0 && pageSpeed < 50) recommendations.push(`PageSpeed ${pageSpeed}/100 está crítico. Cada segundo extra de carregamento reduz a taxa de conversão em ~7%.`);
  if (company.hasGoogleAds === false) recommendations.push("Empresa sem sinal de Google Ads ativo — oportunidade de captura de mercado antes dos concorrentes.");
  if ((company.rating ?? 5) < 4.0) recommendations.push("Avaliação baixa no Google pode afetar o Quality Score. Melhore a reputação antes de escalar investimento.");

  let score = 0;
  if (hasLandingPage) score += 20;
  if (hasPixel) score += 15;
  if (hasGA4) score += 20;
  if (hasGTM) score += 10;
  if (hasConversionTracking) score += 20;
  if (isLandingPageFast) score += 10;
  if (isResponsive) score += 5;

  return {
    score: Math.min(100, score),
    hasPixel,
    hasConversionTracking,
    hasGA4,
    hasGTM,
    hasLandingPage,
    isLandingPageFast,
    isResponsive,
    missingAssets: missing,
    recommendations
  };
}

export function buildOfflineConversion(
  companyName: string,
  conversionName: string,
  value: number
): OfflineConversion {
  return {
    googleClickId: "",
    conversionName,
    conversionTime: new Date().toISOString().replace("T", " ").replace(/\.\d+Z/, "+0000"),
    conversionValue: value,
    currencyCode: "BRL"
  };
}

export function offlineConversionsToCsv(conversions: OfflineConversion[]): string {
  const header = "Parameters:TimeZone=America/Sao_Paulo\nGoogle Click ID,Conversion Name,Conversion Time,Conversion Value,Conversion Currency";
  const rows = conversions.map(
    (c) => `${c.googleClickId},${c.conversionName},${c.conversionTime},${c.conversionValue},${c.currencyCode}`
  );
  return [header, ...rows].join("\n");
}
