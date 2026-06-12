"use client";

import { useState } from "react";
import SettingsBilling from "@/components/settings/SettingsBilling";
import SettingsIntegrations from "@/components/settings/SettingsIntegrations";
import SettingsNotifications from "@/components/settings/SettingsNotifications";
import SettingsTeam from "@/components/settings/SettingsTeam";
import SettingsWorkspace from "@/components/settings/SettingsWorkspace";
import { useWorkspace } from "@/contexts/WorkspaceContext";

const TABS = [
  { id: "workspace", label: "Workspace" },
  { id: "team", label: "Usuários e Equipes" },
  { id: "integrations", label: "Integrações" },
  { id: "notifications", label: "Notificações" },
  { id: "billing", label: "Plano e Billing" }
];

export default function SettingsPage() {
  const [tab, setTab] = useState("workspace");
  const { user } = useWorkspace();
  const isAdmin = ["admin", "owner"].includes(String(user?.role || ""));

  return (
    <div className="settings-page">
      <h1>Configurações</h1>
      <div className="settings-tabs">
        {TABS.map((item) => (
          <button key={item.id} onClick={() => setTab(item.id)} className={`tab-btn ${tab === item.id ? "active" : ""}`} type="button">
            {item.label}
          </button>
        ))}
      </div>
      <div className="settings-content">
        {tab === "workspace" && <SettingsWorkspace />}
        {tab === "team" && <SettingsTeam />}
        {tab === "integrations" && isAdmin && <SettingsIntegrations />}
        {tab === "integrations" && !isAdmin && <p>Apenas administradores podem gerenciar integrações.</p>}
        {tab === "notifications" && <SettingsNotifications />}
        {tab === "billing" && <SettingsBilling />}
      </div>
    </div>
  );
}
