"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { getApiBaseUrl } from "@/lib/apiBase";
import { setAdminToken } from "@/lib/adminAuth";
import { hasSupabaseAuthConfig, sendPasswordRecovery, signInWithPassword } from "@/lib/supabaseAuthRest";

export function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => {
    const raw = searchParams.get("next");
    if (!raw || raw === "/" || raw.startsWith("/login") || raw.startsWith("/register")) return "/dashboard";
    return raw.startsWith("/") ? raw : "/dashboard";
  }, [searchParams]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    try {
      if (hasSupabaseAuthConfig()) {
        const auth = await signInWithPassword(email, password);
        if (!auth.access_token) throw new Error("Supabase não retornou token de sessão.");
        setAdminToken(auth.access_token);
        localStorage.setItem("nodere_user_profile", JSON.stringify({
          email,
          name: auth.user?.email ? formatDisplayName(auth.user.email) : formatDisplayName(email)
        }));
        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ access_token: auth.access_token })
        });
        router.push(nextPath);
        return;
      }

      const response = await fetch(`${getApiBaseUrl()}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "Não foi possível entrar.");
      setAdminToken(payload.token);
      localStorage.setItem("nodere_user_profile", JSON.stringify({
        email: payload.user?.email || email,
        name: payload.user?.name || formatDisplayName(payload.user?.email || email),
        role: payload.user?.role
      }));
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: payload.token })
      });
      router.push(nextPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login.");
    } finally {
      setLoading(false);
    }
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
        <img className="site-auth__logo" src="/logo-nodere-full.png" alt="NODERE Nexus" />
        <p className="site-auth__caption">Revenue Intelligence Platform</p>
        <h1>Entrar no NODERE Nexus</h1>
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
