import assert from "node:assert/strict";
import test from "node:test";
import { buildCommercialInsight } from "../services/commercialInsights.js";
import { calculateOpportunityScore } from "../services/scoring.js";
import type { Company } from "../types.js";

const lead: Partial<Company> = {
  id: "lead-1",
  name: "Clínica Exemplo",
  category: "Clínica odontológica",
  city: "Caxias do Sul",
  state: "RS",
  address: "Rua Teste, 123",
  website: "",
  whatsapp: "",
  phone: "",
  rating: 3.7,
  reviewCount: 8,
  hasGoogleAds: false,
  hasDescription: false,
  hasRecentPhotos: false,
  hasRecentPosts: false,
  respondsReviews: false,
  status: "Novo Lead",
  score: 0,
  opportunityLevel: "Baixa" as const,
  detectedOpportunities: [],
  suggestions: [],
  notes: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

test("Discovery avancado calcula sinais e proximos passos", () => {
  const result = calculateOpportunityScore(lead);
  assert.ok(result.score > 0);
  assert.equal(result.opportunityLevel, "Alta");
  assert.equal(result.temperature, "Quente");
  assert.ok(result.digitalPresenceAnalysis.includes("sem site"));
  assert.ok(result.opportunitySignals.some((signal) => signal.includes("Sem site")));
  assert.ok(result.nextSteps.length >= 3);
});

test("Insight comercial possui fallback completo sem provedor externo", () => {
  const insight = buildCommercialInsight(lead);
  assert.equal(insight.aiFallback, true);
  assert.equal(insight.temperature, "Quente");
  assert.ok(insight.summary.includes("Clínica Exemplo"));
  assert.ok(insight.firstApproach.length > 20);
  assert.ok(insight.followUp.length > 20);
  assert.ok(insight.proposalSuggestion.length > 20);
  assert.ok(insight.detectedOpportunities.length > 0);
  assert.ok(insight.suggestions.length > 0);
});
