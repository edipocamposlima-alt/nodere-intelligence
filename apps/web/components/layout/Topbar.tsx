"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  trial: { label: "Trial", color: "var(--warning)" },
  starter: { label: "Starter", color: "var(--info)" },
  pro: { label: "Pro", color: "var(--brand-primary)" },
  agency: { label: "Agency", color: "var(--success)" },
  enterprise: { label: "Enterprise", color: "var(--purple)" },
  locked: { label: "Expirado", color: "var(--danger)" }
};

export default function PlatformTopbar() {
  const { workspace, user } = useWorkspace();
  const router = useRouter();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const workspaceName = workspace?.name || workspace?.nome || "Workspace NODERE";
  const planKey = String(workspace?.plan || workspace?.plano || "trial").toLowerCase();
  const plan = PLAN_LABELS[planKey] || PLAN_LABELS.trial;
  const expiresAt = workspace?.plan_expires_at || workspace?.trial_expires_at || workspace?.expires_at || workspace?.expira_em;
  const daysLeft = planKey === "trial" && expiresAt
    ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000))
    : planKey === "trial" ? 14 : null;

  async function handleLogout() {
    await fetch("/api/auth/session", { method: "DELETE" });
    if (typeof window !== "undefined") {
      localStorage.removeItem("nodere_admin_token");
      localStorage.removeItem("nodere_user_profile");
    }
    router.push("/login");
  }

  useEffect(() => {
    const root = document.documentElement;
    const initial = root.dataset.theme === "light" || root.classList.contains("light") ? "light" : "dark";
    setTheme(initial);
  }, []);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    const root = document.documentElement;
    root.dataset.theme = next;
    root.classList.toggle("light", next === "light");
    root.classList.toggle("dark", next === "dark");
    localStorage.setItem("nodere_theme", next);
    setTheme(next);
    window.dispatchEvent(new Event("nodere:theme-change"));
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="workspace-name">{workspaceName}</span>
        <span className="plan-badge" style={{ background: `${plan.color}20`, color: plan.color }}>
          {plan.label}
          {daysLeft !== null && ` · ${daysLeft}d restantes`}
        </span>
        {daysLeft !== null && daysLeft <= 3 && (
          <a href="/app/upgrade" className="topbar-alert">
            ⚠️ Trial expira em breve → Assinar agora
          </a>
        )}
      </div>
      <div className="topbar-right">
        <button className="topbar-btn topbar-theme" title={theme === "light" ? "Usar tema escuro" : "Usar tema claro"} type="button" onClick={toggleTheme}>
          {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
        </button>
        <button className="topbar-btn" title="Notificações" type="button">🔔</button>
        <div className="user-menu">
          <span className="user-avatar">{user?.name?.charAt(0)?.toUpperCase() || "U"}</span>
          <span className="user-name">{user?.name || user?.email || "Usuário"}</span>
          <button onClick={handleLogout} className="topbar-btn-text" type="button">Sair</button>
        </div>
      </div>
    </header>
  );
}
