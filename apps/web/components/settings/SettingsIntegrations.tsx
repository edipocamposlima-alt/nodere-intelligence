"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { getApiBaseUrl } from "@/lib/apiBase";

const API_URL = getApiBaseUrl();

const INTEGRATIONS = [
  { key: "openai_key", label: "OpenAI API Key", hint: "sk-...", testEndpoint: "/api/settings/test/openai" },
  { key: "google_places_key", label: "Google Places API Key", hint: "AIza...", testEndpoint: "/api/settings/test/google" },
  { key: "apollo_key", label: "Apollo.io API Key", hint: "Encontre em app.apollo.io > Settings > API", testEndpoint: "/api/settings/test/apollo" },
  { key: "smtp_host", label: "SMTP Host", hint: "smtp.seudominio.com" },
  { key: "smtp_port", label: "SMTP Porta", hint: "587" },
  { key: "smtp_user", label: "SMTP Usuário", hint: "email@dominio.com" },
  { key: "smtp_pass", label: "SMTP Senha", hint: "••••••••", type: "password" },
  { key: "smtp_from", label: "E-mail Remetente", hint: "NODERI <noreply@nodere.com.br>" }
];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qhopjggnbzewuuktqntp.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "missing-anon-key"
);

export default function SettingsIntegrations() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function getToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || localStorage.getItem("nodere_admin_token") || "";
  }

  useEffect(() => {
    getToken().then((token) =>
      fetch(`${API_URL}/api/settings/integrations`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then((response) => response.json()).then((data) => setValues(data || {})).catch(() => setValues({}))
    );
  }, []);

  async function testConnection(key: string, endpoint?: string) {
    if (!endpoint) return;
    setTesting((current) => ({ ...current, [key]: true }));
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      setTestResults((current) => ({ ...current, [key]: res.ok ? "✓ Conexão OK" : `✗ ${data.error || "Falha no teste"}` }));
    } catch {
      setTestResults((current) => ({ ...current, [key]: "✗ Erro de conexão" }));
    } finally {
      setTesting((current) => ({ ...current, [key]: false }));
    }
  }

  async function save() {
    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/settings/integrations`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(values)
      });
      const data = await res.json().catch(() => ({}));
      setMsg(res.ok ? "✓ Configurações salvas." : data.error || "Erro ao salvar.");
    } catch {
      setMsg("Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="settings-section">
      <h2>Integrações</h2>
      <p className="settings-hint">As chaves são armazenadas no backend e nunca exibidas em texto puro depois de salvas.</p>
      {msg && <div className={`settings-msg ${msg.startsWith("✓") ? "success" : "error"}`}>{msg}</div>}
      {INTEGRATIONS.map((item) => (
        <div key={item.key} className="integration-row">
          <label>{item.label}
            <input
              type={item.type || "text"}
              placeholder={item.hint}
              value={values[item.key] || ""}
              onChange={(event) => setValues((current) => ({ ...current, [item.key]: event.target.value }))}
            />
          </label>
          {item.testEndpoint && (
            <div className="integration-test">
              <button onClick={() => testConnection(item.key, item.testEndpoint)} disabled={testing[item.key]} className="btn-ghost btn-sm" type="button">
                {testing[item.key] ? "Testando..." : "Testar conexão"}
              </button>
              {testResults[item.key] && <span className={testResults[item.key].startsWith("✓") ? "test-ok" : "test-fail"}>{testResults[item.key]}</span>}
            </div>
          )}
        </div>
      ))}
      <button onClick={save} disabled={saving} className="btn-primary" type="button">
        {saving ? "Salvando..." : "Salvar integrações"}
      </button>
    </div>
  );
}
