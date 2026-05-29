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
  // Phase 3
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
  maturityScore?: number;
  commercialScore?: number;
  paidTrafficScore?: number;
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
}

export interface MissingAsset {
  type: string;
  label: string;
  priority: "high" | "medium" | "low";
  description: string;
}

export interface AdsReadiness {
  score: number;
  hasPixel: boolean;
  hasConversionTracking: boolean;
  hasGA4: boolean;
  hasGTM: boolean;
  hasLandingPage: boolean;
  isLandingPageFast: boolean;
  isResponsive: boolean;
  missingAssets: MissingAsset[];
  recommendations: string[];
}

export interface KeywordSuggestion {
  keyword: string;
  intent: "local" | "service" | "competitor" | "informational" | "urgent";
  competition: "low" | "medium" | "high";
  estimatedMonthlySearches: string;
  suggestedBidBRL?: string;
}

export interface GbpInsights {
  status: "not_configured" | "configured" | "authorized" | "error";
  message: string;
  data?: {
    accountName?: string;
    locationCount?: number;
    reviewCount?: number;
    averageRating?: number;
    hasPhotos?: boolean;
    hasRecentPosts?: boolean;
  };
  error?: string;
}

export interface GoogleIntelligence {
  companyId: string;
  companyName: string;
  adsConnectionStatus: "not_configured" | "configured" | "connected";
  adsCustomerId?: string;
  adsReadiness: AdsReadiness;
  keywords: KeywordSuggestion[];
  gbp: GbpInsights;
}

export interface DigitalAudit {
  companyId: string;
  companyName: string;
  website?: string;
  scan: WebsiteScan | null;
  maturityScore: number;
  commercialScore: number;
  paidTrafficScore: number;
  opportunityScore: number;
  gbp: GbpProfile;
}

export interface CreditAccount {
  balance: number;
  used: number;
  plan: string;
  resetAt: string;
}

// Phase 5 — Commercial Automation

export interface CommercialDiagnosis {
  companyId: string;
  mode: "openai" | "template";
  summary: string;
  whatsappCopy: string;
  emailSubject: string;
  emailBody: string;
  pitch: string;
  callScript: string;
  suggestedServices: string[];
  generatedAt: string;
}

export type MessageDirection = "inbound" | "outbound";
export type MessageStatus = "sent" | "delivered" | "read" | "failed";
export type ConversationStatus = "open" | "resolved" | "pending";

export interface InboxMessage {
  id: string;
  conversationPhone: string;
  direction: MessageDirection;
  body: string;
  status: MessageStatus;
  providerMessageId?: string;
  createdAt: string;
}

export interface InboxConversation {
  phone: string;
  companyId?: string;
  companyName?: string;
  status: ConversationStatus;
  slaDeadline: string;
  slaStatus?: "ok" | "urgent" | "overdue";
  assignedTo?: string;
  lastMessageAt: string;
  messageCount: number;
  lastMessage: InboxMessage | null;
  messages: InboxMessage[];
}

export interface SequenceStep {
  stepIndex: number;
  delayDays: number;
  channel: "whatsapp" | "email";
  subject?: string;
  body: string;
}

export interface EmailSequenceTemplate {
  id: string;
  name: string;
  description: string;
  steps: SequenceStep[];
}

export interface SequenceInstance {
  id: string;
  companyId: string;
  companyName: string;
  templateId: string;
  templateName: string;
  activatedAt: string;
  currentStep: number;
  nextStepAt: string | null;
  completedSteps: number[];
  status: "active" | "completed" | "cancelled";
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
