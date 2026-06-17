export const AVAILABLE_INTEGRATIONS = [
  {
    id: "google_maps",
    name: "Google Maps & Places",
    description: "Busca de empresas por localização, visualização em mapa e dados de estabelecimentos.",
    category: "Prospecção",
    credentialLabel: "Credenciais Google Maps e Places",
    docsUrl: "https://console.cloud.google.com",
    requiredPlan: "starter"
  },
  {
    id: "openai",
    name: "OpenAI",
    description: "Motor de IA para diagnósticos, propostas e análises comerciais.",
    category: "IA",
    credentialLabel: "Credencial OpenAI",
    docsUrl: "https://platform.openai.com",
    requiredPlan: "starter"
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Processamento de pagamentos e gestão de assinaturas.",
    category: "Financeiro",
    credentialLabel: "Credenciais Stripe",
    docsUrl: "https://dashboard.stripe.com",
    requiredPlan: "starter"
  },
  {
    id: "whatsapp",
    name: "WhatsApp Cloud API",
    description: "Envio e recebimento de mensagens via WhatsApp integrado ao CRM.",
    category: "Comunicação",
    credentialLabel: "Credenciais WhatsApp Cloud",
    docsUrl: "https://developers.facebook.com/docs/whatsapp",
    requiredPlan: "pro"
  },
  {
    id: "apollo",
    name: "Apollo.io",
    description: "Busca de decisores e enriquecimento de dados empresariais.",
    category: "Prospecção",
    credentialLabel: "Credencial Apollo",
    docsUrl: "https://app.apollo.io",
    requiredPlan: "pro"
  },
  {
    id: "smtp",
    name: "E-mail (SMTP)",
    description: "Envio de e-mails transacionais, notificações e sequências comerciais.",
    category: "Comunicação",
    credentialLabel: "Credenciais de e-mail transacional",
    docsUrl: null,
    requiredPlan: "starter"
  },
  {
    id: "google_business_profile",
    name: "Google Meu Negócio",
    description: "Análise do perfil público de empresas no Google, avaliações e dados locais.",
    category: "Marketing Intelligence",
    credentialLabel: "Credenciais Google Business Profile",
    docsUrl: "https://business.google.com",
    requiredPlan: "pro"
  },
  {
    id: "meta",
    name: "Meta (Facebook/Instagram)",
    description: "Análise de presença e campanhas nas redes sociais Meta.",
    category: "Marketing Intelligence",
    credentialLabel: "Credenciais Meta",
    docsUrl: "https://developers.facebook.com",
    requiredPlan: "agency"
  }
] as const;
