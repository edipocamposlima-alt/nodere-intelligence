import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { config } from "../config.js";

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!config.supabase.url || !config.supabase.serviceRoleKey) return null;
  if (!_client) {
    _client = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  }
  return _client;
}

export function hasSupabase(): boolean {
  return Boolean(config.supabase.url && config.supabase.serviceRoleKey);
}
