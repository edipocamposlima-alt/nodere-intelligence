import { config } from "../config.js";
import { Company } from "../types.js";

export async function generateCommercialDiagnosis(company: Company) {
  if (!config.openai.apiKey) {
    return {
      mode: "template",
      diagnosis: buildTemplateDiagnosis(company)
    };
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.openai.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: config.openai.model,
      input: [
        {
          role: "system",
          content: "Voce gera diagnosticos comerciais curtos para agencias de trafego pago. Responda em portugues do Brasil, com tom consultivo e objetivo."
        },
        {
          role: "user",
          content: JSON.stringify({
            empresa: company.name,
            categoria: company.category,
            nota: company.rating,
            avaliacoes: company.reviewCount,
            score: company.score,
            oportunidades: company.detectedOpportunities,
            sugestoes: company.suggestions
          })
        }
      ]
    })
  });

  if (!response.ok) {
    return {
      mode: "template",
      diagnosis: buildTemplateDiagnosis(company)
    };
  }

  const payload = await response.json();
  const text = payload.output_text ?? payload.output?.[0]?.content?.[0]?.text ?? buildTemplateDiagnosis(company);
  return { mode: "openai", diagnosis: text };
}

function buildTemplateDiagnosis(company: Company) {
  const leadIssue = company.detectedOpportunities[0] ?? "A empresa possui oportunidades de melhoria na presenca digital.";
  const leadSuggestion = company.suggestions[0] ?? "Recomenda-se uma auditoria comercial e tecnica do perfil digital.";
  return `${company.name} apresenta score ${company.score}/100. Principal oportunidade: ${leadIssue} Acao sugerida: ${leadSuggestion}`;
}
