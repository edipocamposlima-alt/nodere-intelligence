"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export function useModules() {
  const [modules, setModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const supabase = await getSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from("nodere_platform_users")
          .select("workspace_id")
          .eq("id", user.id)
          .single();

        if (!profile) {
          setLoading(false);
          return;
        }

        const { data: mods } = await supabase
          .from("nodere_workspace_modules")
          .select("module_code")
          .eq("workspace_id", profile.workspace_id)
          .eq("active", true);

        setModules(mods?.map((module) => module.module_code) ?? []);
      } catch (err) {
        console.error("[useModules]", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return {
    modules,
    loading,
    hasModule: (code: string) => modules.includes(code)
  };
}
