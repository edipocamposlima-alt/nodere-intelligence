import { config } from "../config.js";

export async function generateDiagnosis(lead, scan, operationalContext = {}) {
  if (!config.openaiApiKey) {
    return fallbackDiagnosis(lead, scan, operationalContext);
  }

  const prompt = {
    action: operationalContext.action || "analyze",
    question: operationalContext.question || "",
    lead,
    scan,
    notes: operationalContext.notes || [],
    tasks: operationalContext.tasks || [],
    history: operationalContext.history || [],
    context: operationalContext.context || {},
    instruction:
      "Atue como agente operacional senior do CRM NODERE Intelligence. Analise contexto real do lead, historico, observacoes, agenda, pipeline, PageSpeed e carteira. Gere decisao comercial objetiva, proximos passos, abordagem, estrategia Google Ads e alertas. Nao responda genericamente."
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
            "Voce e o agente operacional de um SaaS de prospeccao, CRM e Google Ads. Retorne apenas JSON valido em portugues do Brasil, com recomendacoes comerciais praticas e baseadas no contexto informado."
        },
        {
          role: "user",
          content: JSON.stringify(prompt)
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "nodere_operational_agent",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              summary: { type: "string" },
              diagnosis: { type: "string" },
              recommendedServices: { type: "array", items: { type: "string" } },
              nextSteps: { type: "array", items: { type: "string" } },
              alerts: { type: "array", items: { type: "string" } },
              whatsappMessage: { type: "string" },
              emailMessage: { type: "string" },
              followUp: { type: "string" },
              callScript: { type: "string" },
              meetingSummary: { type: "string" },
              objections: { type: "array", items: { type: "string" } },
              googleAdsStrategy: { type: "string" },
              leadPotential: { type: "string" },
              priority: { type: "string" },
              opportunityScore: { type: "number" }
            },
            required: [
              "summary",
              "diagnosis",
              "recommendedServices",
              "nextSteps",
              "alerts",
              "whatsappMessage",
              "emailMessage",
              "followUp",
              "callScript",
              "meetingSummary",
              "objections",
              "googleAdsStrategy",
              "leadPotential",
              "priority",
              "opportunityScore"
            ]
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

function fallbackDiagnosis(lead = {}, scan = null, operationalContext = {}) {
  const score = calculateScore(lead, scan);
  const company = lead.company || lead.companyName || lead.company_name || "lead selecionado";
  const status = lead.status || "Novo lead";
  const notes = operationalContext.notes || lead.notes || [];
  const tasks = operationalContext.tasks || lead.tasks || [];
  const openTasks = tasks.filter((task) => task.status !== "Concluida" && task.status !== "Cancelada");
  const alerts = [];

  if (!lead.website) alerts.push("Lead sem site cadastrado.");
  if (!openTasks.length) alerts.push("Lead sem proximo follow-up.");
  if (!notes.length && !lead.notesText && !lead.internalNotes) alerts.push("Lead sem observacao comercial.");
  if (Number(lead.rating) && Number(lead.rating) < 4.2) alerts.push("Avaliacao Google abaixo de 4.2.");
  if (scan?.performance && scan.performance < 70) alerts.push("Site com performance abaixo do ideal.");

  const leadPotential = score >= 75 ? "Alto" : score >= 50 ? "Medio" : "Baixo";
  const priority = alerts.some((alert) => /follow-up|performance|avaliacao/i.test(alert)) || score >= 75 ? "Alta" : "Media";

  return {
    summary: `Analise operacional de ${company}`,
    diagnosis: `Lead em etapa "${status}" com score ${score}/100. ${alerts.length ? `Pontos de atencao: ${alerts.join(" ")}` : "Sem alerta critico imediato."} A abordagem deve conectar melhoria de presenca digital com geracao previsivel de contatos.`,
    recommendedServices: ["Google Ads local", "Rastreamento de conversoes", "Otimizacao Google Business", "Landing page de conversao"],
    nextSteps: [
      openTasks[0] ? `Executar tarefa pendente: ${openTasks[0].title}.` : "Criar follow-up com data, canal e responsavel.",
      "Enviar diagnostico simples com 2 ou 3 oportunidades visiveis.",
      "Oferecer reuniao curta para explicar impacto em contatos e vendas."
    ],
    alerts,
    whatsappMessage: `Ola, tudo bem? Analisei a presenca digital da ${company} e identifiquei oportunidades para aumentar contatos pelo Google. Posso te mostrar rapidamente?`,
    emailMessage: `Assunto: oportunidades no Google para ${company}\n\nOla! Fiz uma leitura inicial da presenca digital de voces e encontrei oportunidades em Google, site e rastreamento de conversoes. Posso te enviar um diagnostico objetivo?`,
    followUp: "Retomar em ate 2 dias uteis com diagnostico e convite para conversa de 15 minutos.",
    callScript: `Oi, aqui e da NODERE. Vi oportunidades para a ${company} captar mais contatos qualificados pelo Google. Posso explicar em dois minutos o que encontrei?`,
    meetingSummary: "Registrar dor principal, canal de captacao atual, verba mensal estimada, decisor e proximo passo com data.",
    objections: ["Ja tenho agencia", "Nao tenho verba agora", "Nao preciso de Google Ads", "Depois vejo isso"],
    googleAdsStrategy: "Criar campanha local por servico e cidade, priorizar termos de alta intencao, extensoes de chamada, landing page rapida e conversoes rastreadas.",
    leadPotential,
    priority,
    opportunityScore: score
  };
}

function calculateScore(lead = {}, scan = null) {
  let score = 35;
  if (!lead.website) score += 15;
  if (!lead.phone && !lead.whatsapp) score += 8;
  if (Number(lead.rating) && Number(lead.rating) < 4.2) score += 15;
  if (Number(lead.reviews || lead.google_reviews || 0) < 50) score += 12;
  if (lead.temperature === "Quente") score += 15;
  if (scan?.performance && scan.performance < 70) score += 10;
  return Math.min(100, score);
}
