import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { config } from "../config.js";
import { getSupabase } from "../db/supabase.js";
import { getRequestWorkspaceId } from "../middleware/session.js";
import { saveCompanies, searchCompaniesWithMeta, updateCompany } from "../services/companyStore.js";
import { calculateOpportunityScore } from "../services/scoring.js";
import { scanWebsite } from "../services/websiteScanner.js";
import { Company, SearchRequest, WebsiteScan } from "../types.js";

const router = Router();

const discoverySearchSchema = z.object({
  companyName: z.string().optional(),
  segment: z.string().optional(),
  keyword: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radiusKm: z.coerce.number().min(0.1).max(50).optional()
});

const websiteScanSchema = z.object({
  url: z.string().min(3),
  companyId: z.string().optional()
});

const opportunitiesSchema = z.object({
  company: z.record(z.unknown()).optional(),
  companyId: z.string().optional(),
  websiteScan: z.record(z.unknown()).optional()
});

const socialScanSchema = z.object({
  website: z.string().optional(),
  domain: z.string().optional(),
  companyName: z.string().optional(),
  companyId: z.string().optional()
});

router.post("/search", async (req, res, next) => {
  try {
    const input = discoverySearchSchema.parse(req.body ?? {}) as SearchRequest;
    const workspaceId = getRequestWorkspaceId(req);
    const result = await searchCompaniesWithMeta(input, workspaceId);
    await logDiscoveryRun(workspaceId, input, result.source, result.companies.length, { warning: result.warning });
    return res.json({
      source: result.source,
      warning: result.warning,
      companies: result.companies.map(publicCompany)
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/details/:placeId", async (req, res, next) => {
  try {
    const placeId = String(req.params.placeId || "").trim();
    if (!placeId) return res.status(400).json({ message: "Informe o placeId." });

    const stored = await findCompanyByPlaceId(placeId, getRequestWorkspaceId(req));
    if (stored) return res.json({ source: "crm", company: publicCompany(stored) });

    if (!config.google.placesKey) {
      return res.status(503).json({
        message: "Google Places indisponível: configure GOOGLE_PLACES_API_KEY ou GOOGLE_PLACES_KEY no backend.",
        code: "KEY_NOT_CONFIGURED"
      });
    }

    const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
      headers: {
        "X-Goog-Api-Key": config.google.placesKey,
        "X-Goog-FieldMask":
          "id,displayName,formattedAddress,nationalPhoneNumber,internationalPhoneNumber,websiteUri,rating,userRatingCount,googleMapsUri,primaryTypeDisplayName,location,businessStatus,regularOpeningHours"
      }
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        message: payload?.error?.message || `Google Places retornou HTTP ${response.status}.`,
        code: payload?.error?.status
      });
    }

    const place = await response.json() as Record<string, any>;
    const company = placeToCompany(place);
    return res.json({ source: "google_places", company: publicCompany(company) });
  } catch (error) {
    return next(error);
  }
});

router.post("/scan-website", async (req, res, next) => {
  try {
    const body = websiteScanSchema.parse(req.body ?? {});
    const scan = await scanWebsite(body.url);
    if (body.companyId) {
      await updateCompany(body.companyId, websiteScanToCompanyPatch(scan), getRequestWorkspaceId(req));
    }
    return res.json({ scan });
  } catch (error) {
    return next(error);
  }
});

router.post("/opportunities", async (req, res, next) => {
  try {
    const body = opportunitiesSchema.parse(req.body ?? {});
    const company = body.companyId
      ? await findCompanyById(body.companyId, getRequestWorkspaceId(req))
      : body.company as Partial<Company> | undefined;
    if (!company) return res.status(400).json({ message: "Informe companyId ou company." });
    const scan = (body.websiteScan ?? {}) as Partial<WebsiteScan>;
    const score = calcDigitalScore({ ...company, ...websiteScanToCompanyPatch(scan as WebsiteScan) });
    return res.json(score);
  } catch (error) {
    return next(error);
  }
});

router.post("/scan-social", async (req, res, next) => {
  try {
    const body = socialScanSchema.parse(req.body ?? {});
    const company = body.companyId ? await findCompanyById(body.companyId, getRequestWorkspaceId(req)) : null;
    const website = body.website || company?.website || "";
    const scan = website ? await scanWebsite(website) : null;
    const companyName = body.companyName || company?.name || "";
    const domain = normalizeDomain(body.domain || website);
    const social = {
      instagram: scan?.instagram,
      facebook: scan?.facebook,
      linkedin: scan?.linkedin,
      youtube: scan?.youtube,
      searches: {
        linkedin: companyName ? `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(companyName)}` : undefined,
        google: companyName ? `https://www.google.com/search?q=${encodeURIComponent(`${companyName} ${domain}`.trim())}` : undefined
      }
    };
    if (body.companyId) {
      await updateCompany(body.companyId, {
        instagram: social.instagram,
        facebook: social.facebook,
        linkedin: social.linkedin,
        youtube: social.youtube,
        socialScan: social
      } as Partial<Company>, getRequestWorkspaceId(req));
    }
    return res.json({ social });
  } catch (error) {
    return next(error);
  }
});

router.post("/add-to-crm", async (req, res, next) => {
  try {
    const body = z.object({ company: z.record(z.unknown()) }).parse(req.body ?? {});
    const company = normalizeIncomingCompany(body.company);
    const saved = await saveCompanies([company], getRequestWorkspaceId(req));
    return res.status(201).json({ company: publicCompany(saved[0]) });
  } catch (error) {
    return next(error);
  }
});

export function calcDigitalScore(company: Partial<Company>) {
  return calculateOpportunityScore(company);
}

function placeToCompany(place: Record<string, any>): Company {
  const phone = normalizePhone(place.nationalPhoneNumber || place.internationalPhoneNumber || "");
  const base: Company = {
    id: place.id || `place-${randomUUID()}`,
    name: place.displayName?.text || "Empresa sem nome",
    category: place.primaryTypeDisplayName?.text || "Empresa",
    city: "",
    state: "",
    address: place.formattedAddress || "",
    phone,
    whatsapp: normalizeWhatsapp(phone),
    website: place.websiteUri,
    rating: place.rating,
    reviewCount: place.userRatingCount,
    mapsUrl: place.googleMapsUri,
    latitude: place.location?.latitude,
    longitude: place.location?.longitude,
    status: "Novo Lead",
    score: 0,
    opportunityLevel: "Baixa",
    detectedOpportunities: [],
    suggestions: [],
    notes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: "google_places"
  };
  return {
    ...base,
    ...calculateOpportunityScore(base),
    placeId: place.id,
    googlePlaceId: place.id,
    openingHours: place.regularOpeningHours ?? {},
    businessStatus: place.businessStatus
  } as Company;
}

function normalizeIncomingCompany(raw: Record<string, unknown>): Company {
  const now = new Date().toISOString();
  const id = String(raw.id || raw.placeId || raw.googlePlaceId || `discovery-${randomUUID()}`);
  const company = {
    id,
    name: String(raw.name || "Empresa sem nome"),
    category: String(raw.category || "Empresa"),
    city: String(raw.city || ""),
    state: String(raw.state || ""),
    address: String(raw.address || ""),
    phone: emptyToUndefined(raw.phone),
    whatsapp: emptyToUndefined(raw.whatsapp),
    website: emptyToUndefined(raw.website),
    instagram: emptyToUndefined(raw.instagram),
    facebook: emptyToUndefined(raw.facebook),
    linkedin: emptyToUndefined(raw.linkedin),
    youtube: emptyToUndefined(raw.youtube),
    rating: numericOrUndefined(raw.rating),
    reviewCount: numericOrUndefined(raw.reviewCount),
    mapsUrl: emptyToUndefined(raw.mapsUrl),
    latitude: numericOrUndefined(raw.latitude),
    longitude: numericOrUndefined(raw.longitude),
    status: "Novo Lead",
    score: 0,
    opportunityLevel: "Baixa",
    detectedOpportunities: [],
    suggestions: [],
    notes: [],
    source: "google_places",
    createdAt: now,
    updatedAt: now,
    placeId: raw.placeId || raw.googlePlaceId || id,
    googlePlaceId: raw.googlePlaceId || raw.placeId || id
  } as Company;
  return { ...company, ...calculateOpportunityScore(company) };
}

function websiteScanToCompanyPatch(scan: Partial<WebsiteScan>): Partial<Company> {
  return {
    hasSsl: scan.hasSsl,
    isResponsive: scan.isResponsive,
    hasGA4: scan.hasGA4,
    ga4MeasurementId: scan.ga4MeasurementId,
    googleTagManager: scan.hasGTM,
    gtmContainerId: scan.gtmContainerId,
    metaPixel: scan.hasMetaPixel,
    metaPixelId: scan.metaPixelId,
    hasGoogleAds: scan.hasGoogleAds,
    hasConversionEvents: scan.hasConversionEvents,
    conversionEvents: scan.conversionEvents,
    hasH1: scan.hasH1,
    hasCanonical: scan.hasCanonical,
    hasOpenGraph: scan.hasOpenGraph,
    hasStructuredData: scan.hasStructuredData,
    hasSitemap: scan.hasSitemap,
    pageSpeed: scan.pageSpeed,
    maturityScore: scan.maturityScore,
    commercialScore: scan.commercialScore,
    paidTrafficScore: scan.paidTrafficScore,
    instagram: scan.instagram,
    facebook: scan.facebook,
    linkedin: scan.linkedin,
    youtube: scan.youtube,
    websiteScan: scan
  } as Partial<Company>;
}

async function findCompanyByPlaceId(placeId: string, workspaceId: string) {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb
    .from("nodere_companies")
    .select("*")
    .eq("workspace_id", workspaceId)
    .or(`id.eq.${placeId},place_id.eq.${placeId},google_place_id.eq.${placeId}`)
    .maybeSingle();
  return data ? publicCompanyFromRow(data) : null;
}

async function findCompanyById(id: string, workspaceId: string) {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb
    .from("nodere_companies")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", id)
    .maybeSingle();
  return data ? publicCompanyFromRow(data) : null;
}

async function logDiscoveryRun(workspaceId: string, input: SearchRequest, source: string, resultCount: number, metadata: Record<string, unknown>) {
  const sb = getSupabase();
  if (!sb) return;
  try {
    await sb.from("nodere_discovery_runs").insert({
      workspace_id: workspaceId,
      query: [input.companyName, input.segment, input.keyword, input.city, input.state].filter(Boolean).join(" "),
      source,
      result_count: resultCount,
      metadata
    });
  } catch {
    // Discovery history must never block the search flow.
  }
}

function publicCompany(company: Company) {
  return company;
}

function publicCompanyFromRow(row: Record<string, unknown>) {
  const signals = row.digital_signals as Record<string, unknown> | undefined;
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    city: row.city,
    state: row.state,
    address: row.address,
    phone: row.phone,
    whatsapp: row.whatsapp,
    website: row.website,
    instagram: row.instagram,
    facebook: row.facebook,
    linkedin: row.linkedin,
    youtube: row.youtube,
    rating: row.rating,
    reviewCount: row.review_count,
    mapsUrl: row.maps_url,
    latitude: row.latitude,
    longitude: row.longitude,
    status: row.status,
    score: row.score,
    opportunityLevel: row.opportunity_level,
    detectedOpportunities: row.detected_opportunities || [],
    suggestions: row.suggestions || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(signals || {})
  } as Company;
}

function normalizeDomain(value?: string) {
  if (!value) return "";
  try {
    const url = value.startsWith("http") ? new URL(value) : new URL(`https://${value}`);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return value.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  }
}

function normalizePhone(phone?: string) {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (!digits) return undefined;
  return digits.startsWith("55") ? `+${digits}` : `+55${digits}`;
}

function normalizeWhatsapp(phone?: string) {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (!digits) return undefined;
  const local = digits.startsWith("55") ? digits.slice(2) : digits;
  if (local.length === 11 && local[2] === "9") return digits.startsWith("55") ? `+${digits}` : `+55${digits}`;
  return undefined;
}

function emptyToUndefined(value: unknown) {
  const text = String(value || "").trim();
  return text || undefined;
}

function numericOrUndefined(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export default router;
