import { config } from "../config.js";
import { hasSupabase } from "../db/supabase.js";

type IntegrationStatus = "ok" | "configured" | "not_configured" | "error";

function statusFromConfig(configured: boolean): IntegrationStatus {
  return configured ? "configured" : "not_configured";
}

function configuredMessage(name: string) {
  return `${name}: credencial carregada; teste real da operação ainda é necessário.`;
}

function missingEnv(items: Array<[string, unknown]>) {
  return items.filter(([, value]) => !value).map(([name]) => name);
}

export function getIntegrationStatus() {
  const googleBusinessMissing = missingEnv([
    ["GOOGLE_BUSINESS_PROFILE_CLIENT_ID", config.google.businessProfileClientId],
    ["GOOGLE_BUSINESS_PROFILE_CLIENT_SECRET", config.google.businessProfileClientSecret],
    ["GOOGLE_BUSINESS_PROFILE_REFRESH_TOKEN", config.google.businessProfileRefreshToken]
  ]);

  const integrations = [
    {
      key: "supabase",
      name: "Supabase (Banco de dados)",
      configured: hasSupabase(),
      status: statusFromConfig(hasSupabase()),
      required: false,
      capability: "Persistência de empresas, buscas e notas CRM entre reinícios do servidor.",
      message: hasSupabase() ? configuredMessage("Supabase") : "Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no backend."
    },
    {
      key: "google_places",
      name: "Google Places API",
      configured: Boolean(config.google.placesKey),
      status: statusFromConfig(Boolean(config.google.placesKey)),
      required: true,
      capability: "Busca empresas no Google por cidade, estado, segmento e palavra-chave.",
      message: config.google.placesKey ? configuredMessage("Google Places") : "Configure GOOGLE_PLACES_API_KEY no backend."
    },
    {
      key: "google_maps",
      name: "Google Maps API",
      configured: Boolean(config.google.mapsKey || config.google.placesKey),
      status: statusFromConfig(Boolean(config.google.mapsKey || config.google.placesKey)),
      required: true,
      capability: "Gera links, coordenadas e contexto local dos leads.",
      message: config.google.mapsKey
        ? configuredMessage("Google Maps")
        : config.google.placesKey
          ? "Google Places configurado; o mapa incorporado não comprova uma chamada autenticada à API Maps."
          : "Configure GOOGLE_MAPS_API_KEY ou GOOGLE_PLACES_API_KEY no backend."
    },
    {
      key: "google_business_profile",
      name: "Google Business Profile API",
      configured: googleBusinessMissing.length === 0,
      status: googleBusinessMissing.length === 0 ? "configured" as const : "not_configured" as const,
      required: false,
      capability: "Base preparada para OAuth e leitura de contas autorizadas do Google Business Profile.",
      message: googleBusinessMissing.length === 0
        ? configuredMessage("Google Business Profile OAuth")
        : "Google Business Profile inativo: credenciais OAuth ausentes no backend.",
      missingEnv: googleBusinessMissing
    },
    {
      key: "pagespeed",
      name: "Google PageSpeed Insights API",
      configured: Boolean(config.google.pageSpeedKey),
      status: statusFromConfig(Boolean(config.google.pageSpeedKey)),
      required: false,
      capability: "Analisa performance mobile e alimenta score de oportunidade.",
      message: config.google.pageSpeedKey ? configuredMessage("Google PageSpeed") : "Configure GOOGLE_PAGESPEED_API_KEY no backend."
    },
    {
      key: "whatsapp",
      name: "WhatsApp Cloud API",
      configured: Boolean(config.whatsapp.token && config.whatsapp.phoneNumberId),
      status: statusFromConfig(Boolean(config.whatsapp.token && config.whatsapp.phoneNumberId)),
      required: false,
      capability: "Envia mensagens pelo WhatsApp Cloud API ou gera link wa.me quando não configurado.",
      message: config.whatsapp.token && config.whatsapp.phoneNumberId ? configuredMessage("WhatsApp Cloud") : "wa.me segue disponível; Cloud API exige WHATSAPP_CLOUD_TOKEN e WHATSAPP_PHONE_NUMBER_ID."
    },
    {
      key: "openai",
      name: "OpenAI API",
      configured: Boolean(config.openai.apiKey),
      status: statusFromConfig(Boolean(config.openai.apiKey)),
      required: false,
      capability: "Gera diagnósticos comerciais personalizados para cada empresa.",
      message: config.openai.apiKey ? configuredMessage("OpenAI") : "Configure OPENAI_API_KEY no backend."
    },
    {
      key: "anthropic",
      name: "Anthropic API",
      configured: Boolean(config.anthropic.apiKey),
      status: statusFromConfig(Boolean(config.anthropic.apiKey)),
      required: false,
      capability: "Fornecedor alternativo de IA para continuidade dos diagnósticos comerciais.",
      message: config.anthropic.apiKey ? configuredMessage("Anthropic") : "Configure ANTHROPIC_API_KEY no backend."
    },
    {
      key: "econodata",
      name: "Econodata",
      configured: Boolean(config.enrichment.econodataApiKey && config.enrichment.econodataApiUrl),
      status: statusFromConfig(Boolean(config.enrichment.econodataApiKey && config.enrichment.econodataApiUrl)),
      required: false,
      capability: "Enriquecimento de CNPJ, razão social e dados cadastrais via endpoint oficial configurado.",
      message: config.enrichment.econodataApiKey && config.enrichment.econodataApiUrl ? configuredMessage("Econodata") : "Configure ECONODATA_API_URL e ECONODATA_API_KEY no backend."
    },
    {
      key: "apollo",
      name: "Apollo.io",
      configured: Boolean(config.enrichment.apolloApiKey),
      status: statusFromConfig(Boolean(config.enrichment.apolloApiKey)),
      required: false,
      capability: "Enriquecimento automatizado de organização e decisores B2B por domínio/site.",
      message: config.enrichment.apolloApiKey ? "Apollo: credencial carregada; operação e permissões dependem do plano/API da conta e ainda precisam de teste real." : "Configure APOLLO_API_KEY no backend."
    },
    {
      key: "bling",
      name: "Bling ERP",
      configured: Boolean(config.marketplace.blingClientId && config.marketplace.blingClientSecret),
      status: statusFromConfig(Boolean(config.marketplace.blingClientId && config.marketplace.blingClientSecret)),
      required: false,
      capability: "OAuth preparado para sincronizar contatos, produtos e pedidos quando BLING_CLIENT_ID e BLING_CLIENT_SECRET estiverem no Render.",
      message: config.marketplace.blingClientId && config.marketplace.blingClientSecret ? configuredMessage("Bling OAuth") : "Configure BLING_CLIENT_ID e BLING_CLIENT_SECRET no backend."
    },
    {
      key: "rdstation",
      name: "RD Station",
      configured: Boolean(config.marketplace.rdStationClientId && config.marketplace.rdStationClientSecret),
      status: statusFromConfig(Boolean(config.marketplace.rdStationClientId && config.marketplace.rdStationClientSecret)),
      required: false,
      capability: "OAuth preparado para enviar leads quentes e eventos comerciais quando RDSTATION_CLIENT_ID e RDSTATION_CLIENT_SECRET estiverem no Render.",
      message: config.marketplace.rdStationClientId && config.marketplace.rdStationClientSecret ? configuredMessage("RD Station OAuth") : "Configure RDSTATION_CLIENT_ID e RDSTATION_CLIENT_SECRET no backend."
    },
    {
      key: "stripe",
      name: "Stripe",
      configured: Boolean(config.stripe.secretKey),
      status: statusFromConfig(Boolean(config.stripe.secretKey)),
      required: false,
      capability: "Pagamentos, assinaturas e webhooks de faturamento.",
      message: config.stripe.secretKey ? configuredMessage("Stripe") : "Configure STRIPE_SECRET_KEY no backend."
    },
    {
      key: "smtp",
      name: "E-mail transacional (SMTP)",
      configured: Boolean(config.smtp.host && config.smtp.user && config.smtp.pass),
      status: statusFromConfig(Boolean(config.smtp.host && config.smtp.user && config.smtp.pass)),
      required: false,
      capability: "E-mails transacionais e notificações fora do fluxo Supabase Auth.",
      message: config.smtp.host && config.smtp.user && config.smtp.pass ? configuredMessage("SMTP") : "Configure SMTP_HOST, SMTP_USER e SMTP_PASS no backend."
    },
    {
      key: "meta",
      name: "Meta / WhatsApp Webhooks",
      configured: Boolean(config.meta.appSecret && config.webhookSecret),
      status: statusFromConfig(Boolean(config.meta.appSecret && config.webhookSecret)),
      required: false,
      capability: "Validação criptográfica e verificação dos webhooks da Meta.",
      message: config.meta.appSecret && config.webhookSecret ? configuredMessage("Meta Webhooks") : "Configure META_APP_SECRET e WHATSAPP_VERIFY_TOKEN no backend."
    }
  ];

  return integrations;
}
