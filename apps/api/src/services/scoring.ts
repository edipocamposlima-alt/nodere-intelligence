import { Company, OpportunityLevel } from "../types.js";

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
    opportunities.push("Nao foram detectados sinais de Google Ads.");
    suggestions.push("Oferecer campanha de pesquisa para buscas de alta intencao.");
  }

  if (!company.whatsapp) {
    score += 8;
    opportunities.push("WhatsApp nao aparece como canal claro de contato.");
    suggestions.push("Adicionar WhatsApp Business e rastreamento de conversoes.");
  }

  if (company.hasDescription === false) {
    score += 8;
    opportunities.push("Perfil Google sem descricao otimizada.");
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
    opportunities.push("Empresa nao responde avaliacoes com frequencia.");
  }

  if (company.pageSpeed !== undefined && company.pageSpeed > 0 && company.pageSpeed < 60) {
    score += 8;
    opportunities.push("Site lento no mobile segundo PageSpeed.");
    suggestions.push("Otimizar velocidade e experiencia mobile antes de escalar midia.");
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
