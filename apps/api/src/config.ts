import dotenv from "dotenv";

dotenv.config();

const _googleApiKey = process.env.GOOGLE_API_KEY;

export const config = {
  port: Number(process.env.PORT ?? process.env.API_PORT ?? 4000),
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
  frontendUrl: process.env.FRONTEND_URL ?? process.env.WEB_ORIGIN ?? "http://localhost:3000",
  apiKey: process.env.API_KEY,
  admin: {
    email: process.env.ADMIN_EMAIL ?? "admin@nodere.com.br",
    password: process.env.ADMIN_PASSWORD,
    sessionSecret: process.env.ADMIN_SESSION_SECRET ?? process.env.API_KEY ?? "nodere-local-admin-secret"
  },
  databaseUrl: process.env.DATABASE_URL,
  useMockData: process.env.USE_MOCK_DATA === "true",
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
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini"
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5"
  },
  ai: {
    providerPrimary: process.env.AI_PROVIDER_PRIMARY ?? "openai"
  },
  enrichment: {
    econodataApiKey: process.env.ECONODATA_API_KEY,
    econodataApiUrl: process.env.ECONODATA_API_URL,
    apolloApiKey: process.env.APOLLO_API_KEY,
    apolloApiUrl: process.env.APOLLO_API_URL ?? "https://api.apollo.io/api/v1"
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
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    anonKey: process.env.SUPABASE_ANON_KEY
  },
  webhookSecret: process.env.WHATSAPP_WEBHOOK_SECRET ?? "nodere-webhook-secret",
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
      pro: process.env.STRIPE_PRICE_PRO,
      agency: process.env.STRIPE_PRICE_AGENCY
    }
  }
};
