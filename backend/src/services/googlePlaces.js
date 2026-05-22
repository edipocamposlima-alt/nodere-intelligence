import { config, requireEnv } from "../config.js";

const TEXT_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json";
const DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json";

function buildQuery({ keyword = "", city = "", segment = "" }) {
  return [segment, keyword, city].filter(Boolean).join(" ").trim();
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

async function fetchJson(url) {
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok || data.status === "REQUEST_DENIED") {
    throw new Error(data.error_message || "Google Places request failed.");
  }

  return data;
}

export async function searchGooglePlaces(params) {
  requireEnv(["GOOGLE_MAPS_API_KEY"]);

  const query = buildQuery(params);
  if (!query) {
    const error = new Error("Informe cidade, segmento ou palavra-chave.");
    error.status = 400;
    throw error;
  }

  const textUrl = new URL(TEXT_SEARCH_URL);
  textUrl.searchParams.set("query", query);
  textUrl.searchParams.set("language", "pt-BR");
  textUrl.searchParams.set("region", "br");
  textUrl.searchParams.set("key", config.googleMapsApiKey);

  const searchData = await fetchJson(textUrl);
  const rawResults = (searchData.results || []).slice(0, Number(params.limit || 10));

  const enriched = await Promise.all(
    rawResults.map(async (place) => {
      const detailsUrl = new URL(DETAILS_URL);
      detailsUrl.searchParams.set("place_id", place.place_id);
      detailsUrl.searchParams.set(
        "fields",
        "name,formatted_address,formatted_phone_number,international_phone_number,website,opening_hours,rating,user_ratings_total,types,business_status,url"
      );
      detailsUrl.searchParams.set("language", "pt-BR");
      detailsUrl.searchParams.set("key", config.googleMapsApiKey);

      const details = await fetchJson(detailsUrl);
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

  return enriched;
}
