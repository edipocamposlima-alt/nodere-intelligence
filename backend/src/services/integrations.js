import { config } from "../config.js";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

function configured(value) {
  return Boolean(value && String(value).trim());
}

function statusEnvelope(key, name, isConfigured, required = false) {
  return {
    key,
    name,
    required,
    configured: isConfigured,
    status: isConfigured ? "pending_validation" : "pending",
    message: isConfigured ? "Credenciais encontradas no backend." : "Credenciais ausentes no backend."
  };
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

async function validatePlaces() {
  if (!configured(config.googlePlacesApiKey)) return null;

  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": config.googlePlacesApiKey,
      "X-Goog-FieldMask": "places.id,places.displayName"
    },
    body: JSON.stringify({
      textQuery: "Clínica odontológica em Porto Alegre",
      languageCode: "pt-BR",
      maxResultCount: 1
    })
  });

  const payload = await safeJson(response);
  if (!response.ok) {
    throw new Error(payload?.error?.message || "Google Places request failed.");
  }

  return `${payload.places?.length || 0} resultado(s) retornado(s).`;
}

async function validateMaps() {
  if (!configured(config.googleMapsApiKey)) return null;

  const endpoint = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  endpoint.searchParams.set("address", "Porto Alegre, RS");
  endpoint.searchParams.set("key", config.googleMapsApiKey);

  const response = await fetch(endpoint);
  const payload = await safeJson(response);
  if (!response.ok || payload.status === "REQUEST_DENIED") {
    throw new Error(payload.error_message || "Google Maps request failed.");
  }

  return payload.status === "OK" ? "Geocoding validado." : `Status Google Maps: ${payload.status}`;
}

export async function validatePageSpeed(url = "https://www.wikipedia.org") {
  if (!configured(config.googlePageSpeedApiKey)) return null;

  const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  endpoint.searchParams.set("url", url);
  endpoint.searchParams.set("strategy", "mobile");
  endpoint.searchParams.set("key", config.googlePageSpeedApiKey);

  const response = await fetch(endpoint);
  const payload = await safeJson(response);
  if (!response.ok) {
    throw new Error(payload?.error?.message || "PageSpeed Insights request failed.");
  }

  const score = Math.round((payload.lighthouseResult?.categories?.performance?.score || 0) * 100);
  return `Performance mobile ${score}/100.`;
}

async function validateGoogleBusinessProfile() {
  const hasOAuth =
    configured(config.googleBusinessProfileClientId) &&
    configured(config.googleBusinessProfileClientSecret) &&
    configured(config.googleBusinessProfileRefreshToken);

  if (!hasOAuth) return null;

  const body = new URLSearchParams({
    client_id: config.googleBusinessProfileClientId,
    client_secret: config.googleBusinessProfileClientSecret,
    refresh_token: config.googleBusinessProfileRefreshToken,
    grant_type: "refresh_token"
  });

  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  const tokenPayload = await safeJson(tokenResponse);
  if (!tokenResponse.ok) {
    throw new Error(tokenPayload.error_description || tokenPayload.error || "Google OAuth refresh failed.");
  }

  const accountsResponse = await fetch("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", {
    headers: { Authorization: `Bearer ${tokenPayload.access_token}` }
  });

  const accountsPayload = await safeJson(accountsResponse);
  if (!accountsResponse.ok) {
    throw new Error(accountsPayload?.error?.message || "Business Profile account request failed.");
  }

  return `${accountsPayload.accounts?.length || 0} conta(s) Business Profile acessível(is).`;
}

async function validateOpenAI() {
  if (!configured(config.openaiApiKey)) return null;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.openaiApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: config.openaiModel,
      input: "Responda apenas: NODERE_OK"
    })
  });

  const payload = await safeJson(response);
  if (!response.ok) {
    throw new Error(payload?.error?.message || "OpenAI request failed.");
  }

  return payload.output_text?.trim() || "OpenAI respondeu com sucesso.";
}

const validators = {
  google_places: validatePlaces,
  google_maps: validateMaps,
  google_pagespeed: validatePageSpeed,
  google_business_profile: validateGoogleBusinessProfile,
  openai: validateOpenAI
};

export function getStaticIntegrationStatus() {
  return [
    statusEnvelope("google_places", "Google Places API", configured(config.googlePlacesApiKey), true),
    statusEnvelope("google_maps", "Google Maps API", configured(config.googleMapsApiKey), true),
    statusEnvelope("google_pagespeed", "Google PageSpeed Insights API", configured(config.googlePageSpeedApiKey), false),
    statusEnvelope(
      "google_business_profile",
      "Google Business Profile API",
      configured(config.googleBusinessProfileClientId) &&
        configured(config.googleBusinessProfileClientSecret) &&
        configured(config.googleBusinessProfileRefreshToken),
      false
    ),
    statusEnvelope("openai", "OpenAI / ChatGPT API", configured(config.openaiApiKey), false),
    statusEnvelope(
      "whatsapp_cloud",
      "WhatsApp Cloud API",
      configured(config.whatsappCloudToken) && configured(config.whatsappPhoneNumberId),
      false
    ),
    statusEnvelope("supabase", "Supabase", configured(config.supabaseUrl) && configured(config.supabaseServiceRoleKey), false)
  ];
}

export async function getLiveIntegrationStatus() {
  const statuses = getStaticIntegrationStatus();

  return Promise.all(
    statuses.map(async (item) => {
      const validator = validators[item.key];
      if (!item.configured || !validator) return item;

      try {
        const message = await validator();
        return { ...item, status: "connected", message: message || "Conexão validada." };
      } catch (error) {
        return { ...item, status: "error", message: error.message || "Falha ao validar conexão." };
      }
    })
  );
}

export async function testIntegration(key) {
  const statuses = getStaticIntegrationStatus();
  const item = statuses.find((status) => status.key === key);

  if (!item) {
    const error = new Error("Integration not found.");
    error.status = 404;
    throw error;
  }

  if (!item.configured) return item;

  const validator = validators[key];
  if (!validator) return item;

  try {
    const message = await validator();
    return { ...item, status: "connected", message: message || "Conexão validada." };
  } catch (error) {
    return { ...item, status: "error", message: error.message || "Falha ao validar conexão." };
  }
}
