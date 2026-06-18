import { Company, OpportunityLevel, WebsiteScan } from "../types.js";

type ScoreInput = Partial<Company>;

export function calculateOpportunityScore(company: ScoreInput) {
  const nexus = calculateNexusScore(company, { targetCity: company.city });
  const normalizedLegacyScore = Math.min(100, Math.round(nexus.total / 10));
  const level: OpportunityLevel = nexus.total >= 650 ? "Alta" : nexus.total >= 400 ? "Media" : "Baixa";

  return {
    score: normalizedLegacyScore,
    opportunityLevel: level,
    detectedOpportunities: dedupe(nexus.digitalGaps.map((gap) => `Gap digital: ${gap}`)),
    suggestions: dedupe([nexus.suggestedApproach, ...nexus.breakdown.slice(0, 3).map((item) => actionForReason(item.reason))]),
    nexusScore: nexus.total,
    nexusClassification: nexus.classification.label,
    nexusScoreBreakdown: nexus.breakdown,
    digitalGaps: nexus.digitalGaps,
    suggestedApproach: nexus.suggestedApproach
  };
}

export function calculateNexusScore(company: ScoreInput, context: { targetCity?: string } = {}) {
  const opportunities: string[] = [];
  const breakdown: Array<{ reason: string; points: number }> = [];
  let score = 0;

  const add = (reason: string, points: number) => {
    score += points;
    breakdown.push({ reason, points });
    opportunities.push(reason);
  };

  if (!company.website) {
    add("Sem site", 150);
  }

  if (!company.instagram && !company.facebook && !company.linkedin && !company.youtube) {
    add("Sem redes sociais identificadas", 80);
  }

  const reviewCount = company.reviewCount ?? 0;
  if (reviewCount === 0) {
    add("Sem avaliações no Google", 100);
  } else if (reviewCount < 10) {
    add("Poucas avaliações no Google (<10)", 70);
  } else if (reviewCount < 50) {
    add("Avaliações moderadas no Google (<50)", 40);
  }

  const rating = company.rating ?? 0;
  if (rating > 0 && rating < 3.5) {
    add(`Nota baixa no Google (${rating})`, 80);
  } else if (rating >= 3.5 && rating < 4) {
    add(`Nota mediana no Google (${rating})`, 40);
  }

  if (company.hasGoogleAds === false) {
    add("Sem Google Ads detectado", 60);
  }

  if (!company.whatsapp && !company.phone) {
    add("Sem contato WhatsApp/telefone claro", 50);
  }

  if (company.hasDescription === false) {
    add("Perfil Google sem descrição otimizada", 35);
  }

  if (company.hasRecentPhotos === false) {
    add("Perfil sem fotos recentes", 30);
  }

  if (company.hasRecentPosts === false) {
    add("Perfil sem postagens recentes", 25);
  }

  if (company.respondsReviews === false) {
    add("Empresa não responde avaliações com frequência", 35);
  }

  if (company.pageSpeed !== undefined && company.pageSpeed > 0 && company.pageSpeed < 60) {
    add("Site lento no mobile segundo PageSpeed", 55);
  }

  if (isHighPotentialSegment(company.category)) {
    add("Segmento com alto potencial digital", 100);
  }

  if (reviewCount > 100 && !company.website) {
    add("Empresa ativa sem presença digital estruturada", 80);
  }

  if (context.targetCity && company.city?.toLowerCase().includes(context.targetCity.toLowerCase())) {
    add("Localização na cidade alvo", 50);
  }

  if (company.phone || company.website || company.whatsapp) {
    add("Dados de contato disponíveis", 30);
  }

  add("Negócio ativo para prospecção", 50);

  if (!company.website && reviewCount > 20 && isHighPotentialSegment(company.category)) {
    add("Oportunidade crítica: sem site, avaliações e segmento relevante", 100);
  }

  const total = Math.min(1000, score);
  const digitalGaps = identifyDigitalGaps(company);

  return {
    total,
    breakdown: breakdown.sort((a, b) => b.points - a.points),
    classification: classifyNexusScore(total),
    digitalGaps,
    suggestedApproach: getSuggestedApproach(total)
  };
}

function dedupe(items: string[]) {
  return Array.from(new Set(items));
}

function classifyNexusScore(score: number) {
  if (score <= 250) return { label: "Baixa oportunidade", color: "var(--score-critical)" };
  if (score <= 500) return { label: "Oportunidade moderada", color: "var(--score-low)" };
  if (score <= 750) return { label: "Alta oportunidade", color: "var(--score-good)" };
  return { label: "Oportunidade crítica", color: "var(--score-excellent)" };
}

export function identifyDigitalGaps(company: ScoreInput) {
  const gaps: string[] = [];
  if (!company.website) gaps.push("Sem site");
  if (!company.whatsapp) gaps.push("Sem WhatsApp");
  if (!company.instagram && !company.facebook && !company.linkedin && !company.youtube) gaps.push("Sem redes sociais");
  if ((company.reviewCount ?? 0) < 10) gaps.push("Poucas avaliações");
  if ((company.rating ?? 5) < 4) gaps.push("Nota baixa no Google");
  if (company.hasGoogleAds === false) gaps.push("Sem Google Ads");
  return gaps;
}

function getSuggestedApproach(score: number) {
  if (score > 750) return "Abordagem imediata recomendada. Empresa com múltiplos gaps digitais críticos.";
  if (score > 500) return "Boa oportunidade. Apresentar diagnóstico de presença digital.";
  if (score > 250) return "Oportunidade moderada. Qualificar antes de investir tempo.";
  return "Baixa prioridade. Focar em leads com Score Nexus maior.";
}

function actionForReason(reason: string) {
  if (reason.includes("Sem site")) return "Oferecer landing page/site focado em conversão local.";
  if (reason.includes("avalia")) return "Propor campanha de reputação e captura de avaliações.";
  if (reason.includes("Google Ads")) return "Apresentar plano de campanhas de pesquisa para demanda local.";
  if (reason.includes("WhatsApp")) return "Configurar WhatsApp Business e rastreamento de conversões.";
  if (reason.includes("PageSpeed")) return "Otimizar performance mobile antes de escalar mídia.";
  return `Explorar oportunidade: ${reason}.`;
}

function isHighPotentialSegment(category?: string) {
  const text = String(category || "").toLowerCase();
  return [
    "clínica", "clinica", "saúde", "saude", "dent", "estética", "estetica", "salão", "salao", "academia",
    "restaurante", "oficina", "imobili", "advoc", "contab", "veterin", "escola", "hotel", "pizzaria"
  ].some((segment) => text.includes(segment));
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
