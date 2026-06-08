import { config } from "../config.js";
import { hasSupabase } from "../db/supabase.js";

type IntegrationStatus = "ok" | "not_configured" | "error";

function statusFromConfig(configured: boolean): IntegrationStatus {
  return configured ? "ok" : "not_configured";
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
      message: hasSupabase() ? "Banco conectado para persistência real." : "Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no backend."
    },
    {
      key: "google_places",
      name: "Google Places API",
      configured: Boolean(config.google.placesKey),
      status: statusFromConfig(Boolean(config.google.placesKey)),
      required: true,
      capability: "Busca empresas no Google por cidade, estado, segmento e palavra-chave.",
      message: config.google.placesKey ? "Chave carregada no backend." : "Configure GOOGLE_PLACES_API_KEY no backend."
    },
    {
      key: "google_maps",
      name: "Google Maps API",
      configured: Boolean(config.google.mapsKey || config.google.placesKey),
      status: statusFromConfig(Boolean(config.google.mapsKey || config.google.placesKey)),
      required: true,
      capability: "Gera links, coordenadas e contexto local dos leads.",
      message: config.google.mapsKey
        ? "Chave Maps carregada no backend."
        : config.google.placesKey
          ? "Operando com dados de localização do Google Places e mapa visual incorporado sem chave pública."
          : "Configure GOOGLE_MAPS_API_KEY ou GOOGLE_PLACES_API_KEY no backend."
    },
    {
      key: "google_business_profile",
      name: "Google Business Profile API",
      configured: googleBusinessMissing.length === 0,
      status: googleBusinessMissing.length === 0 ? "ok" as const : "not_configured" as const,
      required: false,
      capability: "Base preparada para OAuth e leitura de contas autorizadas do Google Business Profile.",
      message: googleBusinessMissing.length === 0
        ? "OAuth do Google Business Profile configurado."
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
      message: config.google.pageSpeedKey ? "Chave carregada no backend." : "Configure GOOGLE_PAGESPEED_API_KEY no backend."
    },
    {
      key: "whatsapp",
      name: "WhatsApp Cloud API",
      configured: Boolean(config.whatsapp.token && config.whatsapp.phoneNumberId),
      status: statusFromConfig(Boolean(config.whatsapp.token && config.whatsapp.phoneNumberId)),
      required: false,
      capability: "Envia mensagens pelo WhatsApp Cloud API ou gera link wa.me quando não configurado.",
      message: config.whatsapp.token && config.whatsapp.phoneNumberId ? "WhatsApp Cloud configurado." : "wa.me segue disponível; Cloud API exige WHATSAPP_CLOUD_TOKEN e WHATSAPP_PHONE_NUMBER_ID."
    },
    {
      key: "openai",
      name: "OpenAI API",
      configured: Boolean(config.openai.apiKey),
      status: statusFromConfig(Boolean(config.openai.apiKey)),
      required: false,
      capability: "Gera diagnósticos comerciais personalizados para cada empresa.",
      message: config.openai.apiKey ? "OpenAI configurada no backend." : "Configure OPENAI_API_KEY no backend."
    },
    {
      key: "econodata",
      name: "Econodata",
      configured: Boolean(config.enrichment.econodataApiKey && config.enrichment.econodataApiUrl),
      status: statusFromConfig(Boolean(config.enrichment.econodataApiKey && config.enrichment.econodataApiUrl)),
      required: false,
      capability: "Enriquecimento de CNPJ, razão social e dados cadastrais via endpoint oficial configurado.",
      message: config.enrichment.econodataApiKey && config.enrichment.econodataApiUrl ? "Econodata configurado." : "Configure ECONODATA_API_URL e ECONODATA_API_KEY no backend."
    },
    {
      key: "apollo",
      name: "Apollo.io",
      configured: Boolean(config.enrichment.apolloApiKey),
      status: statusFromConfig(Boolean(config.enrichment.apolloApiKey)),
      required: false,
      capability: "Enriquecimento automatizado de organização e decisores B2B por domínio/site.",
      message: config.enrichment.apolloApiKey ? "Apollo configurado; permissões dependem do plano/API da conta." : "Configure APOLLO_API_KEY no backend."
    },
    {
      key: "bling",
      name: "Bling ERP",
      configured: Boolean(config.marketplace.blingClientId && config.marketplace.blingClientSecret),
      status: statusFromConfig(Boolean(config.marketplace.blingClientId && config.marketplace.blingClientSecret)),
      required: false,
      capability: "OAuth preparado para sincronizar contatos, produtos e pedidos quando BLING_CLIENT_ID e BLING_CLIENT_SECRET estiverem no Render.",
      message: config.marketplace.blingClientId && config.marketplace.blingClientSecret ? "OAuth Bling configurado." : "Configure BLING_CLIENT_ID e BLING_CLIENT_SECRET no backend."
    },
    {
      key: "rdstation",
      name: "RD Station",
      configured: Boolean(config.marketplace.rdStationClientId && config.marketplace.rdStationClientSecret),
      status: statusFromConfig(Boolean(config.marketplace.rdStationClientId && config.marketplace.rdStationClientSecret)),
      required: false,
      capability: "OAuth preparado para enviar leads quentes e eventos comerciais quando RDSTATION_CLIENT_ID e RDSTATION_CLIENT_SECRET estiverem no Render.",
      message: config.marketplace.rdStationClientId && config.marketplace.rdStationClientSecret ? "OAuth RD Station configurado." : "Configure RDSTATION_CLIENT_ID e RDSTATION_CLIENT_SECRET no backend."
    }
  ];

  return integrations;
}
