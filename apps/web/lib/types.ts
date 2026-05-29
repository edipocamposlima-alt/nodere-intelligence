export type CrmStatus =
  | "Novo Lead"
  | "Contatado"
  | "Em negociação"
  | "Reunião marcada"
  | "Proposta enviada"
  | "Fechado"
  | "Perdido";

export interface CrmNote {
  id: string;
  companyId: string;
  body: string;
  createdAt: string;
}

export type EnrichmentStatus = "none" | "pending" | "running" | "done" | "error";

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
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  youtube?: string;
  rating?: number;
  reviewCount?: number;
  mapsUrl?: string;
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
  enrichmentStatus?: EnrichmentStatus;
  status: CrmStatus;
  score: number;
  opportunityLevel: "Alta" | "Media" | "Baixa";
  detectedOpportunities: string[];
  suggestions: string[];
  notes: CrmNote[];
  lastContactAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedSearch {
  id: string;
  city: string;
  state?: string;
  segment: string;
  keyword?: string;
  resultCount: number;
  source: "google" | "mock" | "fallback";
  companyIds: string[];
  createdAt: string;
  lastRanAt: string;
}

export interface EnrichmentJob {
  id: string;
  companyId: string;
  companyName: string;
  status: EnrichmentStatus;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

export interface QueueStatus {
  total: number;
  pending: number;
  running: number;
  done: number;
  error: number;
  jobs: EnrichmentJob[];
}

export interface CreditAccount {
  balance: number;
  used: number;
  plan: string;
  resetAt: string;
}

export interface DashboardMetrics {
  totalCompanies: number;
  lowRating: number;
  withoutWebsite: number;
  withoutGoogleAds: number;
  withoutWhatsapp: number;
  withoutDescription: number;
  withoutRecentPhotos: number;
  averageScore: number;
  hotLeads: number;
  pipeline: Record<string, number>;
  topOpportunities: Company[];
}
