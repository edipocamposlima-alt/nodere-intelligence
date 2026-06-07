export type CrmStatus =
  | "Novo Lead"
  | "Qualificado"
  | "Contatado"
  | "Diagnóstico enviado"
  | "Em negociação"
  | "Reunião marcada"
  | "Proposta enviada"
  | "Negociação"
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
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  cnpj?: string;
  legalName?: string;
  companySize?: string;
  revenueRange?: string;
  decisionMakers?: DecisionMaker[];
  enrichmentSources?: string[];
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

export interface DecisionMaker {
  name?: string;
  title?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  source?: "apollo" | "econodata" | "manual" | "website";
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

// Phase 6 — Revenue Operations

export type PlanId = "demo" | "starter" | "pro" | "agency";

export interface Plan {
  id: PlanId;
  name: string;
  monthlyCredits: number;
  priceMonthly: number;
  features: string[];
  stripePriceId?: string;
  paymentLinkUrl?: string;
}

export interface BillingStatus {
  plan: Plan;
  balance: number;
  used: number;
  resetAt: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: string;
  gated: boolean;
}

export type UsageEventType = "search" | "enrichment" | "diagnosis" | "pdf_export" | "whatsapp_send" | "email_send";

export interface UsageEvent {
  id: string;
  type: UsageEventType;
  amount: number;
  description: string;
  operatorId?: string;
  at: string;
}

export interface Operator {
  id: string;
  name: string;
  email?: string;
  role: "admin" | "operator";
  createdAt: string;
}

export interface OperatorMetrics {
  operatorId: string;
  operatorName: string;
  searchesDone: number;
  leadsEnriched: number;
  contactsMade: number;
  meetingsScheduled: number;
  proposalsSent: number;
  dealsClosed: number;
  dealsLost: number;
  totalPipelineValue: number;
  totalRevenueClosedBRL: number;
  conversionRate: number;
}

export interface OperatorGoal {
  operatorId: string;
  month: string;
  targetSearches: number;
  targetContacts: number;
  targetDeals: number;
  targetRevenueBRL: number;
}

export interface PipelineStageSummary {
  status: string;
  count: number;
  estimatedValueBRL: number;
  conversionProbability: number;
}

export interface PipelineReport {
  stages: PipelineStageSummary[];
  totalLeads: number;
  totalPipelineValueBRL: number;
  avgScore: number;
  generatedAt: string;
}

export interface ForecastReport {
  expectedRevenueBRL: number;
  conservativeBRL: number;
  optimisticBRL: number;
  closedThisMonthBRL: number;
  openOpportunitiesBRL: number;
  avgDealValueBRL: number;
  conversionRate: number;
  generatedAt: string;
}

export interface MonthlyTrend {
  month: string;
  searches: number;
  enrichments: number;
  contacts: number;
  dealsClosed: number;
  revenueBRL: number;
}

export type AuditCategory = "billing" | "permission" | "user" | "data" | "system";

export interface AuditLogEvent {
  id: string;
  category: AuditCategory;
  action: string;
  description: string;
  operatorId?: string;
  metadata?: Record<string, unknown>;
  at: string;
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
