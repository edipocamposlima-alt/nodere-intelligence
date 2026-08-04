"use client";

import { useEffect, useState } from "react";
import { getApiBaseUrl } from "@/lib/apiBase";

const API_URL = getApiBaseUrl();

const INTEGRATIONS = [
  { key: "google_places_key", label: "Google Places API Key", hint: "AIza...", testEndpoint: "/settings/test/google" },
  { key: "smtp_host", label: "SMTP Host", hint: "smtp.seudominio.com" },
  { key: "smtp_port", label: "SMTP Porta", hint: "587" },
  { key: "smtp_user", label: "SMTP Usuário", hint: "email@dominio.com" },
  { key: "smtp_pass", label: "SMTP Senha", hint: "••••••••", type: "password" },
  { key: "smtp_from", label: "E-mail Remetente", hint: "NODERE <noreply@nodere.com.br>" }
];

export default function SettingsIntegrations() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/settings/integrations`)
      .then((response) => response.json()).then((data) => setValues(data || {})).catch(() => setValues({}));
  }, []);

  async function testConnection(key: string, endpoint?: string) {
    if (!endpoint) return;
    setTesting((current) => ({ ...current, [key]: true }));
    try {
      const res = await fetch(`${API_URL}${endpoint}`);
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
      const res = await fetch(`${API_URL}/settings/integrations`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
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
      <p className="settings-hint">As integrações do workspace ficam no backend. As chaves de provedores de IA são gerenciadas exclusivamente como secrets do ambiente e nunca são aceitas pelo navegador.</p>
      <div className="integration-row">
        <div>
          <strong>Provedores de IA</strong>
          <p className="settings-hint">Configuração central protegida pelo NODERE AI Gateway.</p>
        </div>
        <div className="integration-test">
          <button onClick={() => testConnection("openai_managed", "/settings/test/openai")} disabled={testing.openai_managed} className="btn-ghost btn-sm" type="button">
            {testing.openai_managed ? "Verificando..." : "Verificar gateway"}
          </button>
          {testResults.openai_managed && <span className={testResults.openai_managed.startsWith("✓") ? "test-ok" : "test-fail"}>{testResults.openai_managed}</span>}
        </div>
      </div>
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
