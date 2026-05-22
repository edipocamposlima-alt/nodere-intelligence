import { config } from "../config.js";

export function getIntegrationStatus() {
  return [
    {
      key: "google_places",
      name: "Google Places API",
      configured: Boolean(config.google.placesKey),
      required: true,
      capability: "Busca empresas no Google por cidade, estado, segmento e palavra-chave."
    },
    {
      key: "google_maps",
      name: "Google Maps API",
      configured: Boolean(config.google.mapsKey),
      required: true,
      capability: "Gera links, coordenadas e contexto local dos leads."
    },
    {
      key: "google_business_profile",
      name: "Google Business Profile API",
      configured: Boolean(
        process.env.GOOGLE_BUSINESS_PROFILE_CLIENT_ID &&
          process.env.GOOGLE_BUSINESS_PROFILE_CLIENT_SECRET &&
          process.env.GOOGLE_BUSINESS_PROFILE_REFRESH_TOKEN
      ),
      required: false,
      capability: "Base preparada para OAuth e leitura de contas autorizadas do Google Business Profile."
    },
    {
      key: "pagespeed",
      name: "Google PageSpeed Insights API",
      configured: Boolean(config.google.pageSpeedKey),
      required: false,
      capability: "Analisa performance mobile e alimenta score de oportunidade."
    },
    {
      key: "whatsapp",
      name: "WhatsApp Cloud API",
      configured: Boolean(config.whatsapp.token && config.whatsapp.phoneNumberId),
      required: false,
      capability: "Envia mensagens pelo WhatsApp Cloud API ou gera link wa.me quando nao configurado."
    },
    {
      key: "openai",
      name: "OpenAI API",
      configured: Boolean(config.openai.apiKey),
      required: false,
      capability: "Gera diagnosticos comerciais personalizados para cada empresa."
    }
  ];
}
