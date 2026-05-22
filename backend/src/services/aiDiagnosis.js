import { config } from "../config.js";

function fallbackDiagnosis(lead, scan) {
  const findings = scan?.findings?.length ? scan.findings.join(" ") : "Presenca digital com lacunas comerciais.";
  return {
    summary: `${lead.company_name || lead.companyName} apresenta sinais de oportunidade para captacao local e melhoria de rastreamento.`,
    diagnosis: findings,
    recommendedServices: ["Google Ads local", "Rastreamento de conversoes", "Otimização do Perfil da Empresa no Google"],
    whatsappMessage: `Oi, tudo bem? Sou Édipo Lima. Fiz uma analise rapida da presenca digital da ${lead.company_name || lead.companyName} e encontrei oportunidades para melhorar captacao pelo Google. Posso te enviar um diagnostico gratuito?`,
    opportunityScore: scan?.score ? Math.min(95, 100 - scan.score + 55) : 78
  };
}

export async function generateDiagnosis(lead, scan) {
  if (!config.openaiApiKey) {
    return fallbackDiagnosis(lead, scan);
  }

  const prompt = {
    lead,
    scan,
    instruction:
      "Gere um diagnostico comercial em portugues do Brasil para vender servicos de Google Ads, rastreamento e melhoria de presenca digital. Seja consultivo, objetivo e etico."
  };

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.openaiApiKey}`
    },
    body: JSON.stringify({
      model: config.openaiModel,
      input: [
        {
          role: "system",
          content:
            "Voce e um analista comercial senior de marketing digital. Retorne apenas JSON valido."
        },
        {
          role: "user",
          content: JSON.stringify(prompt)
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "nodere_diagnosis",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              summary: { type: "string" },
              diagnosis: { type: "string" },
              recommendedServices: {
                type: "array",
                items: { type: "string" }
              },
              whatsappMessage: { type: "string" },
              opportunityScore: { type: "number" }
            },
            required: ["summary", "diagnosis", "recommendedServices", "whatsappMessage", "opportunityScore"]
          }
        }
      }
    })
  });

  if (!response.ok) {
    return fallbackDiagnosis(lead, scan);
  }

  const data = await response.json();
  const text = data.output_text || data.output?.[0]?.content?.[0]?.text;
  return text ? JSON.parse(text) : fallbackDiagnosis(lead, scan);
}
