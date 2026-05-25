import { createClient } from "@supabase/supabase-js";
import { config } from "./config.js";

export function getSupabase() {
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    const error = new Error("Configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    error.status = 500;
    throw error;
  }

  return createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
