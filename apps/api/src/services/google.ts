import { config } from "../config.js";
import { Company, SearchRequest } from "../types.js";
import { calculateOpportunityScore } from "./scoring.js";

interface GooglePlace {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  primaryTypeDisplayName?: { text?: string };
  location?: { latitude?: number; longitude?: number };
}

export async function searchGooglePlaces(input: SearchRequest): Promise<Company[]> {
  if (!config.google.placesKey) {
    throw new Error("GOOGLE_PLACES_API_KEY is not configured.");
  }

  const query = [input.segment, input.keyword, input.city, input.state].filter(Boolean).join(" ");
  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": config.google.placesKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.googleMapsUri,places.primaryTypeDisplayName,places.location"
    },
    body: JSON.stringify({ textQuery: query, languageCode: "pt-BR", maxResultCount: 12 })
  });

  if (!response.ok) {
    throw new Error(`Google Places failed with status ${response.status}`);
  }

  const payload = (await response.json()) as { places?: GooglePlace[] };
  return (payload.places ?? []).map((place) => normalizePlace(place, input));
}

export async function analyzeWebsite(url?: string) {
  if (!url) {
    return {
      hasSsl: false,
      isResponsive: false,
      pageSpeed: 0,
      metaPixel: false,
      googleTagManager: false,
      googleAnalytics: false,
      seoBasics: false
    };
  }

  const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
  const result = {
    hasSsl: normalizedUrl.startsWith("https://"),
    isResponsive: false,
    pageSpeed: 0,
    metaPixel: false,
    googleTagManager: false,
    googleAnalytics: false,
    seoBasics: false
  };

  try {
    const htmlResponse = await fetch(normalizedUrl, { signal: AbortSignal.timeout(7000) });
    const html = await htmlResponse.text();
    result.metaPixel = /fbq\(|connect\.facebook\.net/i.test(html);
    result.googleTagManager = /googletagmanager\.com\/gtm\.js|GTM-/i.test(html);
    result.googleAnalytics = /google-analytics\.com|gtag\(|G-/i.test(html);
    result.seoBasics = /<title>.+<\/title>/i.test(html) && /name=["']description["']/i.test(html);
    result.isResponsive = /name=["']viewport["']/i.test(html);
  } catch {
    return result;
  }

  if (config.google.pageSpeedKey) {
    try {
      const pageSpeedUrl = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
      pageSpeedUrl.searchParams.set("url", normalizedUrl);
      pageSpeedUrl.searchParams.set("strategy", "mobile");
      pageSpeedUrl.searchParams.set("key", config.google.pageSpeedKey);
      const pageSpeedResponse = await fetch(pageSpeedUrl);
      const payload = await pageSpeedResponse.json();
      result.pageSpeed = Math.round((payload.lighthouseResult?.categories?.performance?.score ?? 0) * 100);
    } catch {
      result.pageSpeed = 0;
    }
  }

  return result;
}

function normalizePlace(place: GooglePlace, input: SearchRequest): Company {
  const digital = {
    hasGoogleAds: false,
    hasDescription: false,
    hasRecentPhotos: false,
    hasRecentPosts: false,
    respondsReviews: false
  };

  const base: Company = {
    id: place.id,
    name: place.displayName?.text ?? "Empresa sem nome",
    category: place.primaryTypeDisplayName?.text ?? input.segment,
    city: input.city,
    state: input.state ?? "",
    address: place.formattedAddress ?? "",
    phone: place.nationalPhoneNumber,
    whatsapp: place.nationalPhoneNumber,
    website: place.websiteUri,
    rating: place.rating,
    reviewCount: place.userRatingCount,
    mapsUrl: place.googleMapsUri,
    latitude: place.location?.latitude,
    longitude: place.location?.longitude,
    status: "Novo Lead",
    notes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    score: 0,
    opportunityLevel: "Baixa",
    detectedOpportunities: [],
    suggestions: [],
    ...digital
  };

  return { ...base, ...calculateOpportunityScore(base) };
}
