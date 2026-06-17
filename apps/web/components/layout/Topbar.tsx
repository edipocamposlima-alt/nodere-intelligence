"use client";

import { useRouter } from "next/navigation";
import { useWorkspace } from "@/contexts/WorkspaceContext";

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  trial: { label: "Trial", color: "#f59e0b" },
  starter: { label: "Starter", color: "#6366f1" },
  pro: { label: "Pro", color: "#3b82f6" },
  agency: { label: "Agency", color: "#10b981" },
  enterprise: { label: "Enterprise", color: "#8b5cf6" },
  locked: { label: "Expirado", color: "#ef4444" }
};

export default function PlatformTopbar() {
  const { workspace, user } = useWorkspace();
  const router = useRouter();
  const workspaceName = workspace?.name || workspace?.nome || "Workspace NODERE";
  const planKey = String(workspace?.plan || workspace?.plano || "trial").toLowerCase();
  const plan = PLAN_LABELS[planKey] || PLAN_LABELS.trial;
  const expiresAt = workspace?.plan_expires_at || workspace?.trial_expires_at || workspace?.expires_at || workspace?.expira_em;
  const daysLeft = planKey === "trial" && expiresAt
    ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000))
    : planKey === "trial" ? 14 : null;

  async function handleLogout() {
    await fetch("/api/auth/session", { method: "DELETE" });
    if (typeof window !== "undefined") localStorage.removeItem("nodere_admin_token");
    router.push("/login");
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
