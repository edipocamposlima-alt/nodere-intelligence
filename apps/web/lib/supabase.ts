"use client";

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;
let configPromise: Promise<{ supabaseUrl: string; supabaseAnonKey: string }> | null = null;

async function loadPublicConfig() {
  if (!configPromise) {
    configPromise = fetch("/api/public-config", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.supabaseUrl || !data.supabaseAnonKey) {
          throw new Error("SUPABASE_PUBLIC_ENV_MISSING");
        }
        return {
          supabaseUrl: data.supabaseUrl as string,
          supabaseAnonKey: data.supabaseAnonKey as string
        };
      });
  }

  return configPromise;
}

export async function getSupabaseBrowserClient() {
  if (!client) {
    const { supabaseUrl, supabaseAnonKey } = await loadPublicConfig();
    client = createClient(supabaseUrl, supabaseAnonKey);
  }

  return client;
}
