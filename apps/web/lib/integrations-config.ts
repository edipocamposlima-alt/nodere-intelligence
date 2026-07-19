export const AVAILABLE_INTEGRATIONS = [
  {
    id: "supabase",
    name: "Supabase",
    description: "Banco PostgreSQL, Auth e persistência multi-workspace.",
    category: "Dados e autenticação",
    credentialLabel: "Credenciais Supabase",
    docsUrl: "https://supabase.com/dashboard",
    requiredPlan: "starter"
  },
  {
    id: "google_places",
    name: "Google Places",
    description: "Busca real de empresas por localização e segmento.",
    category: "Prospecção",
    credentialLabel: "Credencial Google Places",
    docsUrl: "https://console.cloud.google.com",
    requiredPlan: "starter"
  },
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
    id: "anthropic",
    name: "Anthropic",
    description: "Provedor alternativo de IA para continuidade e fallback.",
    category: "IA",
    credentialLabel: "Credencial Anthropic",
    docsUrl: "https://console.anthropic.com",
    requiredPlan: "pro"
  },
  {
    id: "pagespeed",
    name: "Google PageSpeed Insights",
    description: "Métricas mobile e desktop de performance, SEO, acessibilidade e boas práticas.",
    category: "Inteligência digital",
    credentialLabel: "Credencial PageSpeed",
    docsUrl: "https://console.cloud.google.com",
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
    id: "econodata",
    name: "Econodata",
    description: "Enriquecimento cadastral de empresas brasileiras.",
    category: "Prospecção",
    credentialLabel: "Credenciais Econodata",
    docsUrl: null,
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
  },
  {
    id: "bling",
    name: "Bling ERP",
    description: "OAuth para contatos, produtos e pedidos.",
    category: "ERP",
    credentialLabel: "Credenciais Bling OAuth",
    docsUrl: "https://developer.bling.com.br",
    requiredPlan: "agency"
  },
  {
    id: "rdstation",
    name: "RD Station",
    description: "OAuth para leads e eventos comerciais.",
    category: "Marketing",
    credentialLabel: "Credenciais RD Station OAuth",
    docsUrl: "https://developers.rdstation.com",
    requiredPlan: "agency"
  }
] as const;
