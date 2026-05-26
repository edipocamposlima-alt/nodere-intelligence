import dotenv from "dotenv";

dotenv.config({ path: "../.env" });
dotenv.config();

function env(name, fallback = "") {
  return String(process.env[name] || fallback || "").trim();
}

export const config = {
  port: Number(process.env.PORT || 3333),
  frontendOrigin: env("FRONTEND_ORIGIN", "http://localhost:4173"),
  productionFrontendOrigin: env("PRODUCTION_FRONTEND_ORIGIN", "https://edipocamposlima-alt.github.io"),
  ownerToken: env("MVP_OWNER_TOKEN"),
  supabaseUrl: env("SUPABASE_URL"),
  supabaseServiceRoleKey: env("SUPABASE_SERVICE_ROLE_KEY"),
  googleApiKey: env("GOOGLE_API_KEY"),
  googleMapsApiKey: env("GOOGLE_MAPS_API_KEY") || env("GOOGLE_API_KEY"),
  googlePlacesApiKey: env("GOOGLE_PLACES_API_KEY") || env("GOOGLE_API_KEY") || env("GOOGLE_MAPS_API_KEY"),
  googlePageSpeedApiKey: env("GOOGLE_PAGESPEED_API_KEY") || env("GOOGLE_API_KEY") || env("GOOGLE_MAPS_API_KEY") || env("GOOGLE_PLACES_API_KEY"),
  googleBusinessProfileClientId: env("GOOGLE_BUSINESS_PROFILE_CLIENT_ID") || env("GOOGLE_CLIENT_ID"),
  googleBusinessProfileClientSecret: env("GOOGLE_BUSINESS_PROFILE_CLIENT_SECRET") || env("GOOGLE_CLIENT_SECRET"),
  googleBusinessProfileRefreshToken: env("GOOGLE_BUSINESS_PROFILE_REFRESH_TOKEN") || env("GOOGLE_REFRESH_TOKEN"),
  googleCalendarClientId: env("GOOGLE_CALENDAR_CLIENT_ID") || env("GOOGLE_WORKSPACE_CLIENT_ID") || env("GOOGLE_CLIENT_ID"),
  googleCalendarClientSecret: env("GOOGLE_CALENDAR_CLIENT_SECRET") || env("GOOGLE_WORKSPACE_CLIENT_SECRET") || env("GOOGLE_CLIENT_SECRET"),
  googleCalendarRefreshToken: env("GOOGLE_CALENDAR_REFRESH_TOKEN") || env("GOOGLE_WORKSPACE_REFRESH_TOKEN") || env("GOOGLE_REFRESH_TOKEN"),
  gmailClientId: env("GMAIL_CLIENT_ID") || env("GOOGLE_WORKSPACE_CLIENT_ID") || env("GOOGLE_CLIENT_ID"),
  gmailClientSecret: env("GMAIL_CLIENT_SECRET") || env("GOOGLE_WORKSPACE_CLIENT_SECRET") || env("GOOGLE_CLIENT_SECRET"),
  gmailRefreshToken: env("GMAIL_REFRESH_TOKEN") || env("GOOGLE_WORKSPACE_REFRESH_TOKEN") || env("GOOGLE_REFRESH_TOKEN"),
  googleDriveClientId: env("GOOGLE_DRIVE_CLIENT_ID") || env("GOOGLE_WORKSPACE_CLIENT_ID") || env("GOOGLE_CLIENT_ID"),
  googleDriveClientSecret: env("GOOGLE_DRIVE_CLIENT_SECRET") || env("GOOGLE_WORKSPACE_CLIENT_SECRET") || env("GOOGLE_CLIENT_SECRET"),
  googleDriveRefreshToken: env("GOOGLE_DRIVE_REFRESH_TOKEN") || env("GOOGLE_WORKSPACE_REFRESH_TOKEN") || env("GOOGLE_REFRESH_TOKEN"),
  googleWorkspaceClientId: env("GOOGLE_WORKSPACE_CLIENT_ID") || env("GOOGLE_CLIENT_ID"),
  googleWorkspaceClientSecret: env("GOOGLE_WORKSPACE_CLIENT_SECRET") || env("GOOGLE_CLIENT_SECRET"),
  googleWorkspaceRefreshToken: env("GOOGLE_WORKSPACE_REFRESH_TOKEN") || env("GOOGLE_REFRESH_TOKEN"),
  openaiApiKey: env("OPENAI_API_KEY"),
  openaiModel: env("OPENAI_MODEL", "gpt-4.1-mini"),
  whatsappCloudToken: env("WHATSAPP_CLOUD_TOKEN") || env("META_ACCESS_TOKEN"),
  whatsappPhoneNumberId: env("WHATSAPP_PHONE_NUMBER_ID"),
  whatsappDefaultCountryCode: env("WHATSAPP_DEFAULT_COUNTRY_CODE", "55")
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
