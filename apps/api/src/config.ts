import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? process.env.API_PORT ?? 4000),
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
  databaseUrl: process.env.DATABASE_URL,
  useMockData: process.env.USE_MOCK_DATA !== "false",
  google: {
    mapsKey: process.env.GOOGLE_MAPS_API_KEY,
    placesKey: process.env.GOOGLE_PLACES_API_KEY ?? process.env.GOOGLE_MAPS_API_KEY,
    pageSpeedKey: process.env.GOOGLE_PAGESPEED_API_KEY,
    businessProfileClientId: process.env.GOOGLE_BUSINESS_PROFILE_CLIENT_ID,
    businessProfileClientSecret: process.env.GOOGLE_BUSINESS_PROFILE_CLIENT_SECRET,
    businessProfileRefreshToken: process.env.GOOGLE_BUSINESS_PROFILE_REFRESH_TOKEN
  },
  whatsapp: {
    token: process.env.WHATSAPP_CLOUD_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    defaultCountryCode: process.env.WHATSAPP_DEFAULT_COUNTRY_CODE ?? "55"
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini"
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
  webhookSecret: process.env.WHATSAPP_WEBHOOK_SECRET ?? "nodere-webhook-secret",
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    successUrl: process.env.STRIPE_SUCCESS_URL ?? "http://localhost:3000/billing?success=1",
    cancelUrl: process.env.STRIPE_CANCEL_URL ?? "http://localhost:3000/billing?cancel=1",
    prices: {
      starter: process.env.STRIPE_PRICE_STARTER,
      pro: process.env.STRIPE_PRICE_PRO,
      agency: process.env.STRIPE_PRICE_AGENCY
    }
  }
};
