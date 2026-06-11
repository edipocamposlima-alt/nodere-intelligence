"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { getApiBaseUrl } from "@/lib/apiBase";
import { setAdminToken } from "@/lib/adminAuth";
import { hasSupabaseAuthConfig, signUpWithPassword } from "@/lib/supabaseAuthRest";

function passwordStrength(password: string) {
  if (password.length < 4) return { label: "Fraca", level: 1 };
  if (password.length < 8) return { label: "Média", level: 2 };
  return { label: "Forte", level: 3 };
}

export function RegisterClient() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", company: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const strength = passwordStrength(form.password);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    if (form.password.length < 8) {
      setMessage("A senha deve ter pelo menos 8 caracteres.");
      setLoading(false);
      return;
    }

    try {
      if (!hasSupabaseAuthConfig()) {
        throw new Error("Configuração de cadastro indisponível. Revise as variáveis públicas do Supabase na Vercel.");
      }

      const auth = await signUpWithPassword(form.email, form.password, form.name);
      if (!auth.access_token) {
        setSuccess(true);
        return;
      }

      setAdminToken(auth.access_token);
      await fetch("/api/auth/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: auth.access_token }) });
      await fetch(`${getApiBaseUrl()}/workspace`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.access_token}` },
        body: JSON.stringify({ name: form.company || "Workspace NODERE" })
      });
      router.push("/dashboard");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao criar conta.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="site-auth">
        <section className="site-auth__card site-auth__card--center">
          <div className="site-auth__brand">NODERE <strong>Nexus</strong></div>
          <h1>Verifique seu e-mail</h1>
          <p>Enviamos um link de confirmação para <strong>{form.email}</strong>. Confirme para acessar o NODERE Nexus.</p>
          <Link href="/login">Ir para o login</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="site-auth">
      <section className="site-auth__card">
        <div className="site-auth__brand">NODERE <strong>Nexus</strong></div>
        <p className="site-auth__caption">Revenue Intelligence Platform</p>
        <h1>Criar conta grátis</h1>
        <p className="site-auth__subtitle">14 dias grátis · Sem cartão de crédito</p>

        {message && <div className="site-auth__message">{message}</div>}

        <form onSubmit={submit} className="site-auth__form">
          {[
            { key: "name", label: "Seu nome", placeholder: "João Silva", type: "text" },
            { key: "company", label: "Nome da empresa", placeholder: "Agência Digital Ltda", type: "text" },
            { key: "email", label: "E-mail profissional", placeholder: "joao@empresa.com.br", type: "email" }
          ].map((field) => (
            <label key={field.key}>
              <span>{field.label}</span>
              <input
                required
                type={field.type}
                placeholder={field.placeholder}
                value={form[field.key as keyof typeof form]}
                onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}
              />
            </label>
          ))}

          <label>
            <span>Senha</span>
            <div className="site-auth__password">
              <input
                required
                minLength={8}
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 8 caracteres"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              />
              <button type="button" onClick={() => setShowPassword((current) => !current)} title={showPassword ? "Ocultar senha" : "Mostrar senha"} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {form.password.length > 0 && (
              <div className="site-auth__strength">
                {[1, 2, 3].map((level) => <span className={strength.level >= level ? `active active--${strength.level}` : ""} key={level} />)}
                <small>{strength.label}</small>
              </div>
            )}
          </label>

          <p className="site-auth__terms">
            Ao criar sua conta, você concorda com os <Link href="/terms">Termos de Uso</Link> e a <Link href="/privacy">Política de Privacidade</Link>.
          </p>

          <button className="site-auth__submit" disabled={loading} type="submit">
            {loading ? "Criando conta..." : "Criar conta grátis"}
          </button>
        </form>

        <p className="site-auth__login">Já tem conta? <Link href="/login">Entrar</Link></p>
      </section>
    </main>
  );
}
