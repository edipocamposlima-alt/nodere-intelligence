import { Company, OpportunityLevel, WebsiteScan } from "../types.js";

type ScoreInput = Partial<Company>;

export function calculateOpportunityScore(company: ScoreInput) {
  const opportunities: string[] = [];
  const suggestions: string[] = [];
  let score = 0;

  if ((company.rating ?? 5) < 4.2) {
    score += 18;
    opportunities.push(`Empresa possui nota ${company.rating ?? "baixa"} no Google.`);
    suggestions.push("Criar plano de recuperacao de reputacao e avaliacoes.");
  }

  if ((company.reviewCount ?? 0) < 50) {
    score += 14;
    opportunities.push("Empresa tem poucas avaliacoes para gerar autoridade local.");
    suggestions.push("Implantar campanha de captura de avaliacoes via WhatsApp.");
  }

  if (!company.website) {
    score += 18;
    opportunities.push("Empresa sem site detectado.");
    suggestions.push("Criar site ou landing page focada em conversao local.");
  }

  if (company.hasGoogleAds === false) {
    score += 14;
    opportunities.push("Não foram detectados sinais de Google Ads.");
    suggestions.push("Oferecer campanha de pesquisa para buscas de alta intenção.");
  }

  if (!company.whatsapp) {
    score += 8;
    opportunities.push("WhatsApp não aparece como canal claro de contato.");
    suggestions.push("Adicionar WhatsApp Business e rastreamento de conversões.");
  }

  if (company.hasDescription === false) {
    score += 8;
    opportunities.push("Perfil Google sem descrição otimizada.");
  }

  if (company.hasRecentPhotos === false) {
    score += 6;
    opportunities.push("Perfil sem fotos recentes.");
  }

  if (company.hasRecentPosts === false) {
    score += 5;
    opportunities.push("Perfil sem postagens recentes no Google Business.");
  }

  if (company.respondsReviews === false) {
    score += 7;
    opportunities.push("Empresa não responde avaliações com frequência.");
  }

  if (company.pageSpeed !== undefined && company.pageSpeed > 0 && company.pageSpeed < 60) {
    score += 8;
    opportunities.push("Site lento no mobile segundo PageSpeed.");
    suggestions.push("Otimizar velocidade e experiência mobile antes de escalar mídia.");
  }

  const normalized = Math.min(100, score);
  let level: OpportunityLevel = "Baixa";
  if (normalized >= 65) level = "Alta";
  else if (normalized >= 40) level = "Media";

  return {
    score: normalized,
    opportunityLevel: level,
    detectedOpportunities: dedupe(opportunities),
    suggestions: dedupe(suggestions)
  };
}

function dedupe(items: string[]) {
  return Array.from(new Set(items));
}

export function calculateMaturityScore(scan: Partial<WebsiteScan>): number {
  let n = 0;
  if (scan.hasSsl) n += 10;
  if (scan.isResponsive) n += 10;
  if (scan.hasTitle) n += 8;
  if (scan.hasMetaDescription) n += 8;
  if (scan.hasH1) n += 6;
  if (scan.hasCanonical) n += 6;
  if (scan.hasOpenGraph) n += 8;
  if (scan.hasStructuredData) n += 8;
  if (scan.hasSitemap) n += 6;
  if ((scan.pageSpeed ?? 0) >= 70) n += 15;
  else if ((scan.pageSpeed ?? 0) >= 50) n += 8;
  const socials = [scan.instagram, scan.facebook, scan.linkedin, scan.youtube].filter(Boolean).length;
  if (socials >= 2) n += 8;
  else if (socials === 1) n += 4;
  return Math.min(100, n);
}

export function calculateCommercialScore(company: Partial<Company>, scan?: Partial<WebsiteScan>): number {
  let n = 0;
  if (company.website) n += 12;
  if (company.whatsapp) n += 12;
  if (company.phone) n += 6;
  if (scan?.hasSsl) n += 8;
  if (scan?.isResponsive) n += 8;
  if (scan?.hasMetaPixel) n += 20;
  if (scan?.hasConversionEvents) n += 16;
  if (scan?.hasGA4) n += 16;
  if (scan?.hasGTM) n += 10;
  if (scan?.hasOpenGraph) n += 8;
  return Math.min(100, n);
}

export function calculatePaidTrafficScore(scan?: Partial<WebsiteScan>): number {
  let n = 0;
  if (scan?.hasMetaPixel) n += 28;
  if (scan?.hasConversionEvents) n += 22;
  if (scan?.hasGA4) n += 22;
  if (scan?.hasGTM) n += 16;
  if ((scan?.pageSpeed ?? 0) >= 60) n += 8;
  if (scan?.isResponsive) n += 4;
  return Math.min(100, n);
}
