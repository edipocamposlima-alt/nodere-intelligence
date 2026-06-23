import type { Company } from "../types.js";
import { calculateOpportunityScore, identifyDigitalGaps } from "./scoring.js";

export type CommercialInsight = {
  score: number;
  opportunityLevel: Company["opportunityLevel"];
  temperature: "Frio" | "Morno" | "Quente";
  digitalPresenceAnalysis: string;
  opportunityClassification: string;
  summary: string;
  recommendedApproach: string;
  firstApproach: string;
  followUp: string;
  proposalSuggestion: string;
  historySummary: string;
  nextSteps: string[];
  opportunitySignals: string[];
  detectedOpportunities: string[];
  suggestions: string[];
  aiProvider?: string;
  aiFallback: boolean;
};

export function buildCommercialInsight(company: Partial<Company>, ai?: Partial<CommercialInsight>): CommercialInsight {
  const score = calculateOpportunityScore(company);
  const gaps = identifyDigitalGaps(company);
  const temperature = classifyTemperature(score.score, score.opportunityLevel, gaps);
  const segment = company.category || "segmento local";
  const city = company.city ? ` em ${company.city}` : "";
  const contactSignal = company.whatsapp || company.phone ? "possui canal de contato" : "precisa clarear canal de contato";
  const websiteSignal = company.website ? "tem site para auditoria" : "nao possui site identificado";
  const reviewSignal = (company.reviewCount ?? 0) > 0
    ? `tem ${(company.reviewCount ?? 0)} avaliacoes e nota ${company.rating || "nao informada"}`
    : "tem pouca prova social publica";
  const signals = [
    `${segment}${city}`,
    contactSignal,
    websiteSignal,
    reviewSignal,
    ...gaps.slice(0, 4)
  ];
  const nextSteps = [
    "Validar decisor e canal principal de contato.",
    company.website ? "Executar auditoria do site e rastreamento antes da proposta." : "Apresentar landing page/site com foco em conversao local.",
    "Enviar diagnostico curto com 2 oportunidades objetivas.",
    "Agendar retorno comercial em ate 48 horas."
  ];
  const fallback: CommercialInsight = {
    score: score.score,
    opportunityLevel: score.opportunityLevel,
    temperature,
    digitalPresenceAnalysis: buildPresenceAnalysis(company, gaps),
    opportunityClassification: score.nodereClassification || classifyOpportunity(score.opportunityLevel, temperature),
    summary: `${company.name || "Empresa"} apresenta ${score.opportunityLevel.toLowerCase()} potencial comercial para ${segment}. Principais sinais: ${signals.slice(1, 4).join(", ")}.`,
    recommendedApproach: score.suggestedApproach || "Apresentar diagnostico de presenca digital com proposta objetiva.",
    firstApproach: `Olá! Analisei rapidamente a presença digital da ${company.name || "empresa"} e encontrei oportunidades práticas para gerar mais contatos qualificados. Posso te enviar um diagnóstico curto?`,
    followUp: `Passando para retomar o diagnóstico da ${company.name || "empresa"}. Posso te mostrar em poucos minutos quais ajustes tendem a gerar mais procura local.`,
    proposalSuggestion: `Proposta sugerida: diagnóstico digital, correção dos principais gaps e plano de aquisição local com acompanhamento semanal.`,
    historySummary: "Sem histórico detalhado suficiente. Priorize validar interesse, decisor e próximo compromisso.",
    nextSteps,
    opportunitySignals: signals,
    detectedOpportunities: mergeUnique(score.detectedOpportunities, gaps.map((gap) => `Gap digital: ${gap}`)),
    suggestions: mergeUnique(score.suggestions, [score.suggestedApproach, ...nextSteps]),
    aiFallback: true
  };

  return {
    ...fallback,
    ...compactInsight(ai),
    score: score.score,
    opportunityLevel: score.opportunityLevel,
    temperature,
    detectedOpportunities: mergeUnique(fallback.detectedOpportunities, ai?.detectedOpportunities || []),
    suggestions: mergeUnique(fallback.suggestions, ai?.suggestions || []),
    opportunitySignals: mergeUnique(fallback.opportunitySignals, ai?.opportunitySignals || []),
    nextSteps: mergeUnique(fallback.nextSteps, ai?.nextSteps || []),
    aiFallback: !ai || ai.aiFallback !== false
  };
}

export function buildCommercialInsightPrompt(company: Partial<Company>) {
  return `Analise este lead e retorne JSON valido com:
{
  "digitalPresenceAnalysis": "analise curta",
  "opportunityClassification": "classificacao comercial",
  "summary": "resumo automatico",
  "recommendedApproach": "abordagem recomendada",
  "firstApproach": "mensagem de primeira abordagem",
  "followUp": "mensagem de follow-up",
  "proposalSuggestion": "sugestao de proposta",
  "historySummary": "resumo do historico se houver",
  "nextSteps": ["proximo passo"],
  "opportunitySignals": ["sinal"],
  "detectedOpportunities": ["oportunidade"],
  "suggestions": ["acao recomendada"]
}

Lead:
${JSON.stringify(safeCompanyContext(company)).slice(0, 4000)}`;
}

export function parseCommercialInsightJson(content: string, provider?: string): Partial<CommercialInsight> {
  const parsed = JSON.parse(content) as Partial<CommercialInsight>;
  return {
    ...parsed,
    nextSteps: asStringArray(parsed.nextSteps),
    opportunitySignals: asStringArray(parsed.opportunitySignals),
    detectedOpportunities: asStringArray(parsed.detectedOpportunities),
    suggestions: asStringArray(parsed.suggestions),
    aiProvider: provider,
    aiFallback: false
  };
}

function classifyTemperature(score: number, level: Company["opportunityLevel"], gaps: string[]) {
  if (score >= 70 || level === "Alta" || gaps.length >= 4) return "Quente";
  if (score <= 35 && gaps.length <= 1) return "Frio";
  return "Morno";
}

function classifyOpportunity(level: Company["opportunityLevel"], temperature: string) {
  if (level === "Alta" || temperature === "Quente") return "Prioridade comercial alta";
  if (level === "Media") return "Oportunidade em qualificacao";
  return "Baixa prioridade comercial";
}

function buildPresenceAnalysis(company: Partial<Company>, gaps: string[]) {
  const parts = [
    company.website ? "Site identificado" : "Site nao identificado",
    company.whatsapp ? "WhatsApp identificado" : "WhatsApp ausente",
    (company.reviewCount ?? 0) > 0 ? "possui avaliacoes publicas" : "baixa prova social publica",
    gaps.length ? `gaps principais: ${gaps.join(", ")}` : "sem gaps criticos aparentes"
  ];
  return parts.join("; ") + ".";
}

function safeCompanyContext(company: Partial<Company>) {
  const {
    id, name, category, city, state, address, phone, whatsapp, website, instagram, facebook, linkedin, youtube,
    rating, reviewCount, status, temperature, probability, dealValue, expectedCloseDate, lostReason, nextAction,
    score, opportunityLevel, detectedOpportunities, suggestions, digitalGaps, suggestedApproach, hasGoogleAds,
    hasDescription, hasRecentPhotos, hasRecentPosts, respondsReviews, pageSpeed, maturityScore, commercialScore,
    paidTrafficScore, source
  } = company;
  return {
    id, name, category, city, state, address, phone, whatsapp, website, instagram, facebook, linkedin, youtube,
    rating, reviewCount, status, temperature, probability, dealValue, expectedCloseDate, lostReason, nextAction,
    score, opportunityLevel, detectedOpportunities, suggestions, digitalGaps, suggestedApproach, hasGoogleAds,
    hasDescription, hasRecentPhotos, hasRecentPosts, respondsReviews, pageSpeed, maturityScore, commercialScore,
    paidTrafficScore, source
  };
}

function compactInsight(input?: Partial<CommercialInsight>) {
  if (!input) return {};
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== null && value !== "";
    })
  ) as Partial<CommercialInsight>;
}

function mergeUnique(...groups: Array<Array<string | undefined> | undefined>) {
  return Array.from(new Set(groups.flatMap((group) => group || []).map((item) => String(item || "").trim()).filter(Boolean)));
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || "").trim()).filter(Boolean);
}
