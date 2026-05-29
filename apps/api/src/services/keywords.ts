import { KeywordSuggestion } from "../types.js";

type Intent = KeywordSuggestion["intent"];
type Competition = KeywordSuggestion["competition"];

interface Template {
  pattern: string;
  intent: Intent;
  competition: Competition;
  searches: string;
  bidBRL?: string;
}

const TEMPLATES: Template[] = [
  // local high intent
  { pattern: "{seg} {city}", intent: "local", competition: "high", searches: "1k–10k", bidBRL: "R$ 3–8" },
  { pattern: "{seg} em {city}", intent: "local", competition: "high", searches: "1k–10k", bidBRL: "R$ 3–8" },
  { pattern: "melhor {seg} {city}", intent: "local", competition: "medium", searches: "500–2k", bidBRL: "R$ 4–10" },
  { pattern: "{seg} perto de mim", intent: "local", competition: "high", searches: "1k–5k", bidBRL: "R$ 5–12" },
  { pattern: "{seg} {city} bairro", intent: "local", competition: "low", searches: "100–500", bidBRL: "R$ 2–5" },
  { pattern: "{seg} {state}", intent: "local", competition: "medium", searches: "1k–5k", bidBRL: "R$ 3–7" },
  // service
  { pattern: "{seg} preço", intent: "service", competition: "medium", searches: "500–2k", bidBRL: "R$ 2–6" },
  { pattern: "{seg} orçamento", intent: "service", competition: "medium", searches: "500–2k", bidBRL: "R$ 2–5" },
  { pattern: "{seg} barato {city}", intent: "service", competition: "low", searches: "200–1k", bidBRL: "R$ 1–4" },
  { pattern: "contratar {seg}", intent: "service", competition: "medium", searches: "500–2k", bidBRL: "R$ 3–7" },
  { pattern: "{seg} avaliação", intent: "service", competition: "low", searches: "200–1k" },
  // urgent
  { pattern: "{seg} 24 horas {city}", intent: "urgent", competition: "low", searches: "100–500", bidBRL: "R$ 4–9" },
  { pattern: "{seg} urgente {city}", intent: "urgent", competition: "low", searches: "100–300", bidBRL: "R$ 3–8" },
  { pattern: "{seg} emergência {city}", intent: "urgent", competition: "low", searches: "100–300", bidBRL: "R$ 3–8" },
  // informational
  { pattern: "como escolher {seg}", intent: "informational", competition: "low", searches: "200–1k" },
  { pattern: "{seg} o que é", intent: "informational", competition: "low", searches: "100–500" },
  { pattern: "{seg} dicas", intent: "informational", competition: "low", searches: "200–1k" },
  // competitor
  { pattern: "{seg} {city} recomendação", intent: "competitor", competition: "medium", searches: "200–1k" },
  { pattern: "alternativa {seg} {city}", intent: "competitor", competition: "low", searches: "100–300" },
];

export function generateKeywords(segment: string, city: string, state?: string): KeywordSuggestion[] {
  const seg = normalize(segment);
  const segAlt = abbreviate(seg);

  const seen = new Set<string>();
  const results: KeywordSuggestion[] = [];

  for (const tpl of TEMPLATES) {
    const candidates = [seg, segAlt].map((s) =>
      tpl.pattern
        .replace("{seg}", s)
        .replace("{city}", city.toLowerCase())
        .replace("{state}", state?.toLowerCase() ?? city.toLowerCase())
    );

    for (const kw of candidates) {
      const normalized = kw.trim().replace(/\s+/g, " ");
      if (seen.has(normalized)) continue;
      seen.add(normalized);
      results.push({
        keyword: normalized,
        intent: tpl.intent,
        competition: tpl.competition,
        estimatedMonthlySearches: tpl.searches,
        suggestedBidBRL: tpl.bidBRL
      });
      break; // one per template
    }
  }

  return results;
}

function normalize(segment: string): string {
  return segment
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

function abbreviate(seg: string): string {
  const words = seg.split(/\s+/);
  if (words.length <= 1) return seg;
  // common abbreviations
  const map: Record<string, string> = {
    clinica: "clinica",
    odontologica: "dentista",
    odontologia: "dentista",
    "medicina estetica": "estetica",
    advocacia: "advogado",
    contabilidade: "contabilidade",
    engenharia: "engenheiro",
  };
  for (const [k, v] of Object.entries(map)) {
    if (seg.includes(k)) return v;
  }
  // return first meaningful word if >2 words
  return words[0];
}
