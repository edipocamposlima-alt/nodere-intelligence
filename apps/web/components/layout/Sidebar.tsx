"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Logo } from "@/components/ui/Logo";

const NAV_ITEMS = [
  { code: "DISC-01", label: "Prospecção", icon: "🔍", href: "/app/discovery", group: "Descoberta" },
  { code: "CRM-01", label: "Pipeline", icon: "📊", href: "/app/pipeline", group: "CRM" },
  { code: "CRM-02", label: "Leads", icon: "👥", href: "/app/leads", group: "CRM" },
  { code: "CRM-03", label: "Agenda", icon: "📅", href: "/app/agenda", group: "CRM" },
  { code: "CRM-04", label: "Propostas", icon: "📄", href: "/app/proposals", group: "CRM" },
  { code: "ENG-01", label: "WhatsApp", icon: "💬", href: "/app/whatsapp", group: "Comunicação" },
  { code: "ENG-03", label: "E-mail", icon: "✉️", href: "/app/email", group: "Comunicação" },
  { code: "ENG-04", label: "Omnichannel", icon: "📡", href: "/app/inbox", group: "Comunicação" },
  { code: "AI-01", label: "IA Nexus", icon: "🤖", href: "/app/ai", group: "Inteligência" },
  { code: "ANA-01", label: "Dashboard", icon: "📈", href: "/app/analytics", group: "Analytics" },
  { code: "ANA-02", label: "Relatórios", icon: "📋", href: "/app/reports", group: "Analytics" },
  { code: "OPS-01", label: "Projetos", icon: "🗂️", href: "/app/projects", group: "Operações" }
];

export default function PlatformSidebar() {
  const { hasModule, loading } = useWorkspace();
  const pathname = usePathname();
  const groups = NAV_ITEMS.reduce<Record<string, typeof NAV_ITEMS>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  if (loading) return <div className="sidebar sidebar-loading" />;

  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <Link href="/app/dashboard">
          <Logo variant="full" size="md" />
          <span className="logo-text sr-only">NODERI</span>
          <span className="logo-nexus sr-only">Nexus</span>
        </Link>
      </div>

      <div className="sidebar-nav">
        <Link href="/app/dashboard" className={`nav-item ${pathname === "/app/dashboard" ? "active" : ""}`}>
          <span>🏠</span> Dashboard
        </Link>

        {Object.entries(groups).map(([group, items]) => (
          <div key={group} className="nav-group">
            <span className="nav-group-label">{group}</span>
            {items.map((item) => {
              const active = hasModule(item.code);
              return (
                <div key={item.code} className={`nav-item-wrapper ${!active ? "locked" : ""}`}>
                  {active ? (
                    <Link href={item.href} className={`nav-item ${pathname?.startsWith(item.href) ? "active" : ""}`}>
                      <span>{item.icon}</span> {item.label}
                    </Link>
                  ) : (
                    <Link href={`/app/upgrade?module=${item.code}`} className="nav-item nav-item-locked">
                      <span>{item.icon}</span> {item.label}
                      <span className="lock-badge">🔒</span>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <Link href="/app/settings" className={`nav-item ${pathname === "/app/settings" ? "active" : ""}`}>
          <span>⚙️</span> Configurações
        </Link>
      </div>
    </nav>
  );
}
