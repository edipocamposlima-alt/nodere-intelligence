import { config } from "../config.js";
import { CommercialDiagnosis, Company } from "../types.js";

interface DiagnosisPayload {
  summary: string;
  whatsapp_copy: string;
  email_subject: string;
  email_body: string;
  pitch: string;
  call_script: string;
  suggested_services: string[];
}

export async function generateCommercialDiagnosis(company: Company): Promise<CommercialDiagnosis> {
  const base = {
    companyId: company.id,
    generatedAt: new Date().toISOString()
  };

  if (!config.openai.apiKey) {
    return { ...base, mode: "template", ...buildTemplateDiagnosis(company) };
  }

  const systemPrompt =
    "Voce e um consultor de marketing digital especializado em agencias de trafego pago. " +
    "Responda APENAS com JSON valido sem markdown, seguindo exatamente o schema solicitado. " +
    "Use portugues do Brasil, tom consultivo e objetivo.";

  const userPrompt = JSON.stringify({
    empresa: company.name,
    categoria: company.category,
    cidade: company.city,
    nota: company.rating,
    avaliacoes: company.reviewCount,
    score_oportunidade: company.score,
    oportunidades: company.detectedOpportunities,
    sugestoes: company.suggestions,
    tem_site: Boolean(company.website),
    tem_ssl: company.hasSsl,
    pagespeed: company.pageSpeed,
    tem_google_ads: company.hasGoogleAds,
    tem_pixel: company.metaPixel,
    tem_ga4: company.hasGA4,
    schema_resposta: {
      summary: "string (2-3 frases resumindo o diagnostico)",
      whatsapp_copy: "string (mensagem pronta para enviar via WhatsApp, max 300 chars, tom humano e direto)",
      email_subject: "string (assunto do email comercial)",
      email_body: "string (corpo do email, 3-4 paragrafos curtos)",
      pitch: "string (pitch verbal de 30 segundos)",
      call_script: "string (script de ligacao fria, com abertura, qualificacao e fechamento)",
      suggested_services: "array de 3-5 strings com servicos recomendados"
    }
  });

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.openai.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: config.openai.model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      return { ...base, mode: "template", ...buildTemplateDiagnosis(company) };
    }

    const payload = await response.json();
    const raw: DiagnosisPayload = JSON.parse(payload.choices?.[0]?.message?.content ?? "{}");

    return {
      ...base,
      mode: "openai",
      summary: raw.summary ?? "",
      whatsappCopy: raw.whatsapp_copy ?? "",
      emailSubject: raw.email_subject ?? "",
      emailBody: raw.email_body ?? "",
      pitch: raw.pitch ?? "",
      callScript: raw.call_script ?? "",
      suggestedServices: raw.suggested_services ?? []
    };
  } catch {
    return { ...base, mode: "template", ...buildTemplateDiagnosis(company) };
  }
}

function buildTemplateDiagnosis(company: Company): Omit<CommercialDiagnosis, "companyId" | "mode" | "generatedAt"> {
  const opportunity = company.detectedOpportunities[0] ?? "A empresa possui oportunidades de melhoria na presenca digital.";
  const service = company.suggestions[0] ?? "Gestao de trafego pago";

  return {
    summary: `${company.name} apresenta score ${company.score}/100 com oportunidade ${company.opportunityLevel} de captacao de clientes via trafego pago. Principal lacuna: ${opportunity}`,
    whatsappCopy: `Ola! Analisei a presenca digital de ${company.name} e identifiquei oportunidades de crescimento. Posso mostrar um diagnostico rapido? Leva menos de 10 minutos.`,
    emailSubject: `Diagnostico digital gratuito para ${company.name}`,
    emailBody: `Ola,\n\nRealizei uma analise da presenca digital de ${company.name} e identifiquei pontos importantes que podem impactar diretamente na captacao de clientes.\n\nPrincipal oportunidade: ${opportunity}\n\nCom uma estrategia de trafego pago bem estruturada, podemos ampliar o alcance e gerar mais contatos qualificados para o seu negocio.\n\nVoce teria 15 minutos para uma conversa rapida esta semana?\n\nAtenciosamente`,
    pitch: `Trabalho com agencia de trafego pago especializada em ${company.category}. Analisei o perfil de ${company.name} e identifiquei que ${opportunity}. Em media, clientes parecidos com voce dobraram os contatos em 90 dias.`,
    callScript: `Abertura: "Ola, posso falar com o responsavel pelo marketing ou pela area comercial?"\n\nQualificacao: "Atualmente voces utilizam alguma estrategia de anuncios no Google ou redes sociais?"\n\nApresentacao: "Realizei uma analise do perfil digital de ${company.name} e identifiquei ${opportunity}. Posso apresentar um plano de acao?"\n\nFechamento: "Que tal marcarmos 20 minutos esta semana para eu mostrar o diagnostico completo sem compromisso?"`,
    suggestedServices: [
      service,
      "Google Ads — campanhas de busca local",
      "Meta Ads — campanhas de conversao",
      "Otimizacao de Google Business Profile",
      "Pagina de captura com rastreamento"
    ]
  };
}
