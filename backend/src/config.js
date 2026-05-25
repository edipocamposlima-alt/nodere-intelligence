import dotenv from "dotenv";

dotenv.config({ path: "../.env" });
dotenv.config();

export const config = {
  port: Number(process.env.PORT || 3333),
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:4173",
  productionFrontendOrigin: process.env.PRODUCTION_FRONTEND_ORIGIN || "https://edipocamposlima-alt.github.io",
  ownerToken: process.env.MVP_OWNER_TOKEN || "",
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  googleApiKey: process.env.GOOGLE_API_KEY || "",
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_API_KEY || "",
  googlePlacesApiKey: process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_MAPS_API_KEY || "",
  googlePageSpeedApiKey: process.env.GOOGLE_PAGESPEED_API_KEY || process.env.GOOGLE_API_KEY || "",
  googleBusinessProfileClientId: process.env.GOOGLE_BUSINESS_PROFILE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || "",
  googleBusinessProfileClientSecret: process.env.GOOGLE_BUSINESS_PROFILE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || "",
  googleBusinessProfileRefreshToken: process.env.GOOGLE_BUSINESS_PROFILE_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN || "",
  googleWorkspaceClientId: process.env.GOOGLE_WORKSPACE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || "",
  googleWorkspaceClientSecret: process.env.GOOGLE_WORKSPACE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || "",
  googleWorkspaceRefreshToken: process.env.GOOGLE_WORKSPACE_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN || "",
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  openaiModel: process.env.OPENAI_MODEL || "gpt-4.1-mini",
  whatsappCloudToken: process.env.WHATSAPP_CLOUD_TOKEN || process.env.META_ACCESS_TOKEN || "",
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
  whatsappDefaultCountryCode: process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || "55"
};

export function requireEnv(keys) {
  const missing = keys.filter((key) => !process.env[key]);
  if (missing.length) {
    const message = `Missing environment variables: ${missing.join(", ")}`;
    const error = new Error(message);
    error.status = 500;
    throw error;
  }
}
