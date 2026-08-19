import dotenv from "dotenv";
import { existsSync } from "node:fs";
import path from "node:path";

if (process.env.NODE_ENV !== "production") {
  const candidates = [
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(process.cwd(), "../../.env.local"),
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../../.env")
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) dotenv.config({ path: candidate, override: false });
  }
} else {
  dotenv.config();
}

const _googleApiKey = process.env.GOOGLE_API_KEY;
const isProduction = process.env.NODE_ENV === "production";

function csvEnv(name: string) {
  return String(process.env[name] || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

const canonicalProductionAppUrl = "https://nodere-app.edipolima.chatgpt.site";
const retiredWebOrigins = new Set(["https://nodere.com.br", "https://www.nodere.com.br"]);

function activeAppUrl(value: string | undefined, fallback = "http://localhost:3000") {
  const normalized = String(value || "").trim().replace(/\/+$/, "");
  if (retiredWebOrigins.has(normalized)) return canonicalProductionAppUrl;
  return normalized || fallback;
}

const configuredWebOrigin = activeAppUrl(process.env.WEB_ORIGIN);
const configuredFrontendUrl = activeAppUrl(process.env.FRONTEND_URL, configuredWebOrigin);
const configuredPublicAppUrl = activeAppUrl(
  process.env.PUBLIC_APP_URL ?? process.env.APP_URL,
  configuredFrontendUrl
);

export const config = {
  port: Number(process.env.PORT ?? process.env.API_PORT ?? 4000),
  webOrigin: configuredWebOrigin,
  frontendUrl: configuredFrontendUrl,
  publicAppUrl: configuredPublicAppUrl,
  corsOrigins: csvEnv("CORS_ORIGINS")
    .map((origin) => activeAppUrl(origin, ""))
    .filter(Boolean),
  apiKey: process.env.API_KEY,
  admin: {
    email: process.env.ADMIN_EMAIL ?? "edipo.lima@nodere.com.br",
    name: process.env.ADMIN_NAME ?? "Édipo Lima",
    password: process.env.ADMIN_PASSWORD,
    sessionSecret: process.env.ADMIN_SESSION_SECRET ?? process.env.API_KEY ?? (isProduction ? "" : "nodere-local-admin-secret")
  },
  databaseUrl: process.env.DATABASE_URL,
  google: {
    mapsKey: process.env.GOOGLE_MAPS_API_KEY ?? _googleApiKey,
    placesKey: process.env.GOOGLE_PLACES_API_KEY ?? process.env.GOOGLE_PLACES_KEY ?? process.env.GOOGLE_MAPS_API_KEY ?? _googleApiKey,
    pageSpeedKey: process.env.GOOGLE_PAGESPEED_API_KEY ?? process.env.GOOGLE_PAGESPEED_KEY ?? _googleApiKey,
    businessProfileClientId: process.env.GOOGLE_BUSINESS_PROFILE_CLIENT_ID,
    businessProfileClientSecret: process.env.GOOGLE_BUSINESS_PROFILE_CLIENT_SECRET,
    businessProfileRefreshToken: process.env.GOOGLE_BUSINESS_PROFILE_REFRESH_TOKEN,
    customSearchKey: process.env.GOOGLE_CUSTOM_SEARCH_KEY
  },
  whatsapp: {
    token: process.env.WHATSAPP_CLOUD_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    defaultCountryCode: process.env.WHATSAPP_DEFAULT_COUNTRY_CODE ?? "55"
  },
  meta: {
    appSecret: process.env.META_APP_SECRET
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL ?? "gpt-5.6-terra"
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5"
  },
  ai: {
    providerPrimary: process.env.AI_PROVIDER_PRIMARY ?? "openai",
    defaultAgentId: process.env.AI_DEFAULT_AGENT_ID ?? "commercial-copilot",
    defaultModelId: process.env.AI_DEFAULT_MODEL_ID ?? "openai:gpt-5.6-terra",
    creditsPerUsd: Number(process.env.AI_CREDITS_PER_USD ?? 100),
    maxOutputTokens: Number(process.env.AI_MAX_OUTPUT_TOKENS ?? 2048),
    reservationBuffer: Number(process.env.AI_RESERVATION_BUFFER ?? 1.25)
  },
  marketplace: {
    blingClientId: process.env.BLING_CLIENT_ID,
    blingClientSecret: process.env.BLING_CLIENT_SECRET,
    rdStationClientId: process.env.RDSTATION_CLIENT_ID,
    rdStationClientSecret: process.env.RDSTATION_CLIENT_SECRET
  },
  googleAds: {
    developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
    clientId: process.env.GOOGLE_ADS_CLIENT_ID ?? process.env.GOOGLE_BUSINESS_PROFILE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET ?? process.env.GOOGLE_BUSINESS_PROFILE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_ADS_REFRESH_TOKEN,
    customerId: process.env.GOOGLE_ADS_CUSTOMER_ID
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD,
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    anonKey: process.env.SUPABASE_ANON_KEY
  },
  webhookSecret: process.env.WHATSAPP_VERIFY_TOKEN ?? process.env.WHATSAPP_WEBHOOK_SECRET,
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    paymentLinks: {
      starter: process.env.STRIPE_STARTER_URL,
      pro: process.env.STRIPE_PRO_URL,
      agency: process.env.STRIPE_AGENCY_URL
    },
    successUrl: process.env.STRIPE_SUCCESS_URL ?? "http://localhost:3000/billing?success=1",
    cancelUrl: process.env.STRIPE_CANCEL_URL ?? "http://localhost:3000/billing?cancel=1",
    prices: {
      starter: process.env.STRIPE_PRICE_STARTER,
      starterMonthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || process.env.STRIPE_PRICE_STARTER,
      starterYearly: process.env.STRIPE_PRICE_STARTER_YEARLY || process.env.STRIPE_PRICE_STARTER_ANNUAL || process.env.STRIPE_PRICE_STARTER,
      pro: process.env.STRIPE_PRICE_PRO,
      proMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY || process.env.STRIPE_PRICE_PRO,
      proYearly: process.env.STRIPE_PRICE_PRO_YEARLY || process.env.STRIPE_PRICE_PRO_ANNUAL || process.env.STRIPE_PRICE_PRO,
      agency: process.env.STRIPE_PRICE_AGENCY,
      agencyMonthly: process.env.STRIPE_PRICE_AGENCY_MONTHLY || process.env.STRIPE_PRICE_AGENCY,
      agencyYearly: process.env.STRIPE_PRICE_AGENCY_YEARLY || process.env.STRIPE_PRICE_AGENCY_ANNUAL || process.env.STRIPE_PRICE_AGENCY
    }
  }
};
