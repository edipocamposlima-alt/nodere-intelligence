import { config } from "../config.js";

const TEXT_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json";
const DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json";
const PLACES_NEW_TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";

function buildQuery({ companyName = "", company = "", keyword = "", city = "", state = "", segment = "" }) {
  const business = [companyName || company, segment, keyword].map((value) => String(value || "").trim()).filter(Boolean).join(" ");
  const location = [city, state].map((value) => String(value || "").trim()).filter(Boolean).join(" ");
  return [business, location ? `em ${location}` : ""].filter(Boolean).join(" ").slice(0, 240).trim();
}

function parseAddress(address = "") {
  const parts = address.split(",").map((part) => part.trim());
  const stateMatch = address.match(/\b([A-Z]{2})\b/);
  return {
    address,
    city: parts.length > 1 ? parts.at(-3) || parts.at(-2) || "" : "",
    state: stateMatch?.[1] || ""
  };
}

function classifyGooglePlacesError(status, message = "", httpStatus = 500) {
  const text = String(message || "").toLowerCase();
  const error = new Error(message || `Google Places failed with status ${status || httpStatus}.`);
  error.status = httpStatus;
  error.googleStatus = status || "";
  error.code = "GOOGLE_PLACES_ERROR";

  if (status === "REQUEST_DENIED" && (text.includes("api key not valid") || text.includes("invalid") || text.includes("key invalid"))) {
    error.code = "GOOGLE_INVALID_API_KEY";
    error.message = "Erro de autenticacao: chave Google Places invalida ou rejeitada.";
    error.status = 401;
  } else if (status === "REQUEST_DENIED" && (text.includes("not authorized") || text.includes("not enabled") || text.includes("api has not been used") || text.includes("disabled"))) {
    error.code = "GOOGLE_PLACES_NOT_ENABLED";
    error.message = "Erro de permissao: chave valida, mas Places API nao esta ativada para este projeto.";
    error.status = 403;
  } else if (status === "REQUEST_DENIED" && text.includes("billing")) {
    error.code = "GOOGLE_BILLING_NOT_ACTIVE";
    error.message = "Erro de permissao: faturamento do Google Cloud nao esta ativo para Places API.";
    error.status = 403;
  } else if (status === "OVER_QUERY_LIMIT" || text.includes("quota")) {
    error.code = "GOOGLE_QUOTA_EXCEEDED";
    error.message = "Quota da Google Places API excedida.";
    error.status = 429;
  } else if (status === "ZERO_RESULTS") {
    error.code = "GOOGLE_ZERO_RESULTS";
    error.message = "Google Places respondeu sem resultados para a busca.";
    error.status = 404;
  } else if (status === "INVALID_REQUEST") {
    error.code = "GOOGLE_INVALID_REQUEST";
    error.message = "Requisicao invalida para Google Places. Verifique parametros da busca.";
    error.status = 400;
  } else if (status === "REQUEST_DENIED") {
    error.code = "GOOGLE_REQUEST_DENIED";
    error.message = `Google Places negou a requisicao: ${message || "verifique chave, API, billing e restricoes."}`;
    error.status = 403;
  }

  return error;
}

function classifyGooglePlacesV1Error(payload = {}, httpStatus = 500) {
  const message = payload?.error?.message || payload?.message || "Google Places API request failed.";
  const text = String(message).toLowerCase();
  const error = new Error(message);
  error.status = httpStatus;
  error.googleStatus = payload?.error?.status || "";
  error.code = "GOOGLE_PLACES_ERROR";

  if (httpStatus === 401 || text.includes("api key not valid") || text.includes("invalid api key") || text.includes("key is invalid")) {
    error.code = "GOOGLE_INVALID_API_KEY";
    error.message = "Erro de autenticacao: chave Google Places invalida ou rejeitada.";
    error.status = 401;
  } else if (
    httpStatus === 403 &&
    (text.includes("places api") || text.includes("permission") || text.includes("access") || text.includes("disabled") || text.includes("has not been used"))
  ) {
    error.code = "GOOGLE_PLACES_NOT_ENABLED";
    error.message = "Erro de permissao: ative a Places API no Google Cloud e revise as restricoes da chave.";
    error.status = 403;
  } else if (text.includes("billing")) {
    error.code = "GOOGLE_BILLING_NOT_ACTIVE";
    error.message = "Erro de permissao: faturamento do Google Cloud nao esta ativo para Places API.";
    error.status = 403;
  } else if (httpStatus === 429 || text.includes("quota")) {
    error.code = "GOOGLE_QUOTA_EXCEEDED";
    error.message = "Quota da Google Places API excedida.";
    error.status = 429;
  }

  return error;
}

async function fetchJson(url, label = "google_places") {
  let response;
  try {
    response = await fetch(url);
  } catch (error) {
    const networkError = new Error(`Erro de endpoint Google (${label}): ${error.message}`);
    networkError.status = 502;
    networkError.code = "GOOGLE_ENDPOINT_UNREACHABLE";
    throw networkError;
  }
  const data = await response.json().catch(() => ({}));

  if (!response.ok || ["REQUEST_DENIED", "INVALID_REQUEST", "OVER_QUERY_LIMIT", "UNKNOWN_ERROR"].includes(data.status)) {
    throw classifyGooglePlacesError(data.status, data.error_message || data?.error?.message || "", response.status);
  }

  return data;
}

async function fetchGooglePlacesNew(query, limit) {
  let response;
  try {
    response = await fetch(PLACES_NEW_TEXT_SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": config.googlePlacesApiKey,
        "X-Goog-FieldMask": [
          "places.id",
          "places.displayName",
          "places.formattedAddress",
          "places.internationalPhoneNumber",
          "places.nationalPhoneNumber",
          "places.websiteUri",
          "places.rating",
          "places.userRatingCount",
          "places.types",
          "places.googleMapsUri",
          "places.businessStatus",
          "places.regularOpeningHours"
        ].join(",")
      },
      body: JSON.stringify({
        textQuery: query,
        languageCode: "pt-BR",
        regionCode: "BR",
        maxResultCount: Math.max(1, Math.min(limit, 20))
      })
    });
  } catch (error) {
    const networkError = new Error(`Erro de endpoint Google (places_new): ${error.message}`);
    networkError.status = 502;
    networkError.code = "GOOGLE_ENDPOINT_UNREACHABLE";
    throw networkError;
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw classifyGooglePlacesV1Error(payload, response.status);
  }

  return payload;
}

export async function searchGooglePlaces(params) {
  if (!config.googlePlacesApiKey) {
    const error = new Error("GOOGLE_PLACES_API_KEY ausente no backend/.env.");
    error.status = 503;
    error.code = "GOOGLE_PLACES_KEY_MISSING";
    throw error;
  }

  const query = buildQuery(params);
  if (!query) {
    const error = new Error("Informe nome da empresa, cidade, segmento ou palavra-chave.");
    error.status = 400;
    throw error;
  }

  const limit = Math.max(1, Math.min(Number(params.limit || 10), 20));

  try {
    const searchDataV1 = await fetchGooglePlacesNew(query, limit);
    const places = searchDataV1.places || [];

    return {
      results: places.map((place) => {
        const parsedAddress = parseAddress(place.formattedAddress || "");
        return {
          source: "google_places_new",
          googlePlaceId: place.id,
          companyName: place.displayName?.text || "",
          phone: place.internationalPhoneNumber || place.nationalPhoneNumber || "",
          whatsapp: place.internationalPhoneNumber || place.nationalPhoneNumber || "",
          website: place.websiteUri || "",
          address: parsedAddress.address,
          city: parsedAddress.city,
          state: parsedAddress.state,
          segment: params.segment || (place.types || []).slice(0, 2).join(", "),
          googleRating: place.rating || null,
          googleReviews: place.userRatingCount || 0,
          googleMapsUrl: place.googleMapsUri || "",
          businessStatus: place.businessStatus || "",
          openingHours: place.regularOpeningHours?.weekdayDescriptions || []
        };
      }),
      nextPageToken: null
    };
  } catch (placesNewError) {
    if (!["GOOGLE_PLACES_NOT_ENABLED", "GOOGLE_PLACES_ERROR"].includes(placesNewError.code)) {
      throw placesNewError;
    }
    console.warn(JSON.stringify({
      level: "warn",
      code: placesNewError.code,
      message: "Places API New failed; trying legacy Text Search fallback."
    }));
  }

  const textUrl = new URL(TEXT_SEARCH_URL);
  if (params.pageToken) {
    textUrl.searchParams.set("pagetoken", params.pageToken);
  } else {
    textUrl.searchParams.set("query", query);
  }
  textUrl.searchParams.set("language", "pt-BR");
  textUrl.searchParams.set("region", "br");
  textUrl.searchParams.set("key", config.googlePlacesApiKey);

  const searchData = await fetchJson(textUrl, "text_search");
  const rawResults = (searchData.results || []).slice(0, limit);

  const enriched = await Promise.all(
    rawResults.map(async (place) => {
      const detailsUrl = new URL(DETAILS_URL);
      detailsUrl.searchParams.set("place_id", place.place_id);
      detailsUrl.searchParams.set(
        "fields",
        "name,formatted_address,formatted_phone_number,international_phone_number,website,opening_hours,rating,user_ratings_total,types,business_status,url"
      );
      detailsUrl.searchParams.set("language", "pt-BR");
      detailsUrl.searchParams.set("key", config.googlePlacesApiKey);

      const details = await fetchJson(detailsUrl, "place_details");
      const result = details.result || {};
      const parsedAddress = parseAddress(result.formatted_address || place.formatted_address);

      return {
        source: "google_places",
        googlePlaceId: place.place_id,
        companyName: result.name || place.name,
        phone: result.international_phone_number || result.formatted_phone_number || "",
        whatsapp: result.international_phone_number || result.formatted_phone_number || "",
        website: result.website || "",
        address: parsedAddress.address,
        city: parsedAddress.city,
        state: parsedAddress.state,
        segment: params.segment || (result.types || []).slice(0, 2).join(", "),
        googleRating: result.rating || place.rating || null,
        googleReviews: result.user_ratings_total || place.user_ratings_total || 0,
        googleMapsUrl: result.url || "",
        businessStatus: result.business_status || place.business_status || "",
        openingHours: result.opening_hours?.weekday_text || []
      };
    })
  );

  return {
    results: enriched,
    nextPageToken: searchData.next_page_token || null
  };
}
