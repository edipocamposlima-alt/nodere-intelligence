"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type AuthUser = {
  id?: string;
  email?: string;
  name?: string;
  avatar_url?: string;
  role?: "owner" | "admin" | "operator" | "viewer";
};

type AuthWorkspace = {
  id?: string;
  name?: string;
};

type AuthState = {
  loading: boolean;
  user: AuthUser | null;
  workspace: AuthWorkspace | null;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [workspace, setWorkspace] = useState<AuthWorkspace | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      if (!response.ok) {
        setUser(null);
        setWorkspace(null);
        return;
      }
      const payload = await response.json();
      setUser(payload.user ?? null);
      setWorkspace(payload.workspace ?? null);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/session", { method: "DELETE" });
    if (typeof window !== "undefined") {
      localStorage.removeItem("nodere_admin_token");
      localStorage.removeItem("nodere_user_profile");
    }
    setUser(null);
    setWorkspace(null);
    router.push("/login");
  }

  useEffect(() => {
    void refresh();
  }, []);

  const value = useMemo(() => ({ loading, user, workspace, logout, refresh }), [loading, user, workspace]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth precisa estar dentro de AuthProvider.");
  }
  return context;
}
