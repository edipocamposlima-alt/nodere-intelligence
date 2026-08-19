"use client";

import Link from "@/components/NativeLink";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { setAdminToken } from "@/lib/adminAuth";
import { hasSupabaseAuthConfig, sendPasswordRecovery, signInWithPassword } from "@/lib/supabaseAuthRest";
import { Logo } from "@/components/brand/Logo";

export function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => {
    const raw = searchParams.get("next");
    if (!raw || raw === "/" || raw.startsWith("/login") || raw.startsWith("/register")) return "/ai";
    return raw.startsWith("/") ? raw : "/ai";
  }, [searchParams]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    localStorage.removeItem("nodere_admin_token");
    localStorage.removeItem("nodere_user_profile");
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    try {
      let supabaseFailure = "";
      if (hasSupabaseAuthConfig()) {
        try {
          const auth = await signInWithPassword(email, password);
          if (!auth.access_token) throw new Error("Supabase não retornou token de sessão.");
          const exchangeResponse = await fetch("/api/auth/backend/supabase-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accessToken: auth.access_token })
          });
          const exchange = await exchangeResponse.json().catch(() => ({}));
          if (!exchangeResponse.ok || !exchange.token) throw new Error(exchange.message || "Não foi possível iniciar a sessão NODERE.");
          await persistSession(exchange, auth.user?.email || email);
          router.replace(nextPath);
          router.refresh();
          return;
        } catch (error) {
          supabaseFailure = error instanceof Error ? error.message : "Sessão Supabase indisponível.";
        }
      }

      const response = await fetch("/api/auth/backend/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || supabaseFailure || "Não foi possível entrar.");
      await persistSession(payload, email);
      router.replace(nextPath);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login.");
    } finally {
      setLoading(false);
    }
  }

  async function persistSession(payload: any, fallbackEmail: string) {
    if (!payload.token) throw new Error("O backend não retornou uma sessão válida.");
    setAdminToken(payload.token);
    localStorage.setItem("nodere_user_profile", JSON.stringify({
      email: payload.user?.email || fallbackEmail,
      name: payload.user?.name || formatDisplayName(payload.user?.email || fallbackEmail),
      role: payload.user?.role || "operator",
      customRoleId: payload.user?.customRoleId ?? null,
      status: payload.user?.status || "active",
      visibilityLevel: payload.user?.visibilityLevel || "read_edit",
      modulePermissions: payload.user?.modulePermissions || {}
    }));
    const sessionResponse = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access_token: payload.token })
    });
    if (!sessionResponse.ok) throw new Error("Não foi possível persistir a sessão no navegador.");
  }

  async function recoverPassword() {
    setLoading(true);
    setError("");
    setNotice("");
    try {
      if (!email.trim()) throw new Error("Informe seu e-mail para receber a recuperação de senha.");
      const result = await sendPasswordRecovery(email);
      setNotice(result.message || "E-mail de recuperação enviado.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar recuperação.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="site-auth">
      <section className="site-auth__card">
        <Logo variant="full" height={44} className="site-auth__logo" />
        <p className="site-auth__caption">Plataforma comercial</p>
        <h1>Entrar no NODERE</h1>
        <p className="site-auth__subtitle">Acesse seu workspace comercial.</p>
        <form onSubmit={submit} className="site-auth__form">
          <label>
            <span>E-mail</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              required
              autoComplete="email"
            />
          </label>
          <label>
            <span>Senha</span>
            <div className="site-auth__password">
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPassword((current) => !current)} title={showPassword ? "Ocultar senha" : "Mostrar senha"} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          {error && <p className="site-auth__message">{error}</p>}
          {notice && <p className="site-auth__message site-auth__message--success">{notice}</p>}
          <button disabled={loading} className="site-auth__submit" type="submit">
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <div className="site-auth__links">
          <button type="button" onClick={recoverPassword}>
            Esqueci minha senha
          </button>
          <Link href="/register">
            Criar conta
          </Link>
        </div>
        <footer className="site-auth__footer">
          <Link href="/terms">Termos de uso</Link>
          <span className="px-2">·</span>
          <Link href="/privacy">Política de privacidade</Link>
        </footer>
      </section>
    </main>
  );
}
function formatDisplayName(email: string) {
  const raw = String(email || "Usuário").split("@")[0].replace(/[._-]+/g, " ");
  return raw.split(" ").filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(" ") || "Usuário";
}
