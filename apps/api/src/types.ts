export type CrmStatus =
  | "Novo Lead"
  | "Contatado"
  | "Em negociação"
  | "Reunião marcada"
  | "Proposta enviada"
  | "Fechado"
  | "Perdido";

export type OpportunityLevel = "Alta" | "Media" | "Baixa";

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
  latitude?: number;
  longitude?: number;
  hasGoogleAds?: boolean;
  hasDescription?: boolean;
  hasRecentPhotos?: boolean;
  hasRecentPosts?: boolean;
  respondsReviews?: boolean;
  // website signals (basic)
  hasSsl?: boolean;
  isResponsive?: boolean;
  pageSpeed?: number;
  metaPixel?: boolean;
  googleTagManager?: boolean;
  googleAnalytics?: boolean;
  seoBasics?: boolean;
  // Phase 3 — deep scan signals
  hasGA4?: boolean;
  ga4MeasurementId?: string;
  gtmContainerId?: string;
  metaPixelId?: string;
  hasConversionEvents?: boolean;
  conversionEvents?: string[];
  hasH1?: boolean;
  hasCanonical?: boolean;
  hasOpenGraph?: boolean;
  hasStructuredData?: boolean;
  hasSitemap?: boolean;
  lcp?: number;
  cls?: number;
  fcp?: number;
  // composite scores
  maturityScore?: number;
  commercialScore?: number;
  paidTrafficScore?: number;
  enrichmentStatus?: EnrichmentStatus;
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

export interface CreditAccount {
  balance: number;
  used: number;
  plan: string;
  resetAt: string;
}

export interface WebsiteScan {
  url: string;
  scannedAt: string;
  hasSsl: boolean;
  isResponsive: boolean;
  hasGA4: boolean;
  ga4MeasurementId?: string;
  hasGTM: boolean;
  gtmContainerId?: string;
  hasMetaPixel: boolean;
  metaPixelId?: string;
  hasConversionEvents: boolean;
  conversionEvents: string[];
  hasTitle: boolean;
  titleText?: string;
  hasMetaDescription: boolean;
  hasH1: boolean;
  h1Text?: string;
  hasCanonical: boolean;
  hasRobotsMeta: boolean;
  hasOpenGraph: boolean;
  hasStructuredData: boolean;
  hasSitemap: boolean;
  pageSpeed: number;
  lcp?: number;
  cls?: number;
  fcp?: number;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  youtube?: string;
  maturityScore: number;
  commercialScore: number;
  paidTrafficScore: number;
}

export interface GbpProfile {
  status: "not_configured" | "configured" | "authorized";
  message: string;
  data?: {
    reviewCount?: number;
    averageRating?: number;
    hasPhotos?: boolean;
    hasPosts?: boolean;
    hasQA?: boolean;
  };
}

export interface DigitalAudit {
  companyId: string;
  companyName: string;
  website?: string;
  scan?: WebsiteScan;
  maturityScore: number;
  commercialScore: number;
  paidTrafficScore: number;
  opportunityScore: number;
  gbp: GbpProfile;
}
