import "dotenv/config";

export const config = {
  port: Number(process.env.PORT || 3333),
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:4173",
  ownerToken: process.env.MVP_OWNER_TOKEN || "",
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || "",
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  openaiModel: process.env.OPENAI_MODEL || "gpt-4.1-mini"
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
