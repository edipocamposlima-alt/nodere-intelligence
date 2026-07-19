"use client";

import { useEffect, useState } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { getApiBaseUrl } from "@/lib/apiBase";

const API_URL = getApiBaseUrl();

export default function SettingsWorkspace() {
  const { workspace, refresh } = useWorkspace();
  const [form, setForm] = useState({ name: "", website: "", phone: "", segment: "", address: "", timezone: "America/Sao_Paulo" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (workspace) {
      setForm({
        name: workspace.name || workspace.nome || "",
        website: workspace.website || "",
        phone: workspace.phone || "",
        segment: workspace.segment || "",
        address: workspace.address || "",
        timezone: workspace.timezone || "America/Sao_Paulo"
      });
    }
  }, [workspace]);

  useEffect(() => {
    async function loadPreferences() {
      try {
        const token = localStorage.getItem("nodere_admin_token") || "";
        const res = await fetch(`${API_URL}/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const payload = await res.json().catch(() => ({}));
        const preferences = payload.preferences || {};
        setForm((current) => ({
          ...current,
          website: preferences.workspaceWebsite ?? current.website,
          phone: preferences.workspacePhone ?? current.phone,
          segment: preferences.workspaceSegment ?? current.segment,
          address: preferences.workspaceAddress ?? current.address,
          timezone: preferences.timezone ?? current.timezone
        }));
      } catch {
        // Workspace base data remains available even if preferences cannot be loaded.
      }
    }
    void loadPreferences();
  }, []);

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      const token = localStorage.getItem("nodere_admin_token") || "";
      const res = await fetch(`${API_URL}/settings/workspace`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      const payload = await res.json().catch(() => ({}));
      setMsg(res.ok ? "✓ Salvo com sucesso." : payload.error || "Erro ao salvar.");
      if (res.ok) await refresh();
    } catch {
      setMsg("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="settings-section">
      <h2>Dados do Workspace</h2>
      {msg && <div className={`settings-msg ${msg.startsWith("✓") ? "success" : "error"}`}>{msg}</div>}
      <div className="form-grid">
        <label>Nome da empresa
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </label>
        <label>Site
          <input value={form.website} placeholder="https://" onChange={(event) => setForm({ ...form, website: event.target.value })} />
        </label>
        <label>Telefone
          <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
        </label>
        <label>Segmento de atuação
          <input value={form.segment} onChange={(event) => setForm({ ...form, segment: event.target.value })} />
        </label>
        <label>Endereço
          <input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
        </label>
        <label>Fuso horário
          <select value={form.timezone} onChange={(event) => setForm({ ...form, timezone: event.target.value })}>
            <option value="America/Sao_Paulo">Brasília (UTC-3)</option>
            <option value="America/Manaus">Manaus (UTC-4)</option>
            <option value="America/Belem">Belém (UTC-3)</option>
          </select>
        </label>
      </div>
      <button onClick={save} disabled={saving} className="btn-primary" type="button">
        {saving ? "Salvando..." : "Salvar alterações"}
      </button>
    </div>
  );
}
