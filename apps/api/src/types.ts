export type CrmStatus =
  | "Novo Lead"
  | "Contatado"
  | "Em negociação"
  | "Reunião marcada"
  | "Proposta enviada"
  | "Fechado"
  | "Perdido";

export type OpportunityLevel = "Alta" | "Media" | "Baixa";

export interface Company {
  id: string;
  name: string;
  category: string;
  city: string;
  state: string;
  address: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  mapsUrl?: string;
  latitude?: number;
  longitude?: number;
  hasGoogleAds?: boolean;
  hasDescription?: boolean;
  hasRecentPhotos?: boolean;
  hasRecentPosts?: boolean;
  respondsReviews?: boolean;
  hasSsl?: boolean;
  isResponsive?: boolean;
  pageSpeed?: number;
  metaPixel?: boolean;
  googleTagManager?: boolean;
  googleAnalytics?: boolean;
  seoBasics?: boolean;
  status: CrmStatus;
  score: number;
  opportunityLevel: OpportunityLevel;
  detectedOpportunities: string[];
  suggestions: string[];
  notes: CrmNote[];
  lastContactAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CrmNote {
  id: string;
  companyId: string;
  body: string;
  createdAt: string;
}

export interface SearchRequest {
  city: string;
  state?: string;
  segment: string;
  keyword?: string;
}
