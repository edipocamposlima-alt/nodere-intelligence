"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type Workspace = {
  id?: string;
  name?: string;
  nome?: string;
  plan?: string;
  plano?: string;
  plan_expires_at?: string;
  trial_expires_at?: string;
  expires_at?: string;
  expira_em?: string;
  timezone?: string;
  website?: string;
  phone?: string;
  segment?: string;
  address?: string;
};

type WorkspaceUser = {
  id?: string;
  workspace_id?: string;
  name?: string;
  email?: string;
  role?: "owner" | "admin" | "operator" | "viewer" | string;
};

type WorkspaceContextValue = {
  workspace: Workspace | null;
  user: WorkspaceUser | null;
  modules: string[];
  loading: boolean;
  hasModule: (code: string) => boolean;
  refresh: () => Promise<void>;
};

const TRIAL_MODULES = ["DISC-01", "CRM-01", "CRM-02", "CRM-03", "ENG-01", "ENG-04", "AI-01", "ANA-01", "ANA-02"];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qhopjggnbzewuuktqntp.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "missing-anon-key"
);

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

function normalizeWorkspace(raw: Workspace | null): Workspace | null {
  if (!raw) return null;
  return {
    ...raw,
    name: raw.name || raw.nome || "Workspace NODERI",
    plan: raw.plan || raw.plano || "trial",
    plan_expires_at: raw.plan_expires_at || raw.trial_expires_at || raw.expires_at || raw.expira_em
  };
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [user, setUser] = useState<WorkspaceUser | null>(null);
  const [modules, setModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const sessionResponse = await fetch("/api/auth/me", { cache: "no-store" });
      if (!sessionResponse.ok) {
        setUser(null);
        setWorkspace(null);
        setModules([]);
        return;
      }
      const session = await sessionResponse.json();
      const sessionUser = session.user as WorkspaceUser | undefined;
      const workspaceId = session.workspace?.id || sessionUser?.workspace_id;
      const normalizedUser = { ...sessionUser, workspace_id: workspaceId };

      let workspaceRow = normalizeWorkspace(session.workspace ?? null);
      if (workspaceId) {
        const { data } = await supabase
          .from("nodere_workspaces")
          .select("*")
          .eq("id", workspaceId)
          .maybeSingle();
        workspaceRow = normalizeWorkspace((data as Workspace | null) || workspaceRow);
      }

      let activeModules: string[] = [];
      if (workspaceId) {
        const { data } = await supabase
          .from("nodere_workspace_modules")
          .select("module_code")
          .eq("workspace_id", workspaceId)
          .eq("active", true);
        activeModules = (data || [])
          .map((item: { module_code?: string }) => item.module_code)
          .filter((code): code is string => Boolean(code));
      }

      setUser(normalizedUser ?? null);
      setWorkspace(workspaceRow);
      setModules(activeModules.length ? activeModules : TRIAL_MODULES);
    } catch (err) {
      console.error("[WorkspaceContext]", err);
      setModules(TRIAL_MODULES);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const value = useMemo<WorkspaceContextValue>(() => ({
    workspace,
    user,
    modules,
    loading,
    hasModule: (code: string) => modules.includes(code),
    refresh
  }), [workspace, user, modules, loading]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace precisa estar dentro de WorkspaceProvider.");
  }
  return context;
}
