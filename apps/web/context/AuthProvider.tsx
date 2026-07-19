"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
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
  const [validationUnavailable, setValidationUnavailable] = useState(false);

  const clearClientSession = useCallback(() => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("nodere_admin_token");
    localStorage.removeItem("nodere_user_profile");
  }, []);

  const redirectToLogin = useCallback(() => {
    if (typeof window === "undefined") return;
    const next = `${window.location.pathname}${window.location.search}`;
    router.replace(`/login?next=${encodeURIComponent(next)}`);
  }, [router]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setValidationUnavailable(false);
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      if (!response.ok) {
        setUser(null);
        setWorkspace(null);
        if (response.status === 401 || response.status === 403) {
          await fetch("/api/auth/session", { method: "DELETE" }).catch(() => undefined);
          clearClientSession();
          redirectToLogin();
        } else {
          setValidationUnavailable(true);
        }
        return;
      }
      const payload = await response.json();
      setUser(payload.user ?? null);
      setWorkspace(payload.workspace ?? null);
    } catch {
      setUser(null);
      setWorkspace(null);
      setValidationUnavailable(true);
    } finally {
      setLoading(false);
    }
  }, [clearClientSession, redirectToLogin]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/session", { method: "DELETE" });
    clearClientSession();
    setUser(null);
    setWorkspace(null);
    router.replace("/login");
  }, [clearClientSession, router]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(() => ({ loading, user, workspace, logout, refresh }), [loading, logout, refresh, user, workspace]);

  if (loading || !user) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-ink px-4 text-center text-white">
        <section className="w-full max-w-md rounded-2xl border border-line bg-panel p-6 shadow-card" aria-live="polite">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan">NODERE</p>
          <h1 className="mt-3 text-xl font-black">
            {validationUnavailable ? "Não foi possível validar sua sessão" : loading ? "Validando acesso seguro" : "Sessão encerrada"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {validationUnavailable
              ? "A conexão com o serviço de autenticação falhou. Nenhum dado do workspace foi exibido."
              : "Aguarde enquanto confirmamos sua identidade e o workspace autorizado."}
          </p>
          {validationUnavailable && (
            <button type="button" onClick={() => void refresh()} className="mt-5 min-h-11 rounded-lg bg-electric px-5 py-2 text-sm font-black text-white">
              Tentar novamente
            </button>
          )}
        </section>
      </main>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth precisa estar dentro de AuthProvider.");
  }
  return context;
}
