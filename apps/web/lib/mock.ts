import { Company, DashboardMetrics } from "./types";

export const mockCompanies: Company[] = [
  {
    id: "cmp-001",
    name: "Concreforte Solucoes em Concreto",
    category: "Concreteira",
    city: "Porto Alegre",
    state: "RS",
    address: "Av. Sertorio, 1840 - Porto Alegre, RS",
    phone: "+555133334444",
    whatsapp: "+5551999887766",
    website: "",
    rating: 3.9,
    reviewCount: 28,
    mapsUrl: "https://maps.google.com/?q=Concreforte+Porto+Alegre",
    hasGoogleAds: false,
    hasDescription: false,
    hasRecentPhotos: false,
    hasRecentPosts: false,
    respondsReviews: false,
    hasSsl: false,
    isResponsive: false,
    pageSpeed: 0,
    metaPixel: false,
    googleTagManager: false,
    googleAnalytics: false,
    seoBasics: false,
    status: "Novo Lead",
    score: 92,
    opportunityLevel: "Alta",
    detectedOpportunities: [
      "Empresa possui nota 3.9 e nao responde avaliacoes.",
      "Empresa sem site e sem Google Ads detectado.",
      "Perfil Google incompleto e sem fotos recentes."
    ],
    suggestions: [
      "Criar landing page local com WhatsApp e prova social.",
      "Otimizar descricao e categorias do Google Business.",
      "Implantar rotina de respostas e captura de avaliacoes."
    ],
    notes: [],
    createdAt: "2026-05-19T12:00:00.000Z",
    updatedAt: "2026-05-22T11:00:00.000Z"
  },
  {
    id: "cmp-002",
    name: "Clinica Sorriso Sul",
    category: "Clinica odontologica",
    city: "Caxias do Sul",
    state: "RS",
    address: "Rua Sinimbu, 820 - Caxias do Sul, RS",
    phone: "+555430001111",
    whatsapp: "",
    website: "https://example.com",
    rating: 4.1,
    reviewCount: 42,
    mapsUrl: "https://maps.google.com/?q=Clinica+Sorriso+Sul",
    hasGoogleAds: false,
    hasDescription: true,
    hasRecentPhotos: true,
    hasRecentPosts: false,
    respondsReviews: false,
    hasSsl: true,
    isResponsive: true,
    pageSpeed: 51,
    metaPixel: false,
    googleTagManager: true,
    googleAnalytics: true,
    seoBasics: true,
    status: "Contatado",
    score: 72,
    opportunityLevel: "Alta",
    detectedOpportunities: [
      "Menos de 50 avaliacoes em segmento altamente competitivo.",
      "Nao foram detectados Google Ads ativos.",
      "Site lento para mobile segundo PageSpeed."
    ],
    suggestions: [
      "Criar campanha Google Ads para intencao local.",
      "Melhorar Core Web Vitals e pagina de agendamento.",
      "Ativar WhatsApp Business como canal principal."
    ],
    notes: [
      {
        id: "note-001",
        companyId: "cmp-002",
        body: "Contato inicial feito. Retornar com diagnostico visual.",
        createdAt: "2026-05-21T14:10:00.000Z"
      }
    ],
    lastContactAt: "2026-05-21T14:10:00.000Z",
    createdAt: "2026-05-18T10:30:00.000Z",
    updatedAt: "2026-05-22T10:20:00.000Z"
  }
];

export const mockDashboard: DashboardMetrics = {
  totalCompanies: 3,
  lowRating: 2,
  withoutWebsite: 1,
  withoutGoogleAds: 2,
  withoutWhatsapp: 1,
  withoutDescription: 1,
  withoutRecentPhotos: 1,
  averageScore: 66,
  hotLeads: 2,
  pipeline: {
    "Novo Lead": 1,
    Contatado: 1,
    "Em negociação": 1
  },
  topOpportunities: mockCompanies
};
