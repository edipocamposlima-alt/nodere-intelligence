import { config } from "../config.js";

export async function generateDiagnosis(lead, scan) {
  if (!config.openaiApiKey) {
    const error = new Error("OPENAI_API_KEY is not configured.");
    error.status = 503;
    throw error;
  }

  const prompt = {
    lead,
    scan,
    instruction:
      "Gere um diagnostico comercial em portugues do Brasil para vender servicos de Google Ads, rastreamento e melhoria de presenca digital. Seja consultivo, objetivo e etico."
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    signal: controller.signal,
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
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const error = new Error(payload?.error?.message || "OpenAI request failed.");
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  const text = data.output_text || data.output?.[0]?.content?.[0]?.text;
  if (!text) {
    const error = new Error("OpenAI returned an empty diagnosis.");
    error.status = 502;
    throw error;
  }

  return JSON.parse(text);
}
