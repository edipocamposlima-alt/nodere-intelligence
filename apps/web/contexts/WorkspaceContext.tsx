"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getWorkspaceMe } from "@/lib/api";

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
  workspaceId?: string;
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

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

function normalizeWorkspace(raw: Workspace | null): Workspace | null {
  if (!raw) return null;
  return {
    ...raw,
    name: raw.name || raw.nome || "Workspace NODERE",
    plan: raw.plan || raw.plano || "trial",
    plan_expires_at: raw.plan_expires_at || raw.trial_expires_at || raw.expires_at || raw.expira_em
  };
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [user, setUser] = useState<WorkspaceUser | null>(null);
  const [modules, setModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const session = await getWorkspaceMe();
      const sessionUser = session.user as WorkspaceUser | undefined;
      const workspaceId = session.workspace?.id || sessionUser?.workspace_id || sessionUser?.workspaceId;
      const normalizedUser = { ...sessionUser, workspace_id: workspaceId };
      const workspaceRow = normalizeWorkspace((session.workspace as Workspace | null) ?? null);
      const activeModules = Array.isArray(session.modules) ? session.modules.filter((code): code is string => typeof code === "string" && Boolean(code)) : [];

      setUser(normalizedUser ?? null);
      setWorkspace(workspaceRow);
      setModules(activeModules.length ? activeModules : TRIAL_MODULES);
    } catch (err) {
      console.error("[WorkspaceContext]", err);
      setModules(TRIAL_MODULES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<WorkspaceContextValue>(() => ({
    workspace,
    user,
    modules,
    loading,
    hasModule: (code: string) => user?.role === "owner" || user?.role === "admin" || modules.includes(code),
    refresh
  }), [workspace, user, modules, loading, refresh]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace precisa estar dentro de WorkspaceProvider.");
  }
  return context;
}
