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
  if (!query.trim()) {
    throw new GoogleApiError("Informe pelo menos um criterio de busca.", {
      status: 400,
      code: "EMPTY_QUERY",
      reason: "emptyQuery"
    });
  }
  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": config.google.placesKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.googleMapsUri,places.primaryTypeDisplayName,places.location"
    },
    body: JSON.stringify({ textQuery: query, languageCode: "pt-BR", maxResultCount: 20 })
  });

  if (!response.ok) {
    throw await buildGoogleApiError(response, "Google Places");
  }

  const payload = (await response.json()) as { places?: GooglePlace[] };
  return (payload.places ?? []).map((place) => normalizePlace(place, input));
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
