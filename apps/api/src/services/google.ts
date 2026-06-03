import { config } from "../config.js";
import { Company, SearchRequest } from "../types.js";
import { calculateOpportunityScore } from "./scoring.js";
import { extractSocialUrl } from "./websiteScanner.js";

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

export class GoogleApiError extends Error {
  status: number;
  code?: string;
  reason?: string;
  activationUrl?: string;

  constructor(message: string, options: { status: number; code?: string; reason?: string; activationUrl?: string }) {
    super(message);
    this.name = "GoogleApiError";
    this.status = options.status;
    this.code = options.code;
    this.reason = options.reason;
    this.activationUrl = options.activationUrl;
  }
}

export async function searchGooglePlaces(input: SearchRequest): Promise<Company[]> {
  if (!config.google.placesKey) {
    throw new GoogleApiError("Chave Google Places não configurada. Defina GOOGLE_API_KEY ou GOOGLE_PLACES_API_KEY no Render.", {
      status: 0,
      code: "KEY_NOT_CONFIGURED",
      reason: "missingKey"
    });
  }

  const query = [input.companyName, input.segment, input.keyword, input.city, input.state].filter(Boolean).join(" ");
  if (isFiniteNumber(input.lat) && isFiniteNumber(input.lng) && isFiniteNumber(input.radiusKm)) {
    return searchGooglePlacesNearby(input);
  }
  if (!query.trim()) {
    throw new GoogleApiError("Informe pelo menos um criterio de busca.", {
      status: 400,
      code: "EMPTY_QUERY",
      reason: "emptyQuery"
    });
  }
  const requestedLimit = Math.min(Math.max(input.limit ?? 60, 1), 100);
  const variants = buildQueryVariants(input, query).slice(0, Math.ceil(requestedLimit / 20) + 1);
  const found = new Map<string, Company>();

  for (const variant of variants) {
    const companies = await searchGooglePlacesBatch(variant, input, Math.min(20, requestedLimit - found.size));
    for (const company of companies) found.set(company.id, company);
    if (found.size >= requestedLimit) break;
  }

  return Array.from(found.values()).slice(0, requestedLimit);
}

export async function geocodeAddress(address: string) {
  const key = config.google.mapsKey || config.google.placesKey;
  if (!key) {
    throw new GoogleApiError("Chave Google Maps/Places não configurada para geocode.", {
      status: 0,
      code: "KEY_NOT_CONFIGURED",
      reason: "missingKey"
    });
  }
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", address);
  url.searchParams.set("key", key);
  const response = await fetch(url);
  if (!response.ok) throw await buildGoogleApiError(response, "Google Geocoding");
  const payload = await response.json() as { status?: string; results?: Array<{ formatted_address?: string; geometry?: { location?: { lat?: number; lng?: number } } }> };
  if (payload.status !== "OK" || !payload.results?.[0]?.geometry?.location) {
    return { status: payload.status || "ZERO_RESULTS", results: [] };
  }
  return {
    status: payload.status,
    results: payload.results.map((item) => ({
      address: item.formatted_address,
      lat: item.geometry?.location?.lat,
      lng: item.geometry?.location?.lng
    }))
  };
}

async function searchGooglePlacesNearby(input: SearchRequest): Promise<Company[]> {
  const placesKey = config.google.placesKey;
  if (!placesKey || !isFiniteNumber(input.lat) || !isFiniteNumber(input.lng) || !isFiniteNumber(input.radiusKm)) return [];
  const query = [input.companyName, input.segment, input.keyword].filter(Boolean).join(" ") || "empresa";
  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": placesKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.googleMapsUri,places.primaryTypeDisplayName,places.location"
    },
    body: JSON.stringify({
      textQuery: query,
      maxResultCount: Math.min(Math.max(input.limit ?? 20, 1), 20),
      locationBias: {
        circle: {
          center: { latitude: input.lat, longitude: input.lng },
          radius: Math.min(Math.max((input.radiusKm ?? 5) * 1000, 100), 50000)
        }
      },
      languageCode: "pt-BR"
    })
  });
  if (!response.ok) throw await buildGoogleApiError(response, "Google Places Nearby");
  const payload = (await response.json()) as { places?: GooglePlace[] };
  return (payload.places ?? []).map((place) => {
    const company = normalizePlace(place, input);
    if (place.location?.latitude && place.location?.longitude) {
      company.distanceKm = haversineKm(input.lat!, input.lng!, place.location.latitude, place.location.longitude);
    }
    return company;
  });
}

async function searchGooglePlacesBatch(query: string, input: SearchRequest, maxResultCount: number): Promise<Company[]> {
  if (maxResultCount <= 0) return [];
  const placesKey = config.google.placesKey;
  if (!placesKey) return [];

  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": placesKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.googleMapsUri,places.primaryTypeDisplayName,places.location"
    },
    body: JSON.stringify({ textQuery: query, languageCode: "pt-BR", maxResultCount })
  });

  if (!response.ok) {
    throw await buildGoogleApiError(response, "Google Places");
  }

  const payload = (await response.json()) as { places?: GooglePlace[] };
  return (payload.places ?? []).map((place) => normalizePlace(place, input));
}

function buildQueryVariants(input: SearchRequest, query: string) {
  const segment = input.segment || input.keyword || input.companyName || "empresa";
  const cityState = [input.city, input.state].filter(Boolean).join(" ");
  return Array.from(new Set([
    query,
    `${segment} em ${cityState}`,
    `${segment} perto de ${cityState}`,
    `${segment} ${cityState} telefone`,
    `${segment} ${cityState} centro`,
    `${input.keyword || segment} ${cityState}`
  ].map((item) => item.trim()).filter(Boolean)));
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
    category: place.primaryTypeDisplayName?.text ?? input.segment ?? "Empresa",
    city: input.city ?? "",
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

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (n: number) => n * Math.PI / 180;
  const radius = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

async function buildGoogleApiError(response: Response, serviceName: string) {
  let payload: any;
  try {
    payload = await response.json();
  } catch {
    payload = undefined;
  }

  const details = Array.isArray(payload?.error?.details) ? payload.error.details : [];
  const errorInfo = details.find((item: any) => item["@type"] === "type.googleapis.com/google.rpc.ErrorInfo");
  const activationUrl = errorInfo?.metadata?.activationUrl;
  const message = payload?.error?.message ?? `${serviceName} failed with status ${response.status}`;

  return new GoogleApiError(message, {
    status: response.status,
    code: payload?.error?.status,
    reason: errorInfo?.reason,
    activationUrl
  });
}
